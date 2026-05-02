## Why

Tapping a program (scene) button immediately starts a cleaning run with no confirmation. On a mobile touch UI this is easy to trigger accidentally, and a cleaning run is not trivially cancellable (the robot may already be in motion). Adding a confirmation modal gives the user a chance to review before committing.

## What Changes

- Show the existing `ConfirmModal` when a program button is tapped, asking "Start {program name}?"
- Only execute the scene API call when the user confirms
- Cancel dismisses the modal with no action

## Capabilities

### New Capabilities
- `confirm-program`: Confirmation step before executing a cleaning program

### Modified Capabilities

_(none)_

## Impact

- **Frontend only**: `App.tsx` — add confirm state, show `ConfirmModal` before `executeScene`
- **No backend changes**
