## Context

The roborock-mqtt application bridges Roborock vacuum robots to a local MQTT broker and provides a web UI for control. Currently, cleaning is triggered manually (via UI, MQTT command, or Roborock cloud scenes). There is no local scheduling — users rely on the Roborock app's built-in schedules, which have no awareness of external context like public holidays, vacation, or absence.

The application already has:
- Per-device management with slug-based identification (`DeviceManager`)
- JSON config file with env variable substitution (`config.go`)
- A session/data directory (`.session/`) for persistent state
- Local MQTT subscriptions for commands and external signal topics
- SSE-based real-time frontend updates
- Scene execution for complex cleaning programs

## Goals / Non-Goals

**Goals:**
- Allow users to define per-device cleaning schedules in the JSON config file
- Support four day types with clear priority: `notAtHome` > `weekend` > `free` > `normal`
- Automatically detect `weekend` (Saturday/Sunday + public holiday via MQTT), `free` (vacation via MQTT)
- Allow manual `notAtHome` toggle via UI, persisted in the data directory
- Visualize the active schedule and day type in the web UI
- Allow drafting schedules in the UI for manual copy to config
- Execute the appropriate cleaning action (scene or direct command) at scheduled times

**Non-Goals:**
- Editing the config file from the UI (schedules are config-defined, UI is read-only + draft)
- Complex recurrence patterns (cron expressions, "every 3rd Tuesday") — daily time slots per day type are sufficient
- Multi-zone or room-specific scheduling (use scenes for that; the schedule triggers scene execution)
- Notification system for schedule events
- Historical schedule execution log

## Decisions

### 1. Schedule config structure: flat time slots per day type

Each device gets a `schedules` map keyed by day type. Each day type contains an array of time slots with an action to execute.

```json
{
  "roborock": {
    "schedules": {
      "device-name": {
        "normal": [
          { "time": "09:00", "action": "scene", "scene_id": 12345 },
          { "time": "18:00", "action": "start" }
        ],
        "weekend": [
          { "time": "11:00", "action": "scene", "scene_id": 12345 }
        ],
        "free": [
          { "time": "10:00", "action": "scene", "scene_id": 12345 }
        ],
        "notAtHome": []
      }
    }
  }
}
```

**Why over cron-based:** The use case is "clean at these times on these day types." Cron adds complexity without value here. An empty array for `notAtHome` naturally means "don't clean."

**Why keyed by device name (not slug):** The config is written by humans. Device names are meaningful; slugs are runtime-generated. The schedule engine maps device names to slugs at startup.

**Alternative considered:** Per-device inline config (adding `schedule` to each device entry). Rejected because there is no per-device config today — devices come from the Roborock cloud API. A top-level `schedules` map is cleaner.

### 2. Day type resolution: priority-based with MQTT signals

The schedule engine evaluates day type at each scheduled time using this priority:

1. **notAtHome** — if the persisted flag is `true` for this device → use `notAtHome` schedule
2. **weekend** — if today is Saturday/Sunday OR the MQTT topic `rules/public-holiday` is `true` → use `weekend` schedule  
3. **free** — if the MQTT topic `rules/free-day` is `true` → use `free` schedule
4. **normal** — fallback

**Why evaluate at trigger time (not daily):** If someone toggles `notAtHome` mid-day, the next scheduled slot should respect it immediately.

**Why public holidays are "weekend":** The user specified this grouping. Public holidays get the same cleaning treatment as weekends.

### 3. MQTT signal subscription: reuse existing gateway

Subscribe to the configured MQTT broker for `rules/public-holiday` and `rules/free-day` topics. Store the latest value in memory. These topics are external (published by a home automation rules engine).

**Topic configuration:** The MQTT signal topics will be configurable in the schedule config to avoid hardcoding:

```json
{
  "roborock": {
    "schedule_signals": {
      "public_holiday": "rules/feiertag",
      "vacation": "rules/urlaub"
    }
  }
}
```

**Why not hardcode:** Different users may have different topic structures.

### 4. notAtHome persistence: JSON file in data directory

Store `notAtHome` state in `{dataDir}/schedules/not-at-home.json`:

```json
{
  "device-name": true
}
```

**Why separate from session:** The user explicitly wants this in a mountable directory in k8s. The existing `.session/` directory could work, but a dedicated `schedules/` subdirectory within the data directory is cleaner and makes the mount point obvious.

**Why per-device:** Different devices may be in different locations (e.g., upstairs vs. downstairs robot in a vacation home scenario).

### 5. Schedule engine: goroutine with minute-precision ticker

A single goroutine ticks every minute, checks if any slot matches `HH:MM` for the resolved day type, and dispatches the action. Reuses the existing `dispatchCommand` function.

**Why minute ticker over time.AfterFunc per slot:** Simpler, handles config reloads naturally, and the overhead of checking a few slots per minute is negligible. No external dependency needed.

**Why not `robfig/cron`:** The scheduling logic is simple (match HH:MM + day type). Adding a cron library is overkill and introduces a dependency for no real gain.

### 6. REST API: read-only schedule state + notAtHome toggle

New endpoints:
- `GET /api/devices/{slug}/schedule` — returns the resolved schedule config, active day type, and next scheduled action
- `GET /api/schedule/status` — returns global schedule state (all devices, signal values)
- `PUT /api/devices/{slug}/not-at-home` — toggle notAtHome state (body: `{"enabled": true}`)

**Why no CRUD for schedules via API:** Schedules are config-defined. The UI can render a draft and show a "copy to config" snippet, but the actual config file is not writable from the application.

### 7. Frontend: schedule section in device view

Add a "Schedule" section below the existing controls in the device view. It shows:
- Current day type (with visual indicator)
- Today's schedule slots with times and actions
- Next upcoming action (highlighted)
- notAtHome toggle button
- A "draft" mode for creating schedule JSON (rendered as copyable config snippet)

**Why not a separate page:** The app is a single-page mobile-first UI. A section within the device view keeps context close.

### 8. SSE: broadcast schedule state changes

Extend the existing SSE mechanism to broadcast schedule-related events:
- Day type changes (e.g., vacation starts/ends via MQTT signal)
- notAtHome toggle
- Schedule execution events

This uses the same `BroadcastDeviceStatus` pattern but with a separate event type.

## Risks / Trade-offs

- **[Time zone handling]** → Schedule times are evaluated in the `Europe/Berlin` (DE) timezone, regardless of the server's local time. This ensures consistent behavior across deployments (e.g., Docker containers with UTC). The schedule engine SHALL use `time.LoadLocation("Europe/Berlin")` for all time comparisons.

- **[Missed schedules on restart]** → If the app restarts and a scheduled time has passed, that slot is skipped. Mitigation: acceptable for cleaning schedules; a "catch-up" mechanism adds complexity for little value (you don't want 3 stacked cleaning runs after a restart).

- **[MQTT signal reliability]** → If `rules/feiertag` or `rules/urlaub` topics have no retained message, the schedule engine defaults to `false`. Mitigation: document that signal topics should use retained messages. The engine also re-subscribes on reconnect.

- **[Config reload]** → Changing schedules requires an application restart. Mitigation: acceptable for v1; live config reload could be added later. The notAtHome toggle is the only frequently changing value and it's persisted separately.

- **[Device name matching]** → Config uses device names, runtime uses slugs. If a device is renamed in the Roborock app, the schedule config breaks silently. Mitigation: log a warning at startup for unmatched schedule device names.
