## 1. Config & Types

- [x] 1.1 Add schedule config types to `config/config.go`: `ScheduleSignals`, `TimeSlot`, device schedule map, and `schedules`/`schedule_signals` fields on `RoborockConfig`
- [x] 1.2 Add defaults for `schedule_signals` (public_holiday: `rules/public-holiday`, vacation: `rules/free-day`) in `LoadConfig`
- [x] 1.3 Add schedule-related Go types in a new `roborock/schedule_types.go`: `DayType` enum, `ScheduleState` (active day type, signals, next action), `NotAtHomeStore`

## 2. Not-at-home Persistence

- [x] 2.1 Implement `NotAtHomeStore` in `roborock/not_at_home.go`: load/save JSON file from data directory, per-device get/set methods
- [x] 2.2 Wire up data directory path in `main.go` (reuse session directory parent or add configurable data dir)

## 3. Schedule Engine

- [x] 3.1 Implement MQTT signal listener in `roborock/schedule_signals.go`: subscribe to holiday/vacation topics, parse boolean payloads, store latest values thread-safe
- [x] 3.2 Implement day type resolver in `roborock/schedule_engine.go`: evaluate priority chain (notAtHome > weekend > free > normal) using current weekday, MQTT signals, and not-at-home store
- [x] 3.3 Implement schedule ticker in `roborock/schedule_engine.go`: minute-precision loop that checks HH:MM against resolved day type slots, dispatches matching actions
- [x] 3.4 Implement action dispatch in schedule engine: call device start or scene execution via DeviceManager, log errors on failure
- [x] 3.5 Implement schedule state computation: build `ScheduleState` response (active day type, signal values, next scheduled action time)

## 4. MQTT Publishing

- [x] 4.1 Add `publishDeviceSchedule` function in `main.go` to publish schedule state to `{topic}/{slug}/schedule` as retained JSON
- [x] 4.2 Wire schedule state publishing to day type changes and action execution events

## 5. REST API

- [x] 5.1 Add `GET /api/devices/{slug}/schedule` endpoint in `web/web.go`: return schedule config, active day type, signals, next action
- [x] 5.2 Add `GET /api/schedule/status` endpoint in `web/web.go`: return global schedule state for all devices
- [x] 5.3 Add `PUT /api/devices/{slug}/not-at-home` endpoint in `web/web.go`: toggle not-at-home state, persist, return updated schedule state

## 6. SSE Integration

- [x] 6.1 Add schedule event type to SSE broadcast in `web/web.go`: broadcast schedule state changes alongside existing device status events
- [x] 6.2 Include initial schedule state in SSE connection handshake (alongside existing device status)

## 7. Main Wiring

- [x] 7.1 Initialize schedule engine in `main.go`/`startBridge`: create signal listener, not-at-home store, schedule engine with config, start ticker goroutine
- [x] 7.2 Wire schedule engine callbacks to MQTT publishing and SSE broadcast
- [x] 7.3 Stop schedule engine ticker on shutdown (add to signal handler)

## 8. Frontend Types & API

- [x] 8.1 Add schedule TypeScript types in `web/src/types/schedule.ts`: `DayType`, `TimeSlot`, `ScheduleState`, `DeviceSchedule`
- [x] 8.2 Add schedule API functions in `web/src/lib/api.ts`: `fetchSchedule(slug)`, `fetchScheduleStatus()`, `setNotAtHome(slug, enabled)`

## 9. Frontend Schedule UI

- [x] 9.1 Create `web/src/components/ScheduleSection.tsx`: day type indicator with distinct styling per type, today's time slots list with next-slot highlighting, not-at-home toggle button
- [x] 9.2 Extend SSE hook (`useSSE.ts`) to handle schedule event type and expose schedule state per device
- [x] 9.3 Integrate `ScheduleSection` in `App.tsx`: render below controls when device has schedule config, pass SSE schedule state

## 10. Frontend Draft Mode

- [x] 10.1 Create `web/src/components/ScheduleDraft.tsx`: form for composing time slots per day type, renders JSON config snippet, copy-to-clipboard button
- [x] 10.2 Integrate draft mode toggle in `ScheduleSection`: button to switch between schedule view and draft editor
