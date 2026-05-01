## Why

Roborock vacuums support "scenes" (cleaning programs) — pre-configured routines that define which rooms to clean with specific suction/mop settings. These are created in the Roborock app and stored in the cloud. Currently the bridge can only send basic commands (start, pause, dock). Users want to discover and trigger their cleaning programs through MQTT and the web UI without needing the Roborock app.

## What Changes

- Discover cleaning scenes per device from the Roborock cloud API (`GET /user/scene/device/{deviceId}`)
- Execute scenes via the cloud API (`POST /user/scene/{sceneId}/execute`)
- Publish discovered scenes to local MQTT so home automation can trigger them
- Add scene list and execution to the web UI per device
- Both endpoints use Hawk authentication against the RRIOT API URL (`api-eu.roborock.com`)

## Capabilities

### New Capabilities
- `cleaning-programs`: Discover and execute Roborock cleaning scenes/programs via REST API, MQTT, and web UI

### Modified Capabilities

## Impact

- `app/roborock/client.go` — new `GetScenes` and `ExecuteScene` methods with Hawk auth
- `app/roborock/types.go` — new `Scene` type
- `app/roborock/manager.go` — scene discovery and caching per device
- `app/main.go` — publish scenes to MQTT, subscribe to scene execution commands
- `app/web/web.go` — scene list and execute API endpoints
- `app/web/src/` — scene list UI with execute buttons per device
