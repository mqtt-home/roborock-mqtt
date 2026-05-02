## Why

The current schedule system only reads from the config file. Users must manually write JSON to add or modify schedules — the UI "draft mode" generates a snippet to copy-paste, but there's no way to directly create, edit, or save schedules from the web UI. This makes schedule management cumbersome, especially for initial setup.

Adopting a Grafana-style provisioning model gives users the best of both worlds: infrastructure-as-code via config files for reproducible deployments, plus a full UI editor for ad-hoc schedule management.

## What Changes

- Introduce two schedule sources: **provisioned** (from config file, read-only) and **user-created** (from UI, persisted in the writable data directory)
- Provisioned schedules are marked as such in the UI and cannot be edited or deleted
- User-created schedules can be created, edited, and deleted via the UI and REST API
- User-created schedules are persisted in `{dataDir}/schedules/devices/{device-name}.json`
- The schedule engine merges both sources — if a device has both provisioned and user-created schedules, user-created takes precedence (overrides the provisioned schedule for that device)
- Replace the draft/copy-paste mode with a proper schedule editor that saves directly
- Remove the `ScheduleDraft` component (no longer needed)

## Capabilities

### New Capabilities
- `schedule-store`: Backend persistence layer for user-created schedules with CRUD operations and file-based storage in the data directory
- `schedule-editor`: Full UI editor for creating and managing user-created schedules, replacing the draft mode

### Modified Capabilities

_(none — existing specs are not changing at the requirement level, only the implementation)_

## Impact

- **Backend**: New `ScheduleStore` for user schedules, new CRUD API endpoints, schedule engine updated to merge two sources
- **Frontend**: Schedule editor replaces draft mode, provisioned badge on read-only schedules, create/edit/delete buttons for user schedules
- **Persistence**: New JSON files in `{dataDir}/schedules/devices/` directory
- **Config**: No changes — existing `schedules` config field stays as-is, now explicitly called "provisioned"
- **Existing behavior**: Provisioned schedules keep working identically; this is additive
