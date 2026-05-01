## Why

After a restart, the web UI and MQTT show no map until the first successful map poll completes (which takes 30-150 seconds depending on polling interval and whether the device is cleaning). Since the floor plan rarely changes between restarts, persisting the last known map to disk and loading it at startup provides immediate map visibility.

## What Changes

- Save the latest map data (PNG + vector JSON if available) per device to the session directory on disk after each successful map poll
- Load cached maps at startup before the first poll, so the web UI and MQTT have maps immediately
- Cached maps are overwritten on each successful poll — always shows the latest
- Cache files stored alongside `session.json` in the `.session/` directory, named by device slug

## Capabilities

### New Capabilities
- `persist-map-cache`: Persist and restore map data across restarts for immediate availability

### Modified Capabilities

## Impact

- `app/roborock/manager.go` — save/load map cache per device
- `app/main.go` — publish cached maps to MQTT at startup
- No frontend changes — the existing map components already poll the API
