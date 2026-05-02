## Why

The schedule page currently only shows the time slots for today's active day type. Users have no way to see what's configured for other day types (weekend, free, notAtHome) without opening the editor. Showing all day types gives a complete overview of the schedule at a glance, with today's active schedule visually highlighted.

## What Changes

- The schedule page lists all four day type sections (normal, weekend, free, notAtHome) with their configured time slots
- The currently active day type section is visually highlighted (e.g., with an "Active" badge and accent border)
- Time slots in the active day type still show past/next highlighting as before
- Non-active day type sections are shown in a muted style
- Empty day types show "No slots" rather than being hidden

## Capabilities

### New Capabilities
- `all-day-types-view`: Display all four day type schedules on the schedule page with active-day highlighting

### Modified Capabilities

_(none)_

## Impact

- **Frontend only**: `SchedulePage.tsx` — replace the single "Today" section with a loop over all four day types
- **No backend changes**
