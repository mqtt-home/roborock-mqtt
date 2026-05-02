## Why

The roborock-mqtt application currently relies on Roborock's cloud scheduling, which offers no awareness of context like public holidays, vacation, or absence from home. Users need device-specific cleaning schedules that adapt to different day types — running lighter cleans on weekends, skipping when nobody is home, or adjusting when on vacation. By defining schedules in the config file and enriching them with MQTT-sourced signals (public holidays, vacation status), the system can make smarter, context-aware cleaning decisions without cloud dependency.

## What Changes

- Add a `schedules` section to the per-device configuration, defining cleaning actions for four day types: `normal`, `weekend`, `free` (vacation at home), and `notAtHome`
- Implement a schedule evaluator that determines the active day type using priority: `notAtHome` > `weekend` (includes public holidays) > `free` > `normal`
- Subscribe to MQTT topics for external signals: public holiday status (`rules/public-holiday`) and vacation/free day status (`rules/free-day`)
- Persist `notAtHome` state in a separate data directory (mountable in k8s), alongside existing session data
- Add REST API endpoints for viewing current schedule state and toggling `notAtHome` mode per device
- Add a schedule visualization UI showing the weekly schedule grid with day-type highlighting and the currently active schedule
- Support creating/editing schedules in the UI with a "copy to config" workflow (schedules are defined in config, UI is for visualization and drafting)

## Capabilities

### New Capabilities
- `schedule-config`: Configuration schema for per-device cleaning schedules with day-type definitions and time slots
- `schedule-engine`: Runtime engine that evaluates which day type is active, subscribes to MQTT signals, manages `notAtHome` state, and triggers cleaning actions at scheduled times
- `schedule-ui`: Web UI for visualizing schedules, toggling `notAtHome` mode, and drafting schedule configurations

### Modified Capabilities

_(none — no existing spec-level requirements are changing)_

## Impact

- **Config**: New `schedules` field on per-device configuration; existing configs remain valid (schedules are optional)
- **MQTT**: New subscriptions to external signal topics (`rules/feiertag`, `rules/urlaub`); new published topic for schedule state
- **REST API**: New endpoints under `/api/devices/{slug}/schedule`
- **Web UI**: New schedule section/tab in the device view
- **Persistence**: New file(s) in the data directory for `notAtHome` state
- **Dependencies**: May need a cron/time library for Go (e.g., `robfig/cron`) or use stdlib `time.Ticker` with daily evaluation
