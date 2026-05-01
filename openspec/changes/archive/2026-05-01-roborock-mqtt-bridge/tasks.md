## 1. Project Scaffold

- [x] 1.1 Initialize Go module at `app/go.mod` with module path `github.com/mqtt-home/roborock-mqtt`
- [x] 1.2 Create `app/version/version.go` with Version, GitCommit, BuildTime variables
- [x] 1.3 Create `app/config/config.go` with Config, RoborockConfig, WebConfig structs and JSON loader with env var substitution (reference mqtt-lamarzocco config package)
- [x] 1.4 Create `app/main.go` with entry point: config loading, logger init, pprof init, signal handling for graceful shutdown
- [x] 1.5 Create `app/Makefile` with build, build-frontend, build-backend, dev-frontend, dev-backend, run, docker, clean, deps targets
- [x] 1.6 Create `app/Dockerfile` (multi-stage: node for frontend, golang for backend, distroless final)
- [x] 1.7 Create `app/.goreleaser.yml` for linux/amd64 and linux/arm64 with Docker multi-arch manifests
- [x] 1.8 Create `.github/workflows/build.yml` for push-triggered build validation
- [x] 1.9 Create `.github/workflows/build-release.yml` for tag-triggered release with GoReleaser
- [x] 1.10 Create `app/docker-compose.dev.yml` for local development
- [x] 1.11 Create `production/config/config.example.json` with example configuration

## 2. Roborock Authentication

- [x] 2.1 Create `app/roborock/types.go` with data types: LoginResponse, AuthenticationResponseData, RRIoT, HomeDetail, DeviceInfo, and device status structs
- [x] 2.2 Create `app/roborock/client.go` with REST client: Login (POST /api/v1/login), GetHomeDetail (GET /api/v1/getHomeDetail), Hawk auth header generation (HMAC-SHA256 signing)
- [x] 2.3 Add token refresh logic: re-login on authentication errors

## 3. Roborock Cloud MQTT Protocol

- [x] 3.1 Create `app/roborock/crypto.go` with AES/ECB encryption/decryption, MD5 key derivation with timestamp rearrangement pattern [5,6,3,7,1,2,0,4], and CRC32 checksum computation
- [x] 3.2 Create `app/roborock/protocol.go` with binary message encoding/decoding: 19-byte header, encrypted body, 4-byte CRC32 footer; sequence number tracking for request-response correlation
- [x] 3.3 Create `app/roborock/mqtt.go` with Roborock cloud MQTT client: connect with derived MD5 credentials, subscribe to `rr/m/o/{userId}/{username}/#`, publish to `rr/m/i/{userId}/{username}/{deviceId}`, reconnection with exponential backoff

## 4. Device Commands

- [x] 4.1 Create `app/roborock/commands.go` with high-level command functions: Start, Pause, Dock, SegmentClean, SetFanSpeed, SetMopMode, SetWaterBox
- [x] 4.2 Add status polling: periodic GET_PROP and GET_CONSUMABLE requests, parse responses into structured DeviceStatus
- [x] 4.3 Add fan speed / mop mode / water box level string-to-numeric mapping constants

## 5. Local MQTT Bridge

- [x] 5.1 Wire up local MQTT in `app/main.go`: connect via mqtt-gateway, publish status to `{topic}/status` (retained), subscribe to `{topic}/set` for commands
- [x] 5.2 Implement command dispatcher: parse JSON action messages from `{topic}/set`, map to device command functions, log warnings for unknown actions
- [x] 5.3 Implement status publishing: convert DeviceStatus to JSON, publish on change and at each polling interval

## 6. Web Application Backend

- [x] 6.1 Create `app/web/web.go` with chi router: health, status, command endpoints (start, pause, dock, fan-speed, mop-mode), SSE events, SPA static file serving
- [x] 6.2 Implement SSE client tracking and status broadcasting

## 7. Web Application Frontend

- [x] 7.1 Initialize React + TypeScript + Tailwind + Vite project in `app/web/` with pnpm (reference mqtt-lamarzocco web setup)
- [x] 7.2 Create status types and API client (`src/types/status.ts`, `src/lib/api.ts`)
- [x] 7.3 Create SSE hook for live status updates (`src/hooks/useSSE.ts`)
- [x] 7.4 Create main App component with vacuum status display (battery, state, cleaning mode, consumables)
- [x] 7.5 Add control buttons (start, pause, dock) and mode selectors (fan speed, mop mode)
- [x] 7.6 Add theme support (dark/light mode)

## 8. Integration & Testing

- [ ] 8.1 End-to-end test: login, connect cloud MQTT, poll status, publish to local MQTT
- [ ] 8.2 Test command flow: receive on local MQTT, dispatch to cloud MQTT, verify device response
- [ ] 8.3 Test reconnection: cloud MQTT disconnect/reconnect, token refresh
- [ ] 8.4 Verify Docker build works (multi-stage, both architectures)
