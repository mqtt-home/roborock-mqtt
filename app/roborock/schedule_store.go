package roborock

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/mqtt-home/roborock-mqtt/config"
	"github.com/philipparndt/go-logger"
)

// ScheduleStore manages user-created schedules persisted in the data directory.
type ScheduleStore struct {
	dir       string
	schedules map[string]config.DeviceSchedule // keyed by device name
	mu        sync.RWMutex
}

// NewScheduleStore creates a store and loads existing user schedules from disk.
func NewScheduleStore(dataDir string) *ScheduleStore {
	store := &ScheduleStore{
		dir:       filepath.Join(dataDir, "schedules", "devices"),
		schedules: make(map[string]config.DeviceSchedule),
	}
	store.loadAll()
	return store
}

// Get returns the user schedule for a device, or nil if none exists.
func (s *ScheduleStore) Get(deviceName string) *config.DeviceSchedule {
	s.mu.RLock()
	defer s.mu.RUnlock()
	sched, ok := s.schedules[deviceName]
	if !ok {
		return nil
	}
	return &sched
}

// Has returns true if a user schedule exists for the device.
func (s *ScheduleStore) Has(deviceName string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	_, ok := s.schedules[deviceName]
	return ok
}

// Save creates or updates a user schedule for a device.
func (s *ScheduleStore) Save(deviceName string, sched config.DeviceSchedule) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if err := os.MkdirAll(s.dir, 0700); err != nil {
		return err
	}

	data, err := json.MarshalIndent(sched, "", "  ")
	if err != nil {
		return err
	}

	file := filepath.Join(s.dir, deviceName+".json")
	if err := os.WriteFile(file, data, 0600); err != nil {
		return err
	}

	s.schedules[deviceName] = sched
	logger.Info("Saved user schedule", "device", deviceName)
	return nil
}

// Delete removes a user schedule for a device.
func (s *ScheduleStore) Delete(deviceName string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.schedules[deviceName]; !ok {
		return os.ErrNotExist
	}

	file := filepath.Join(s.dir, deviceName+".json")
	if err := os.Remove(file); err != nil && !os.IsNotExist(err) {
		return err
	}

	delete(s.schedules, deviceName)
	logger.Info("Deleted user schedule", "device", deviceName)
	return nil
}

// GetAll returns a copy of all user schedules.
func (s *ScheduleStore) GetAll() map[string]config.DeviceSchedule {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make(map[string]config.DeviceSchedule, len(s.schedules))
	for k, v := range s.schedules {
		result[k] = v
	}
	return result
}

func (s *ScheduleStore) loadAll() {
	entries, err := os.ReadDir(s.dir)
	if err != nil {
		return
	}

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}

		deviceName := strings.TrimSuffix(entry.Name(), ".json")
		data, err := os.ReadFile(filepath.Join(s.dir, entry.Name()))
		if err != nil {
			logger.Warn("Failed to read user schedule", "file", entry.Name(), "error", err)
			continue
		}

		var sched config.DeviceSchedule
		if err := json.Unmarshal(data, &sched); err != nil {
			logger.Warn("Failed to parse user schedule", "file", entry.Name(), "error", err)
			continue
		}

		s.schedules[deviceName] = sched
		logger.Info("Loaded user schedule", "device", deviceName)
	}
}
