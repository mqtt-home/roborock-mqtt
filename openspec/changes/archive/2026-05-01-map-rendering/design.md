## Context

Roborock maps use a proprietary binary format delivered via Protocol 301 over the cloud MQTT channel. The data flow is:

1. Send `GET_MAP_V1` IPC request with a security nonce (endpoint + nonce)
2. Receive Protocol 301 response on the MQTT subscription
3. Decrypt body with AES-CBC using the nonce (not ECB like regular commands)
4. Decompress with gzip
5. Parse the proprietary block-based binary format
6. Render to PNG

The binary map format consists of typed blocks: image data (pixel grid), room segments, robot position, charger position, paths, virtual walls, and no-go zones.

## Goals / Non-Goals

**Goals:**
- Fetch and render maps for each device
- Publish as PNG to MQTT and serve via web API
- Display in the web UI
- Room segments colored distinctly
- Robot and charger positions marked

**Non-Goals:**
- Interactive map (zoom, pan, room selection) — static image only
- Real-time path tracking during cleaning
- Map editing (virtual walls, no-go zones)
- 3D rendering

## Decisions

### 1. Map data flow

```
GET_MAP_V1 (with security nonce)
  → Protocol 301 response
  → AES-CBC decrypt (nonce-based key)
  → gzip decompress
  → parse binary blocks
  → render to PNG (Go image package)
  → cache in ManagedDevice
  → publish to MQTT + serve via API
```

### 2. Binary format parsing in Go

Implement a block parser in `app/roborock/map.go`. Each block has a type ID, header length, and data length. Known block types:
- **1**: Image data (pixel grid with room IDs)
- **2**: Charger position
- **3**: Robot position  
- **4**: Currently cleaned path
- **5**: Goto path
- **6**: Goto predicted path
- **7**: Virtual walls
- **8**: No-go zones
- **9**: No-mop zones

### 3. PNG rendering

Use Go's `image` and `image/png` packages. Each pixel type maps to a color:
- Empty space → transparent
- Wall → dark gray
- Floor → light gray
- Room segments → distinct colors per room ID
- Robot → green circle
- Charger → blue circle

### 4. Map polling

Request map every N poll cycles (not every status poll — maps are heavier). Default: every 5th poll cycle. During active cleaning, poll more frequently.

### 5. MQTT and API

- MQTT: publish raw PNG bytes to `{topic}/{slug}/map` (retained)
- API: `GET /api/devices/{slug}/map` returns `image/png`
- Web UI: `<img>` tag pointing to the map API endpoint, refreshed periodically

## Risks / Trade-offs

- **[Binary format reverse-engineered]** The map format is not documented. Different device models may use different formats. → Mitigation: Start with the well-known v1 format used by S7 MaxV and similar models. Log unknown block types for future support.
- **[Large payloads]** Maps can be 100KB+ compressed. → Mitigation: Only poll maps periodically, not on every status update.
- **[CBC encryption complexity]** Map decryption uses a different key derivation than regular messages. → Mitigation: Isolate in crypto.go with clear function signatures.
