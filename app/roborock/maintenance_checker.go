package roborock

import (
	"fmt"

	"github.com/mqtt-home/roborock-mqtt/config"
	"github.com/philipparndt/go-logger"
)

// MaintenanceChecker checks consumable thresholds and sends notifications.
type MaintenanceChecker struct {
	state *NotificationState
}

// NewMaintenanceChecker creates a new maintenance checker.
func NewMaintenanceChecker(dataDir string) *MaintenanceChecker {
	return &MaintenanceChecker{
		state: NewNotificationState(dataDir),
	}
}

// ClearConsumable clears notification state for a consumable (after reset).
func (mc *MaintenanceChecker) ClearConsumable(deviceName, consumable string) {
	mc.state.Clear(deviceName, consumable)
}

// Check evaluates consumable levels and sends notifications if thresholds are crossed.
func (mc *MaintenanceChecker) Check(deviceName string, percents *ConsumablePercents, consumables *ConsumableStatus) {
	cfg := config.Get()
	if !cfg.Notifications.Email.Enabled {
		return
	}

	thresholds := cfg.Notifications.Thresholds
	items := []struct {
		name     string
		percent  int
		workTime int
	}{
		{"main_brush", percents.MainBrush, consumables.MainBrushWorkTime},
		{"side_brush", percents.SideBrush, consumables.SideBrushWorkTime},
		{"filter", percents.Filter, consumables.FilterWorkTime},
		{"sensor", percents.Sensor, consumables.SensorDirtyTime},
		{"dust_collection", percents.DustCollection, consumables.DustCollectionWorkTimes},
	}

	for _, item := range items {
		mc.checkItem(deviceName, item.name, item.percent, item.workTime, thresholds)
	}
}

func (mc *MaintenanceChecker) checkItem(deviceName, name string, percent, workTime int, thresholds config.ThresholdConfig) {
	entry := mc.state.Get(deviceName, name)

	// Detect reset: work time dropped significantly from last notify
	if entry != nil && workTime < entry.WorkTimeAtNotify/2 {
		logger.Info("Consumable appears reset, clearing notification state", "device", deviceName, "consumable", name)
		mc.state.Clear(deviceName, name)
		entry = nil
	}

	var severity string
	var threshold int

	if percent <= thresholds.CriticalPercent {
		severity = "Critical"
		threshold = thresholds.CriticalPercent
	} else if percent <= thresholds.WarnPercent {
		severity = "Warning"
		threshold = thresholds.WarnPercent
	} else {
		return
	}

	// Check if already notified at this level
	if entry != nil && entry.LastNotifiedPercent <= threshold {
		return
	}

	var usageStr string
	if name == "dust_collection" {
		usageStr = fmt.Sprintf("Cycles: %d", workTime)
	} else {
		usageStr = fmt.Sprintf("Hours used: %d", workTime/3600)
	}

	subject := fmt.Sprintf("[%s] %s - %s maintenance required", severity, deviceName, consumablePrettyName(name))
	body := fmt.Sprintf(
		"%s maintenance alert for device \"%s\":\n\n"+
			"Consumable: %s\n"+
			"Remaining: %d%%\n"+
			"%s\n\n"+
			"Please replace or clean this component.",
		severity, deviceName, consumablePrettyName(name), percent, usageStr,
	)

	if err := SendEmail(subject, body); err != nil {
		logger.Error("Failed to send maintenance notification", "device", deviceName, "consumable", name, "error", err)
		return
	}

	mc.state.Set(deviceName, name, threshold, workTime)
}

func consumablePrettyName(name string) string {
	switch name {
	case "main_brush":
		return "Main Brush"
	case "side_brush":
		return "Side Brush"
	case "filter":
		return "Filter"
	case "sensor":
		return "Sensor"
	case "dust_collection":
		return "Dust Collection"
	}
	return name
}
