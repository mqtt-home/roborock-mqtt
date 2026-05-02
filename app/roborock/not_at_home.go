package roborock

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"

	"github.com/philipparndt/go-logger"
)

// NotAtHomeStore manages the global not-at-home state with file persistence.
type NotAtHomeStore struct {
	filePath string
	notAtHome bool
	mu       sync.RWMutex
}

// NewNotAtHomeStore creates a new store, loading existing state from disk if available.
func NewNotAtHomeStore(dataDir string) *NotAtHomeStore {
	dir := filepath.Join(dataDir, "schedules")
	store := &NotAtHomeStore{
		filePath: filepath.Join(dir, "not-at-home.json"),
	}
	store.load()
	return store
}

// Get returns the global not-at-home state.
func (s *NotAtHomeStore) Get() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.notAtHome
}

// Set updates the global not-at-home state and persists to disk.
func (s *NotAtHomeStore) Set(notAtHome bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.notAtHome = notAtHome
	s.save()
}

type notAtHomeFile struct {
	NotAtHome bool `json:"not_at_home"`
}

func (s *NotAtHomeStore) load() {
	data, err := os.ReadFile(s.filePath)
	if err != nil {
		return
	}
	var f notAtHomeFile
	if err := json.Unmarshal(data, &f); err != nil {
		logger.Warn("Failed to parse not-at-home state", "error", err)
		return
	}
	s.notAtHome = f.NotAtHome
}

func (s *NotAtHomeStore) save() {
	dir := filepath.Dir(s.filePath)
	if err := os.MkdirAll(dir, 0700); err != nil {
		logger.Error("Failed to create schedules directory", "error", err)
		return
	}
	data, err := json.MarshalIndent(notAtHomeFile{NotAtHome: s.notAtHome}, "", "  ")
	if err != nil {
		logger.Error("Failed to marshal not-at-home state", "error", err)
		return
	}
	if err := os.WriteFile(s.filePath, data, 0600); err != nil {
		logger.Error("Failed to save not-at-home state", "error", err)
	}
}
