## Context

The app currently selects `allDevices[0]` and creates a single `CloudMQTT` instance. The home data API already returns all devices. We need to manage N devices with independent cloud MQTT connections, status polling, and local MQTT topics.

## Goals / Non-Goals

**Goals:**
- Support all devices returned by the home data API
- Independent status polling and command routing per device
- Web UI device switcher
- Per-device MQTT topics on the local broker

**Non-Goals:**
- Cross-device automation (e.g., "when device A finishes, start device B")
- Per-device web authentication
- Dynamic device discovery (devices are discovered at startup/login)

## Decisions

### 1. Device manager pattern

Create a `DeviceManager` struct that holds a map of `deviceID → *CloudMQTT`. The manager handles lifecycle (connect all, disconnect all, poll all) and routes commands by device ID.

**Rationale:** Keeps main.go simple. Each device is independent — if one disconnects, the others continue.

### 2. MQTT topic structure

Change from flat topics to device-namespaced:
```
{topic}/{device-slug}/status    # retained status per device
{topic}/{device-slug}/set       # commands per device
```

Where `device-slug` is a sanitized lowercase version of the device name (e.g., `carmen-og`).

**Rationale:** Clean separation. Existing single-device setups break but migration is straightforward.

### 3. Web API changes

- `GET /api/devices` — list all devices with current status
- `GET /api/devices/{id}/status` — single device status
- `POST /api/devices/{id}/start` (etc.) — per-device commands
- `GET /api/events` — SSE events include `device` field in payload
- Keep `/api/status` as a convenience returning all devices

### 4. Frontend device switcher

Tab bar or dropdown at the top of the UI showing device names. Selected device controls which status/commands are shown. All devices' SSE updates are received; the UI filters by selected device.

## Risks / Trade-offs

- **[Breaking MQTT topics]** Existing consumers need to update topic subscriptions. → Mitigation: Document the change, single-device setups can use the device-slug subtopic.
- **[N cloud connections]** Each device needs its own encrypted MQTT channel. → Mitigation: Roborock cloud handles this fine; the bridge is lightweight per-connection.
