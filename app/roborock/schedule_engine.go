package roborock

import (
	"fmt"
	"time"

	"github.com/mqtt-home/roborock-mqtt/config"
	"github.com/philipparndt/go-logger"
)

var berlinTZ *time.Location

func init() {
	var err error
	berlinTZ, err = time.LoadLocation("Europe/Berlin")
	if err != nil {
		panic(fmt.Sprintf("failed to load Europe/Berlin timezone: %v", err))
	}
}

// ScheduleEngine evaluates schedules and dispatches actions at the right times.
type ScheduleEngine struct {
	provisioned    map[string]config.DeviceSchedule // from config, read-only
	store          *ScheduleStore                   // user-created, writable
	schedules      map[string]config.DeviceSchedule // merged (active)
	sources        map[string]ScheduleSource        // source per device name
	deviceManager  *DeviceManager
	signals        *SignalListener
	notAtHome      *NotAtHomeStore
	onStateChange  func(slug string, state *ScheduleState)
	onAction       func(slug string, state *ScheduleState)
	lastDayTypes   map[string]DayType // track day type per device name for change detection
}

// NewScheduleEngine creates a schedule engine from provisioned config and user store.
func NewScheduleEngine(
	provisioned map[string]config.DeviceSchedule,
	store *ScheduleStore,
	dm *DeviceManager,
	signals *SignalListener,
	notAtHome *NotAtHomeStore,
) *ScheduleEngine {
	se := &ScheduleEngine{
		provisioned:   provisioned,
		store:         store,
		deviceManager: dm,
		signals:       signals,
		notAtHome:     notAtHome,
		lastDayTypes:  make(map[string]DayType),
	}
	se.RebuildSchedules()
	return se
}

// RebuildSchedules merges provisioned and user schedules. User wins per device.
func (se *ScheduleEngine) RebuildSchedules() {
	merged := make(map[string]config.DeviceSchedule)
	sources := make(map[string]ScheduleSource)

	// Start with provisioned
	for name, sched := range se.provisioned {
		merged[name] = sched
		sources[name] = SourceProvisioned
	}

	// User schedules override
	if se.store != nil {
		for name, sched := range se.store.GetAll() {
			merged[name] = sched
			sources[name] = SourceUser
		}
	}

	se.schedules = merged
	se.sources = sources
}

// GetSourceForDevice returns the schedule source for a device name.
func (se *ScheduleEngine) GetSourceForDevice(deviceName string) ScheduleSource {
	if src, ok := se.sources[deviceName]; ok {
		return src
	}
	return SourceNone
}

// SetStateChangeCallback sets the function called when a device's day type changes.
func (se *ScheduleEngine) SetStateChangeCallback(cb func(slug string, state *ScheduleState)) {
	se.onStateChange = cb
}

// SetActionCallback sets the function called when a scheduled action executes.
func (se *ScheduleEngine) SetActionCallback(cb func(slug string, state *ScheduleState)) {
	se.onAction = cb
}

// ResolveDayType determines the active day type for a device.
func (se *ScheduleEngine) ResolveDayType(deviceName string) DayType {
	now := time.Now().In(berlinTZ)

	if se.notAtHome.Get() {
		return DayTypeNotAtHome
	}

	weekday := now.Weekday()
	if weekday == time.Saturday || weekday == time.Sunday || se.signals.IsHoliday() {
		return DayTypeWeekend
	}

	if se.signals.IsVacation() {
		return DayTypeFree
	}

	return DayTypeNormal
}

// GetSlotsForDayType returns the time slots for a given device and day type.
func (se *ScheduleEngine) GetSlotsForDayType(deviceName string, dayType DayType) []config.TimeSlot {
	sched, ok := se.schedules[deviceName]
	if !ok {
		return nil
	}
	switch dayType {
	case DayTypeNormal:
		return sched.Normal
	case DayTypeWeekend:
		return sched.Weekend
	case DayTypeFree:
		return sched.Free
	case DayTypeNotAtHome:
		return sched.NotAtHome
	}
	return nil
}

// GetScheduleState computes the current schedule state for a device.
func (se *ScheduleEngine) GetScheduleState(deviceName, slug string) *ScheduleState {
	dayType := se.ResolveDayType(deviceName)
	slots := se.GetSlotsForDayType(deviceName, dayType)

	state := &ScheduleState{
		Device:    slug,
		Source:    se.GetSourceForDevice(deviceName),
		ActiveDay: dayType,
		NotAtHome: se.notAtHome.Get(),
		Holiday:   se.signals.IsHoliday(),
		Vacation:  se.signals.IsVacation(),
	}

	now := time.Now().In(berlinTZ)
	nowHHMM := now.Format("15:04")

	for _, slot := range slots {
		if slot.Time > nowHHMM {
			state.NextAction = &NextAction{
				Time:    slot.Time,
				Action:  slot.Action,
				SceneID: slot.SceneID,
			}
			break
		}
	}

	return state
}

// GetAllScheduleStates returns schedule states for all configured devices.
func (se *ScheduleEngine) GetAllScheduleStates() []*ScheduleState {
	var states []*ScheduleState
	for deviceName := range se.schedules {
		slug := se.findSlugForDevice(deviceName)
		if slug == "" {
			continue
		}
		states = append(states, se.GetScheduleState(deviceName, slug))
	}
	return states
}

// HasSchedule returns true if the given device name has a schedule configured.
func (se *ScheduleEngine) HasSchedule(deviceName string) bool {
	_, ok := se.schedules[deviceName]
	return ok
}

// HasScheduleForSlug returns true if the given slug corresponds to a device with a schedule.
func (se *ScheduleEngine) HasScheduleForSlug(slug string) bool {
	name := se.findDeviceNameForSlug(slug)
	return name != ""
}

// HasAnyScheduleForSlug checks both provisioned and user sources for a slug.
func (se *ScheduleEngine) HasAnyScheduleForSlug(slug string) bool {
	if se.deviceManager == nil {
		return false
	}
	dev := se.deviceManager.GetDevice(slug)
	if dev == nil {
		return false
	}
	name := dev.Info.Name
	if _, ok := se.schedules[name]; ok {
		return true
	}
	if _, ok := se.provisioned[name]; ok {
		return true
	}
	if se.store != nil && se.store.Has(name) {
		return true
	}
	return false
}

// GetScheduleStateForSlug computes the schedule state for a device identified by slug.
func (se *ScheduleEngine) GetScheduleStateForSlug(slug string) *ScheduleState {
	name := se.findDeviceNameForSlug(slug)
	if name == "" {
		return nil
	}
	return se.GetScheduleState(name, slug)
}

// GetDeviceScheduleForSlug returns the config schedule for a device identified by slug.
func (se *ScheduleEngine) GetDeviceScheduleForSlug(slug string) *config.DeviceSchedule {
	name := se.findDeviceNameForSlug(slug)
	if name == "" {
		return nil
	}
	sched, ok := se.schedules[name]
	if !ok {
		return nil
	}
	return &sched
}

// CheckAndDispatch checks all schedules against the current time and dispatches matching actions.
func (se *ScheduleEngine) CheckAndDispatch() {
	now := time.Now().In(berlinTZ)
	currentTime := now.Format("15:04")

	for deviceName := range se.schedules {
		slug := se.findSlugForDevice(deviceName)
		if slug == "" {
			continue
		}

		dayType := se.ResolveDayType(deviceName)

		// Detect day type changes
		if last, ok := se.lastDayTypes[deviceName]; ok && last != dayType {
			logger.Info("Day type changed", "device", deviceName, "from", last, "to", dayType)
			state := se.GetScheduleState(deviceName, slug)
			if se.onStateChange != nil {
				se.onStateChange(slug, state)
			}
		}
		se.lastDayTypes[deviceName] = dayType

		slots := se.GetSlotsForDayType(deviceName, dayType)
		for _, slot := range slots {
			if slot.Time == currentTime {
				logger.Info("Schedule triggered", "device", deviceName, "slug", slug, "time", slot.Time, "action", slot.Action, "dayType", dayType)
				se.dispatchAction(slug, slot)
				state := se.GetScheduleState(deviceName, slug)
				if se.onAction != nil {
					se.onAction(slug, state)
				}
			}
		}
	}
}

// CheckDayTypeChanges detects day type changes for all devices and fires callbacks.
func (se *ScheduleEngine) CheckDayTypeChanges() {
	for deviceName := range se.schedules {
		slug := se.findSlugForDevice(deviceName)
		if slug == "" {
			continue
		}
		dayType := se.ResolveDayType(deviceName)
		if last, ok := se.lastDayTypes[deviceName]; ok && last != dayType {
			logger.Info("Day type changed", "device", deviceName, "from", last, "to", dayType)
			se.lastDayTypes[deviceName] = dayType
			state := se.GetScheduleState(deviceName, slug)
			if se.onStateChange != nil {
				se.onStateChange(slug, state)
			}
		}
	}
}

// StartTicker starts the minute-precision ticker. Blocks until stop is closed.
func (se *ScheduleEngine) StartTicker(stop chan struct{}) {
	// Initialize last day types
	for deviceName := range se.schedules {
		se.lastDayTypes[deviceName] = se.ResolveDayType(deviceName)
	}

	// Log matched schedules
	for deviceName := range se.schedules {
		slug := se.findSlugForDevice(deviceName)
		if slug == "" {
			logger.Warn("Schedule configured for unknown device", "device", deviceName)
		} else {
			logger.Info("Schedule active", "device", deviceName, "slug", slug)
		}
	}

	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			se.CheckAndDispatch()
		case <-stop:
			return
		}
	}
}

func (se *ScheduleEngine) dispatchAction(slug string, slot config.TimeSlot) {
	dev := se.deviceManager.GetDevice(slug)
	if dev == nil || dev.CloudMQTT == nil {
		logger.Warn("Cannot dispatch scheduled action, device not connected", "slug", slug)
		return
	}

	var err error
	switch slot.Action {
	case "start":
		err = dev.CloudMQTT.Start()
	case "scene":
		err = se.deviceManager.ExecuteScene(slot.SceneID)
	default:
		logger.Warn("Unknown schedule action", "slug", slug, "action", slot.Action)
		return
	}

	if err != nil {
		logger.Error("Scheduled action failed", "slug", slug, "action", slot.Action, "error", err)
	}
}

func (se *ScheduleEngine) findSlugForDevice(deviceName string) string {
	if se.deviceManager == nil {
		return ""
	}
	for _, md := range se.deviceManager.GetDevices() {
		if md.Info.Name == deviceName {
			return md.Slug
		}
	}
	return ""
}

func (se *ScheduleEngine) findDeviceNameForSlug(slug string) string {
	if se.deviceManager == nil {
		return ""
	}
	dev := se.deviceManager.GetDevice(slug)
	if dev == nil {
		return ""
	}
	// Check this device has a schedule
	if _, ok := se.schedules[dev.Info.Name]; ok {
		return dev.Info.Name
	}
	return ""
}
