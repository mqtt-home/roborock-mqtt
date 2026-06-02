package roborock

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/philipparndt/go-logger"
)

const (
	// intentTTL is how long a dispatched clean command stays associated with the
	// next detected cleaning run before it is considered stale.
	intentTTL = 3 * time.Minute
	// minRunSeconds filters out false starts and quick aborts so they do not
	// pollute the stored reference duration.
	minRunSeconds = 60
)

// RunTracker estimates cleaning completion time from how long previous runs of
// the same program took. Roborock does not report an ETA, so we record the
// duration of each completed run (keyed by the program that started it) and use
// the last known duration to project the remaining time on the current run.
//
// The program key is, in order of preference:
//   - "scene:<id>"  — a scene we triggered (app or schedule)
//   - "seg:<a>-<b>" — a segment clean we triggered, keyed by the rooms
//   - "full"/"zone"/"segment" — fallback derived from the cleaning mode when the
//     run was started outside this bridge (e.g. the Roborock app)
type RunTracker struct {
	filePath     string
	mu           sync.Mutex
	durations    map[string]map[string]int // slug -> runKey -> seconds (persisted)
	active       map[string]*activeRun     // slug -> current run (in-memory)
	pending      map[string]pendingIntent  // slug -> per-device intent (in-memory)
	pendingScene *sceneIntent              // home-wide scene intent (in-memory)
}

type activeRun struct {
	key          string
	maxCleanTime int
}

type pendingIntent struct {
	key string
	at  time.Time
}

type sceneIntent struct {
	sceneID int
	at      time.Time
}

// NewRunTracker creates a run tracker persisting to dataDir/run_durations/state.json.
func NewRunTracker(dataDir string) *RunTracker {
	rt := &RunTracker{
		filePath:  filepath.Join(dataDir, "run_durations", "state.json"),
		durations: make(map[string]map[string]int),
		active:    make(map[string]*activeRun),
		pending:   make(map[string]pendingIntent),
	}
	rt.load()
	return rt
}

// NoteSegmentClean records that a segment clean was triggered for a device, so
// the resulting run is keyed by the specific rooms rather than the generic mode.
func (rt *RunTracker) NoteSegmentClean(slug string, segments []int) {
	rt.mu.Lock()
	defer rt.mu.Unlock()
	rt.pending[slug] = pendingIntent{key: segmentKey(segments), at: time.Now()}
}

// NoteSceneStarted records that a scene was triggered (home-wide). The next run
// that starts on any device adopts this scene as its program key.
func (rt *RunTracker) NoteSceneStarted(sceneID int) {
	rt.mu.Lock()
	defer rt.mu.Unlock()
	rt.pendingScene = &sceneIntent{sceneID: sceneID, at: time.Now()}
}

// Update advances the run state machine for a device and, while cleaning, fills
// RemainingMinutes and TimeCompleted on the published status from the last known
// duration of the current program.
func (rt *RunTracker) Update(slug string, status *DeviceStatus, published *PublishedStatus) {
	rt.mu.Lock()
	defer rt.mu.Unlock()

	if status.InCleaning <= 0 {
		// Run ended (or was never running). Record its duration once.
		if run := rt.active[slug]; run != nil {
			if run.maxCleanTime >= minRunSeconds {
				rt.setDuration(slug, run.key, run.maxCleanTime)
				logger.Info("Cleaning run completed",
					"device", slug, "program", run.key, "duration_min", run.maxCleanTime/60)
			}
			delete(rt.active, slug)
		}
		return
	}

	run := rt.active[slug]
	if run == nil {
		run = &activeRun{key: rt.resolveRunKey(slug, status)}
		rt.active[slug] = run
		logger.Info("Cleaning run started", "device", slug, "program", run.key)
	}
	run.maxCleanTime = max(run.maxCleanTime, status.CleanTime)

	program := run.key
	published.Program = &program

	// Without a reference duration we cannot estimate yet (first run of a program).
	last := rt.durations[slug][run.key]
	if last <= 0 {
		return
	}

	recorded := int(math.Round(float64(last) / 60.0))
	published.RecordedMinutes = &recorded

	remaining := last - status.CleanTime
	if remaining < 0 {
		remaining = 0
	}
	mins := int(math.Ceil(float64(remaining) / 60.0))
	completed := time.Now().In(berlinTZ).Add(time.Duration(remaining) * time.Second).Format(time.RFC3339)
	published.RemainingMinutes = &mins
	published.TimeCompleted = &completed
}

// resolveRunKey determines the program key for a newly detected run. Must be
// called with rt.mu held.
func (rt *RunTracker) resolveRunKey(slug string, status *DeviceStatus) string {
	now := time.Now()

	// A command we dispatched for this device wins (segment clean).
	if intent, ok := rt.pending[slug]; ok {
		delete(rt.pending, slug)
		if now.Sub(intent.at) <= intentTTL {
			return intent.key
		}
	}

	// A scene we triggered is home-wide; the first run to start consumes it.
	if rt.pendingScene != nil {
		intent := rt.pendingScene
		rt.pendingScene = nil
		if now.Sub(intent.at) <= intentTTL {
			return fmt.Sprintf("scene:%d", intent.sceneID)
		}
	}

	// Started outside this bridge: fall back to the cleaning mode.
	switch status.InCleaning {
	case 2:
		return "zone"
	case 3:
		return "segment"
	default:
		return "full"
	}
}

func (rt *RunTracker) setDuration(slug, key string, seconds int) {
	if rt.durations[slug] == nil {
		rt.durations[slug] = make(map[string]int)
	}
	rt.durations[slug][key] = seconds
	rt.save()
}

func segmentKey(segments []int) string {
	if len(segments) == 0 {
		return "segment"
	}
	sorted := make([]int, len(segments))
	copy(sorted, segments)
	sort.Ints(sorted)
	parts := make([]string, len(sorted))
	for i, v := range sorted {
		parts[i] = strconv.Itoa(v)
	}
	return "seg:" + strings.Join(parts, "-")
}

func (rt *RunTracker) load() {
	data, err := os.ReadFile(rt.filePath)
	if err != nil {
		return
	}
	if err := json.Unmarshal(data, &rt.durations); err != nil {
		logger.Warn("Failed to parse run duration state", "error", err)
		rt.durations = make(map[string]map[string]int)
	}
}

func (rt *RunTracker) save() {
	dir := filepath.Dir(rt.filePath)
	if err := os.MkdirAll(dir, 0700); err != nil {
		logger.Error("Failed to create run_durations directory", "error", err)
		return
	}
	data, err := json.MarshalIndent(rt.durations, "", "  ")
	if err != nil {
		logger.Error("Failed to marshal run duration state", "error", err)
		return
	}
	if err := os.WriteFile(rt.filePath, data, 0600); err != nil {
		logger.Error("Failed to save run duration state", "error", err)
	}
}
