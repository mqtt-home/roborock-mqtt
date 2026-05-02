## 1. Config & Types

- [x] 1.1 Add notification config types to `config/config.go`: `NotificationConfig`, `EmailConfig`, `ThresholdConfig`, `ConsumableLifetimes` with defaults
- [x] 1.2 Add `ConsumablePercents` struct to `roborock/types.go` and include it in `PublishedStatus`
- [x] 1.3 Compute consumable percentages in the polling loop (in `manager.go` where `PublishedStatus` is built)

## 2. Consumable Reset Command

- [x] 2.1 Add `BuildResetConsumablePayload(name string)` to `roborock/commands.go` using IPC method `reset_consumable`
- [x] 2.2 Add `ResetConsumable(name string)` method to `CloudMQTT`
- [x] 2.3 Add `POST /api/devices/{slug}/consumables/{name}/reset` endpoint in `web/web.go`
- [x] 2.4 Add route for the reset endpoint in `setupRoutes`

## 3. Email Notification System

- [x] 3.1 Create `roborock/notifier.go`: SMTP email sender with STARTTLS, send method taking subject and body
- [x] 3.2 Create `roborock/notification_state.go`: notification state persistence (load/save JSON in data dir), per-device per-consumable tracking, clear on reset
- [x] 3.3 Create `roborock/maintenance_checker.go`: threshold checker that runs after each poll, compares percentages to thresholds, sends emails for new alerts, updates state
- [x] 3.4 Wire maintenance checker into `main.go`: initialize after bridge start, hook into status callback

## 4. Frontend Types & API

- [x] 4.1 Add `ConsumablePercents` to frontend types in `types/status.ts`
- [x] 4.2 Add `resetConsumable(slug, name)` API function in `lib/api.ts`

## 5. Maintenance UI

- [x] 5.1 Create `web/src/components/MaintenancePage.tsx`: full-screen overlay with progress bars for each consumable (color-coded green/amber/red), percentage, hours used, and Reset button per consumable with confirmation modal
- [x] 5.2 Create compact maintenance summary card for the main view: shows worst consumable status, red border when critical, tappable to open maintenance page
- [x] 5.3 Integrate maintenance summary card in `App.tsx` between controls and schedule sections
