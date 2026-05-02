## 1. Schedule Store (Backend)

- [x] 1.1 Create `roborock/schedule_store.go` with `ScheduleStore`: load all user schedule files from `{dataDir}/schedules/devices/`, get/save/delete per device name, thread-safe
- [x] 1.2 Add `source` field to `ScheduleState` type (`"provisioned"`, `"user"`, `"none"`)

## 2. Schedule Engine Updates

- [x] 2.1 Update `ScheduleEngine` to accept both provisioned schedules (from config) and a `ScheduleStore` for user schedules
- [x] 2.2 Add `RebuildSchedules()` method to merge provisioned and user schedules (user wins per device), called on init and after CRUD operations
- [x] 2.3 Update `GetScheduleStateForSlug` and `GetDeviceScheduleForSlug` to include `source` in returned state
- [x] 2.4 Add `HasAnyScheduleForSlug(slug)` that checks both sources (replacing `HasScheduleForSlug` which only checks provisioned)

## 3. REST API Updates

- [x] 3.1 Update `GET /api/devices/{slug}/schedule` response to include `source` field
- [x] 3.2 Add `POST /api/devices/{slug}/schedule` endpoint: validate body as `DeviceSchedule`, save via store, rebuild engine, broadcast state change
- [x] 3.3 Add `DELETE /api/devices/{slug}/schedule` endpoint: delete user schedule from store, rebuild engine, return 404 if no user schedule exists
- [x] 3.4 Wire `ScheduleStore` into `WebServer` and `main.go` initialization

## 4. Frontend Types & API

- [x] 4.1 Add `source` field to `ScheduleResponse` type and update `ScheduleState` type in `types/schedule.ts`
- [x] 4.2 Add `saveSchedule(slug, schedule)` and `deleteSchedule(slug)` API functions in `lib/api.ts`

## 5. Schedule Editor Component

- [x] 5.1 Create `web/src/components/ScheduleEditor.tsx`: reuse the time slot editing UI from `ScheduleDraft` but with Save/Cancel buttons instead of JSON output, calls `saveSchedule` on save
- [x] 5.2 Delete `web/src/components/ScheduleDraft.tsx`

## 6. ScheduleSection Updates

- [x] 6.1 Update `ScheduleSection.tsx`: show "Provisioned" badge when source is provisioned, show Edit/Delete buttons when source is user, show "Override" button when source is provisioned, show "Create Schedule" button when source is none
- [x] 6.2 Wire editor open/close state: "Create", "Edit", and "Override" all open `ScheduleEditor` (pre-filled appropriately), Save/Cancel close it
- [x] 6.3 Handle delete with confirmation: call `deleteSchedule`, refresh state from API response
- [x] 6.4 Remove all references to `ScheduleDraft` and draft toggle from `ScheduleSection`
