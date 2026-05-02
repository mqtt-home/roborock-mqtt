package roborock

import "github.com/mqtt-home/roborock-mqtt/config"

// ComputeConsumablePercents calculates remaining percentage for each consumable.
func ComputeConsumablePercents(c *ConsumableStatus) ConsumablePercents {
	cfg := config.Get()
	lifetimes := cfg.Notifications.ConsumableLifetimes
	return ConsumablePercents{
		MainBrush:      remainingPercent(c.MainBrushWorkTime, lifetimes.MainBrush),
		SideBrush:      remainingPercent(c.SideBrushWorkTime, lifetimes.SideBrush),
		Filter:         remainingPercent(c.FilterWorkTime, lifetimes.Filter),
		Sensor:         remainingPercent(c.SensorDirtyTime, lifetimes.Sensor),
		DustCollection: remainingPercent(c.DustCollectionWorkTimes, lifetimes.DustCollection),
	}
}

func remainingPercent(workTime, lifetime int) int {
	if lifetime <= 0 {
		return 100
	}
	pct := 100 - (workTime * 100 / lifetime)
	if pct < 0 {
		return 0
	}
	if pct > 100 {
		return 100
	}
	return pct
}
