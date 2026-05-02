## Why

When a device has not yet been polled or the status response contains all-zero values, the UI displays raw fallback text like "Unknown(0)", "0%", "Unknown(0)", "Unknown(0)", "0s". This looks broken rather than intentional. The status card should show a clear "waiting for data" state instead of rendering meaningless zero values.

## What Changes

- Show a loading/placeholder state in the device status card when the status data is empty or all-zero
- On the backend, treat state `0` as a distinct "waiting" state rather than formatting it as `unknown(0)`
- Hide the status detail grid (battery, fan speed, mop mode, clean time) entirely when no meaningful data is available
- Show a minimal "Waiting for status..." indicator instead

## Capabilities

### New Capabilities
- `empty-status-display`: Graceful handling and display of missing or empty device status data

### Modified Capabilities

_(none)_

## Impact

- **Backend**: `roborock/commands.go` — return empty string or a dedicated name for state 0
- **Frontend**: `App.tsx` status card — detect empty/zero status and render placeholder
- **No API changes** — the status structure stays the same, just the display logic changes
