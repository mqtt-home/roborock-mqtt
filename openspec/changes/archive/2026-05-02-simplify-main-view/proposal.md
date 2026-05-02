## Why

The main device view is cluttered with controls that are rarely used directly. Most users start a cleaning program (scene) rather than manually starting the vacuum and tweaking fan speed and mop mode. The Start/Pause/Dock controls, fan speed selector, and mop mode selector are really only relevant for "manual start" scenarios and take up significant screen space above the programs list.

Moving these to a separate controls page keeps the main view focused on what matters: device status, programs, schedule, and map.

## What Changes

- Remove the Controls, Fan Speed, and Mop Mode sections from the main device view
- Keep Programs prominently on the main view (they're the primary action)
- Add a "Controls" button/card on the main view that opens a full-screen controls overlay (same pattern as the schedule page)
- The controls overlay contains: Start/Pause/Dock buttons, Fan Speed selector, Mop Mode selector
- Pause and Dock remain accessible from the main view when a cleaning is in progress (since stopping a running clean is urgent)

## Capabilities

### New Capabilities
- `controls-page`: Dedicated full-screen overlay for manual vacuum controls (start, pause, dock, fan speed, mop mode)

### Modified Capabilities

_(none)_

## Impact

- **Frontend**: New `ControlsPage.tsx` overlay, `App.tsx` restructured to show Programs first, Controls as a link
- **No backend changes**
