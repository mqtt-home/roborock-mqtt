## Why

When a vacuum is cleaning, the web UI currently shows a static state label ("Cleaning") with no sense of progress. Users want to see how the cleaning is progressing — elapsed time, cleaned area, battery drain, and whether the vacuum is actively moving or paused. This makes the web UI useful as a monitoring dashboard during cleaning sessions.

## What Changes

- Add a cleaning progress card to the web UI that appears when a device is actively cleaning
- Show real-time progress: elapsed time (counting up), cleaned area, battery level with drain indicator
- Show cleaning state transitions (cleaning → returning home → charging)
- Add a progress timeline showing state changes during the current session
- Animate the status card to visually indicate active cleaning vs idle
- All data comes from existing SSE status updates — no backend changes needed

## Capabilities

### New Capabilities
- `cleaning-progress-ui`: Real-time cleaning progress visualization in the web UI

### Modified Capabilities

## Impact

- `app/web/src/components/CleaningProgress.tsx` — new component
- `app/web/src/App.tsx` — integrate progress component for selected device
- No backend changes — uses existing `DeviceStatus` fields (state, clean_time, clean_area, battery, in_cleaning)
