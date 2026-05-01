## Context

We are building a Go application that bridges Roborock vacuum robots to a local MQTT broker, following the same architecture as our existing mqtt-lamarzocco project. The Roborock cloud API uses a two-layer protocol: REST with Hawk authentication for login and device discovery, and an encrypted MQTT channel for real-time device communication. The roborock-bridge project (unmaintained, Kotlin) provides reference for the API but has bugs and architectural issues we want to avoid.

The application runs as a long-lived service (Docker container), polling status and forwarding commands between the local MQTT broker and Roborock's cloud infrastructure.

## Goals / Non-Goals

**Goals:**
- Authenticate with Roborock cloud and maintain a persistent connection
- Publish vacuum status to local MQTT (battery, state, cleaning mode, consumables)
- Accept commands via local MQTT (start, pause, dock, segment clean, suction/mop mode)
- Provide a web UI for monitoring and basic control
- Follow the same project structure, libraries, and CI patterns as mqtt-lamarzocco
- Multi-arch Docker images (amd64, arm64)

**Non-Goals:**
- Local/LAN device communication (cloud-only for now)
- Map rendering or visualization in the web UI
- Multi-device support in v1 (single vacuum per instance)
- Custom firmware or rooting
- Supporting non-EU Roborock regions in v1 (configurable base URL, but tested against EU only)

## Decisions

### 1. Project structure mirrors mqtt-lamarzocco

```
app/
  main.go                    # Entry point, lifecycle, MQTT subscriptions
  config/config.go           # Configuration loading (JSON + env vars)
  roborock/
    client.go                # REST API client (login, home detail, Hawk auth)
    mqtt.go                  # Roborock cloud MQTT connection
    protocol.go              # Binary message encoding/decoding (header, body, footer)
    crypto.go                # AES/ECB encryption, HMAC-SHA256, MD5 key derivation
    commands.go              # High-level command abstractions
    types.go                 # Data types for API responses and device state
  web/                       # React + TypeScript + Tailwind frontend
  version/version.go         # Build version info (injected via ldflags)
  Makefile
  Dockerfile
  .goreleaser.yml
  docker-compose.dev.yml
.github/workflows/
  build.yml
  build-release.yml
```

**Rationale:** Proven structure from mqtt-lamarzocco. Keeps API client, protocol, and crypto concerns separated within the `roborock/` package.

### 2. Roborock cloud MQTT via standard Go MQTT library

Use `github.com/eclipse/paho.mqtt.golang` for the Roborock cloud MQTT connection (separate from the local MQTT gateway). The cloud connection requires custom credentials derived from the login response (MD5-hashed user/session IDs) and TLS.

**Rationale:** The local MQTT gateway library (`philipparndt/mqtt-gateway`) is designed for simple pub/sub with our broker. The Roborock cloud connection needs different credentials, topics, and binary message handling, so a separate MQTT client is appropriate.

### 3. Binary protocol implementation

Implement the 19-byte header + encrypted body + 4-byte CRC32 footer protocol:
- Header: protocol version (3 bytes), sequence number (4 bytes), random (4 bytes), timestamp (4 bytes), protocol ID (2 bytes), payload length (2 bytes)
- Body: AES/ECB encrypted JSON payload
- Footer: CRC32 checksum over header + body

Key derivation: MD5 of timestamp (hex-encoded with character rearrangement pattern [5,6,3,7,1,2,0,4]) + device key + salt.

**Rationale:** This is the protocol Roborock devices use. No alternative exists for cloud communication.

### 4. Configuration format

JSON config file matching mqtt-lamarzocco pattern:

```json
{
  "mqtt": {
    "url": "tcp://localhost:1883",
    "topic": "home/roborock",
    "qos": 2,
    "retain": true
  },
  "roborock": {
    "username": "email@example.com",
    "password": "password",
    "base_url": "https://euiot.roborock.com",
    "polling_interval": 30
  },
  "web": {
    "enabled": true,
    "port": 8080
  },
  "loglevel": "info"
}
```

**Rationale:** Consistent with mqtt-lamarzocco. Environment variable substitution via the same config loading mechanism.

### 5. MQTT topic structure

```
{topic}/status          # Full device status JSON (retained)
{topic}/set             # Command input (JSON with action field)
```

Commands accepted on `set`:
- `{"action": "start"}` - Start cleaning
- `{"action": "pause"}` - Pause cleaning
- `{"action": "dock"}` - Return to dock
- `{"action": "segment_clean", "segments": [16, 17]}` - Clean specific rooms
- `{"action": "set_fan_speed", "speed": "balanced"}` - Set suction (quiet/balanced/turbo/max)
- `{"action": "set_mop_mode", "mode": "deep"}` - Set mop mode (standard/deep/deep_plus)
- `{"action": "set_water_box", "level": "moderate"}` - Set water level (off/mild/moderate/intense)

**Rationale:** Simple, flat topic structure. Single `set` topic with action-based JSON keeps the interface clean.

### 6. Web UI

React + TypeScript + Tailwind + Vite, same stack as mqtt-lamarzocco:
- SSE for real-time status updates
- REST endpoints for commands
- chi router serving the SPA and API

**Rationale:** Proven stack, shared patterns, consistent developer experience.

## Risks / Trade-offs

- **[Roborock API changes]** The cloud API is undocumented and reverse-engineered. Roborock could change endpoints, encryption, or protocols at any time. → Mitigation: Isolate protocol code in `roborock/` package for easy updates. Log raw protocol data at debug level for diagnostics.

- **[Cloud dependency]** All communication goes through Roborock's cloud. If their servers are down, the bridge is non-functional. → Mitigation: This is a known limitation (non-goal: local/LAN support). Reconnection logic with exponential backoff.

- **[Encryption salt]** The AES key derivation uses a salt value extracted from the decompiled Roborock app. This value could change with app updates. → Mitigation: Make it configurable, default to the known value.

- **[Session expiry]** The authentication token may expire. → Mitigation: Implement token refresh / re-login on 401 responses or MQTT disconnection.

- **[Single device]** V1 supports one vacuum per instance. Users with multiple devices need multiple instances. → Mitigation: Acceptable for v1. Multi-device can be added later by iterating over devices from home detail.
