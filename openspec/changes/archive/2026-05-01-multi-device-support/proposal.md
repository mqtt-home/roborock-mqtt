## Why

The Roborock account can have multiple vacuums (e.g., "Carmen OG" and "Carmen EG" as seen in the home data). Currently the app selects the first device and ignores the rest. The web UI and MQTT bridge need to support all devices in the account so users can monitor and control each vacuum independently.

## What Changes

- Backend discovers and manages all devices from the account, not just the first one
- Each device gets its own cloud MQTT connection for commands and status
- Local MQTT topics are namespaced per device (e.g., `home/roborock/{device-name}/status`)
- Web UI shows a device selector/switcher and displays status per device
- SSE events include a device identifier so the frontend can route updates
- Config optionally allows filtering which devices to bridge

## Capabilities

### New Capabilities
- `multi-device`: Support for discovering, connecting, and controlling multiple Roborock devices through the bridge and web UI

### Modified Capabilities

## Impact

- `app/roborock/mqtt.go` — manage multiple CloudMQTT instances
- `app/main.go` — iterate over all devices, per-device polling and MQTT topics
- `app/web/web.go` — per-device API endpoints and SSE events
- `app/web/src/` — device selector UI, per-device status display
- MQTT topic structure changes from `{topic}/status` to `{topic}/{device}/status` — **BREAKING** for existing MQTT consumers
