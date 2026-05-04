package roborock

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/philipparndt/go-logger"
)

// NotificationEntry tracks the last notification sent for a consumable.
type NotificationEntry struct {
	LastNotifiedPercent int       `json:"last_notified_percent"`
	WorkTimeAtNotify    int       `json:"work_time_at_notify"`
	NotifiedAt          time.Time `json:"notified_at"`
}

// NotificationState tracks sent notifications per device per consumable.
type NotificationState struct {
	filePath string
	state    map[string]map[string]*NotificationEntry // device -> consumable -> entry
	mu       sync.RWMutex
}

// NewNotificationState creates a notification state tracker.
func NewNotificationState(dataDir string) *NotificationState {
	dir := filepath.Join(dataDir, "notifications")
	ns := &NotificationState{
		filePath: filepath.Join(dir, "state.json"),
		state:    make(map[string]map[string]*NotificationEntry),
	}
	ns.load()
	return ns
}

// Get returns the notification entry for a device/consumable pair.
func (ns *NotificationState) Get(deviceName, consumable string) *NotificationEntry {
	ns.mu.RLock()
	defer ns.mu.RUnlock()
	if dev, ok := ns.state[deviceName]; ok {
		return dev[consumable]
	}
	return nil
}

// Set records a notification sent for a device/consumable.
func (ns *NotificationState) Set(deviceName, consumable string, percent, workTime int) {
	ns.mu.Lock()
	defer ns.mu.Unlock()
	if ns.state[deviceName] == nil {
		ns.state[deviceName] = make(map[string]*NotificationEntry)
	}
	ns.state[deviceName][consumable] = &NotificationEntry{
		LastNotifiedPercent: percent,
		WorkTimeAtNotify:    workTime,
		NotifiedAt:          time.Now(),
	}
	ns.save()
}

// Clear removes the notification state for a device/consumable (e.g., after reset).
func (ns *NotificationState) Clear(deviceName, consumable string) {
	ns.mu.Lock()
	defer ns.mu.Unlock()
	if dev, ok := ns.state[deviceName]; ok {
		delete(dev, consumable)
		if len(dev) == 0 {
			delete(ns.state, deviceName)
		}
	}
	ns.save()
}

// ClearDevice removes all notification state for a device.
func (ns *NotificationState) ClearDevice(deviceName string) {
	ns.mu.Lock()
	defer ns.mu.Unlock()
	delete(ns.state, deviceName)
	ns.save()
}

func (ns *NotificationState) load() {
	data, err := os.ReadFile(ns.filePath)
	if err != nil {
		return
	}
	if err := json.Unmarshal(data, &ns.state); err != nil {
		logger.Warn("Failed to parse notification state", "error", err)
		ns.state = make(map[string]map[string]*NotificationEntry)
	}
}

func (ns *NotificationState) save() {
	dir := filepath.Dir(ns.filePath)
	if err := os.MkdirAll(dir, 0700); err != nil {
		logger.Error("Failed to create notifications directory", "error", err)
		return
	}
	data, err := json.MarshalIndent(ns.state, "", "  ")
	if err != nil {
		logger.Error("Failed to marshal notification state", "error", err)
		return
	}
	if err := os.WriteFile(ns.filePath, data, 0600); err != nil {
		logger.Error("Failed to save notification state", "error", err)
	}
}
