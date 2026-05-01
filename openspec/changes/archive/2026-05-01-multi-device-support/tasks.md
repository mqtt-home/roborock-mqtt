## 1. Backend Multi-Device Infrastructure

- [x] 1.1 Add slug generation utility function (lowercase, spaces→hyphens, strip special chars)
- [x] 1.2 Create `DeviceManager` struct in `app/roborock/manager.go` that holds a map of slug→CloudMQTT and manages connect/disconnect/poll lifecycle for all devices
- [x] 1.3 Update `DiscoverDevice` → `DiscoverDevices` to return all devices instead of just the first
- [x] 1.4 Update `main.go` to use DeviceManager: connect all devices, per-device polling, per-device MQTT topics (`{topic}/{slug}/status` and `{topic}/{slug}/set`)
- [x] 1.5 Update command dispatcher to route commands from `{topic}/{slug}/set` to the correct device

## 2. Web API Multi-Device Endpoints

- [x] 2.1 Add `GET /api/devices` endpoint returning list of devices with id, name, slug, online, status
- [x] 2.2 Add `POST /api/devices/{slug}/start|pause|dock|fan-speed|mop-mode` per-device command endpoints
- [x] 2.3 Update SSE events to include `device` field (slug) in status payloads
- [x] 2.4 Keep `GET /api/status` as convenience endpoint returning all devices' status

## 3. Frontend Multi-Device UI

- [x] 3.1 Add device list type and update API client with `fetchDevices()` and per-device command functions
- [x] 3.2 Create device switcher component (tab bar at top showing device names)
- [x] 3.3 Update App.tsx to fetch device list, maintain selected device state, filter SSE events by device
- [x] 3.4 Update status card and controls to show selected device's data
