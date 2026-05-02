## Context

The current schedule system reads `DeviceSchedule` entries from the config file's `roborock.schedules` map. The `ScheduleEngine` uses these to evaluate day types and dispatch actions. The `ScheduleDraft` component in the UI lets users compose time slots and copy JSON — but there's no way to save schedules from the UI.

The data directory (`{configDir}/schedules/`) already exists for `not-at-home.json` persistence and is designed to be mountable in k8s.

## Goals / Non-Goals

**Goals:**
- Two schedule sources: provisioned (config, read-only) and user-created (data dir, full CRUD)
- User-created schedules override provisioned for the same device
- Full schedule editor in the UI — create, edit, delete
- Provisioned schedules shown with a visual badge and no edit/delete controls
- User schedules persisted as JSON in the writable data directory

**Non-Goals:**
- Versioning or history of schedule changes
- Import/export between provisioned and user-created formats
- Conflict resolution UI when both exist — user-created simply wins

## Decisions

### 1. Storage: one JSON file per device in data directory

User-created schedules are stored at `{dataDir}/schedules/devices/{device-name}.json`. Each file contains a single `DeviceSchedule` object (same format as the config).

**Why per-file:** Atomic writes per device, no contention, easy to inspect and backup. Mirrors how Grafana stores provisioned dashboards vs user dashboards.

**Why same format as config:** Seamless — a user schedule file is identical to what you'd put in the config. You could move a user schedule to the config file to "promote" it to provisioned.

### 2. Merge strategy: user-created overrides provisioned per device

If a device has both a provisioned schedule (from config) and a user-created schedule (from data dir), the user-created schedule wins entirely — no merging of individual day types or time slots. This is simple and predictable.

**Why full override:** Partial merging (e.g., user overrides only "weekend") creates confusion about which slots are active. Full override is what Grafana does too.

### 3. Schedule engine: load both sources, track provenance

The `ScheduleEngine` receives a merged map of `DeviceSchedule` entries plus metadata tracking which are provisioned vs user-created. A new `ScheduleStore` manages the user schedule files and provides CRUD operations.

The engine's `schedules` map is rebuilt when a user schedule is created, updated, or deleted.

### 4. CRUD API endpoints

New/modified REST endpoints:
- `GET /api/devices/{slug}/schedule` — extended to include `source: "provisioned" | "user" | "none"` field
- `POST /api/devices/{slug}/schedule` — create/update a user schedule for the device (body: `DeviceSchedule`)
- `DELETE /api/devices/{slug}/schedule` — delete the user schedule, falling back to provisioned if it exists

### 5. Frontend: editor replaces draft mode

The `ScheduleDraft` component is replaced with a `ScheduleEditor` that:
- Pre-loads the current schedule (provisioned or user) for editing
- On save, calls `POST /api/devices/{slug}/schedule` to persist
- Shows a "Provisioned" badge on read-only schedules with no edit controls (but allows creating a user override)
- Shows edit/delete controls on user-created schedules
- For provisioned schedules, an "Override" button creates a user schedule pre-filled with the provisioned values

### 6. Delete semantics

Deleting a user schedule removes the file from the data directory. If a provisioned schedule exists for that device, it becomes active again. The UI shows this transition clearly.

## Risks / Trade-offs

- **[File permissions]** → The data directory must be writable by the application process. In k8s this is already the case via mounted volumes. Document this requirement.

- **[No locking]** → Concurrent writes from multiple browser tabs could race. Acceptable for a single-user home automation app. The last write wins.

- **[Restart behavior]** → User schedules persist across restarts (files on disk). Provisioned schedules are always fresh from config. No migration needed.
