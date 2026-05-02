## Why

The schedule section is currently embedded inline in the device view, making it cramped alongside controls, programs, and the map. The schedule editor (from the provisioning change) needs enough space for four day-type sections with time slot editing — this doesn't fit well in the existing single-column card layout.

Additionally, when configuring a scheduled action as "scene", users currently must type a numeric scene ID. Since the app already fetches the list of available scenes per device (with names), users should be able to pick a scene from a dropdown instead.

## What Changes

- Move schedule visualization and editing to a dedicated page/dialog accessible from the device view
- The device view shows a compact schedule summary (active day type, next action) with a button to open the full schedule page
- The full schedule page contains: day type indicator, not-at-home toggle, all time slots for today, and the schedule editor
- Replace the numeric scene ID input in the schedule editor with a scene picker dropdown that lists the device's available scenes by name
- The scene picker loads scenes via the existing `GET /api/devices/{slug}/scenes` endpoint

## Capabilities

### New Capabilities
- `schedule-page`: Dedicated page/dialog for viewing and editing device schedules, replacing the inline section
- `scene-picker`: Scene selection dropdown in the schedule editor, replacing the numeric ID input

### Modified Capabilities

_(none)_

## Impact

- **Frontend**: New `SchedulePage` component, updated `ScheduleSection` to compact summary, updated `ScheduleEditor` with scene dropdown
- **No backend changes** — all data (scenes, schedules) is already available via existing API endpoints
