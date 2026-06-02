package roborock

import (
	"testing"
	"time"
)

func cleaning(mode, cleanTime int) *DeviceStatus {
	return &DeviceStatus{InCleaning: mode, CleanTime: cleanTime}
}

func idle() *DeviceStatus {
	return &DeviceStatus{InCleaning: 0}
}

func TestRunTrackerEstimatesFromPreviousRun(t *testing.T) {
	rt := NewRunTracker(t.TempDir())

	// First full run: no reference yet, so no estimate is published.
	ps := &PublishedStatus{}
	rt.Update("vac", cleaning(1, 60), ps)
	if ps.RemainingMinutes != nil || ps.TimeCompleted != nil {
		t.Fatalf("expected no estimate on first run, got %v / %v", ps.RemainingMinutes, ps.TimeCompleted)
	}
	rt.Update("vac", cleaning(1, 600), ps) // 10 min elapsed
	rt.Update("vac", idle(), &PublishedStatus{})

	if got := rt.durations["vac"]["full"]; got != 600 {
		t.Fatalf("expected stored duration 600s, got %d", got)
	}

	// Second full run at 120s elapsed -> remaining 480s -> 8 min.
	ps2 := &PublishedStatus{}
	rt.Update("vac", cleaning(1, 120), ps2)
	if ps2.RemainingMinutes == nil || *ps2.RemainingMinutes != 8 {
		t.Fatalf("expected remaining 8 min, got %v", ps2.RemainingMinutes)
	}
	if ps2.Program == nil || *ps2.Program != "full" {
		t.Fatalf("expected program 'full', got %v", ps2.Program)
	}
	if ps2.RecordedMinutes == nil || *ps2.RecordedMinutes != 10 {
		t.Fatalf("expected recorded 10 min, got %v", ps2.RecordedMinutes)
	}
	if ps2.TimeCompleted == nil {
		t.Fatal("expected time_completed to be set")
	}
	completed, err := time.Parse(time.RFC3339, *ps2.TimeCompleted)
	if err != nil {
		t.Fatalf("time_completed not RFC3339: %v", err)
	}
	if completed.Before(time.Now().Add(-time.Minute)) {
		t.Fatalf("time_completed should be ~now+remaining, got %s", *ps2.TimeCompleted)
	}
}

func TestRunTrackerIgnoresShortRuns(t *testing.T) {
	rt := NewRunTracker(t.TempDir())
	rt.Update("vac", cleaning(1, 30), &PublishedStatus{}) // below minRunSeconds
	rt.Update("vac", idle(), &PublishedStatus{})
	if _, ok := rt.durations["vac"]["full"]; ok {
		t.Fatal("short run should not be recorded")
	}
}

func TestRunTrackerClampsRemaining(t *testing.T) {
	rt := NewRunTracker(t.TempDir())
	rt.durations = map[string]map[string]int{"vac": {"full": 300}}
	ps := &PublishedStatus{}
	rt.Update("vac", cleaning(1, 600), ps) // elapsed beyond reference
	if ps.RemainingMinutes == nil || *ps.RemainingMinutes != 0 {
		t.Fatalf("expected remaining 0, got %v", ps.RemainingMinutes)
	}
}

func TestRunTrackerSceneKey(t *testing.T) {
	rt := NewRunTracker(t.TempDir())
	rt.NoteSceneStarted(42)
	rt.Update("vac", cleaning(1, 60), &PublishedStatus{})
	if run := rt.active["vac"]; run == nil || run.key != "scene:42" {
		t.Fatalf("expected scene:42 key, got %+v", run)
	}
}

func TestRunTrackerSegmentKeySorted(t *testing.T) {
	rt := NewRunTracker(t.TempDir())
	rt.NoteSegmentClean("vac", []int{17, 16})
	rt.Update("vac", cleaning(3, 60), &PublishedStatus{})
	if run := rt.active["vac"]; run == nil || run.key != "seg:16-17" {
		t.Fatalf("expected seg:16-17 key, got %+v", run)
	}
}

func TestRunTrackerFallbackByMode(t *testing.T) {
	rt := NewRunTracker(t.TempDir())
	rt.Update("vac", cleaning(2, 60), &PublishedStatus{})
	if run := rt.active["vac"]; run == nil || run.key != "zone" {
		t.Fatalf("expected zone key, got %+v", run)
	}
}

func TestRunTrackerExpiredIntentFallsBack(t *testing.T) {
	rt := NewRunTracker(t.TempDir())
	rt.pendingScene = &sceneIntent{sceneID: 7, at: time.Now().Add(-2 * intentTTL)}
	rt.Update("vac", cleaning(1, 60), &PublishedStatus{})
	if run := rt.active["vac"]; run == nil || run.key != "full" {
		t.Fatalf("expected fallback to full after expiry, got %+v", run)
	}
}

func TestRunTrackerPersistsAcrossReload(t *testing.T) {
	dir := t.TempDir()
	rt := NewRunTracker(dir)
	rt.Update("vac", cleaning(1, 600), &PublishedStatus{})
	rt.Update("vac", idle(), &PublishedStatus{})

	reloaded := NewRunTracker(dir)
	if got := reloaded.durations["vac"]["full"]; got != 600 {
		t.Fatalf("expected persisted duration 600s, got %d", got)
	}
}
