## Why

Roborock vacuums generate floor plan maps during cleaning. These maps show room layouts, cleaned areas, obstacles, and the robot's current position. Having the map visible in the web UI and available as a PNG on MQTT enables home automation dashboards (e.g., Home Assistant panels) and gives users real-time visual feedback of cleaning progress.

## What Changes

- Request map data from devices using `GET_MAP_V1` IPC command with security nonce
- Decode Protocol 301 map responses: AES-CBC decryption (nonce-based), gzip decompression, and proprietary binary format parsing
- Parse map blocks (image pixels, room segments, robot position, charger position, virtual walls, paths)
- Render the parsed map data to a PNG image using Go's `image/png` package
- Publish map PNG to local MQTT per device (`{topic}/{slug}/map`) on each poll
- Serve map PNG via web API (`GET /api/devices/{slug}/map`)
- Display map image in the web UI per device

## Capabilities

### New Capabilities
- `map-rendering`: Fetch, decode, parse, and render Roborock vacuum maps as PNG images for MQTT and web UI

### Modified Capabilities

## Impact

- `app/roborock/crypto.go` — add AES-CBC decryption for map data
- `app/roborock/map.go` — new file: map request, Protocol 301 decoding, binary format parsing, PNG rendering
- `app/roborock/commands.go` — add `BuildGetMapPayload` with security nonce
- `app/roborock/mqtt.go` — handle Protocol 301 responses
- `app/roborock/manager.go` — map polling and caching per device
- `app/main.go` — publish map PNG to MQTT
- `app/web/web.go` — map image endpoint
- `app/web/src/` — map display component
- New dependency: Go standard library only (`image`, `image/color`, `image/png`, `compress/gzip`)
