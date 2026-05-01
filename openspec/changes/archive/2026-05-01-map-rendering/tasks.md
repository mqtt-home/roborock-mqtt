## 1. Crypto & Protocol

- [x] 1.1 Add AES-CBC decryption function to `crypto.go` (nonce-based key derivation for map data)
- [x] 1.2 Add security nonce generation for map requests (`endpoint` + `nonce` fields, MD5-based)
- [x] 1.3 Add `BuildGetMapPayload` to `commands.go` with security nonce in the IPC request
- [x] 1.4 Handle Protocol 301 messages in `mqtt.go` — decrypt with CBC, decompress with gzip, route to map handler

## 2. Map Parser

- [x] 2.1 Create `app/roborock/map.go` with binary block parser: read block headers (type, header_len, data_len), dispatch by type
- [x] 2.2 Parse image block (type 1): extract pixel grid with dimensions, pixel types (empty/wall/floor/room), room IDs
- [x] 2.3 Parse position blocks (type 2: charger, type 3: robot): extract x/y coordinates
- [x] 2.4 Parse path block (type 4): extract coordinate pairs for cleaning path

## 3. PNG Renderer

- [x] 3.1 Create `app/roborock/map_render.go` with PNG rendering: map pixel grid to colors, draw room segments with distinct colors, mark robot/charger positions
- [x] 3.2 Add color palette for rooms (8+ distinct colors cycling by room ID)

## 4. Integration

- [x] 4.1 Add `MapPNG` field to `ManagedDevice`, add map polling logic (every 5th cycle, every cycle during cleaning)
- [x] 4.2 Publish map PNG to `{topic}/{slug}/map` (retained) in the status callback
- [x] 4.3 Add `GET /api/devices/{slug}/map` endpoint returning cached PNG with `image/png` content type

## 5. Frontend

- [x] 5.1 Add map display component showing `<img src="/api/devices/{slug}/map">` with periodic refresh
- [x] 5.2 Add map to the device view above controls, hidden when no map available
