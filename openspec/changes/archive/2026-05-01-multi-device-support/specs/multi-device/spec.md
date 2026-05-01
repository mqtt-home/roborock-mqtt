## ADDED Requirements

### Requirement: Discover all devices
The system SHALL discover all devices from the home data API and create a cloud MQTT connection for each device.

#### Scenario: Account with two devices
- **WHEN** the home data response contains two devices
- **THEN** the system creates two independent CloudMQTT instances and connects both

#### Scenario: Account with one device
- **WHEN** the home data response contains one device
- **THEN** the system behaves identically to multi-device mode with a single entry

### Requirement: Per-device MQTT topics
The system SHALL publish status and subscribe to commands on per-device topics: `{topic}/{device-slug}/status` and `{topic}/{device-slug}/set`.

#### Scenario: Status published per device
- **WHEN** device "Carmen OG" reports status
- **THEN** the system publishes to `{topic}/carmen-og/status` with retain=true

#### Scenario: Command received for specific device
- **WHEN** a message is published to `{topic}/carmen-eg/set`
- **THEN** the system routes the command to the "Carmen EG" device only

### Requirement: Device list API endpoint
The system SHALL expose `GET /api/devices` returning a list of all devices with their current status.

#### Scenario: List devices
- **WHEN** a GET request is made to `/api/devices`
- **THEN** the system responds with a JSON array of devices, each containing id, name, slug, online status, and current vacuum status

### Requirement: Per-device command API endpoints
The system SHALL expose `POST /api/devices/{id}/start`, `POST /api/devices/{id}/pause`, `POST /api/devices/{id}/dock`, `POST /api/devices/{id}/fan-speed`, `POST /api/devices/{id}/mop-mode` for device-specific commands.

#### Scenario: Start specific device
- **WHEN** a POST request is made to `/api/devices/carmen-og/start`
- **THEN** the system dispatches a start command to the "Carmen OG" device

#### Scenario: Unknown device
- **WHEN** a POST request is made to `/api/devices/unknown-device/start`
- **THEN** the system responds with HTTP 404

### Requirement: SSE events include device identifier
The system SHALL include a `device` field in all SSE status events so the frontend can route updates to the correct device view.

#### Scenario: SSE update for specific device
- **WHEN** device "Carmen EG" sends a status update
- **THEN** all SSE clients receive an event with `{"device": "carmen-eg", ...status}`

### Requirement: Web UI device switcher
The web UI SHALL display a device selector allowing the user to switch between devices. The status display and controls SHALL reflect the currently selected device.

#### Scenario: Switch between devices
- **WHEN** the user selects "Carmen EG" from the device switcher
- **THEN** the status card and controls update to show Carmen EG's status

#### Scenario: Default selection
- **WHEN** the web UI loads
- **THEN** the first device is selected by default

### Requirement: Device slug generation
The system SHALL generate URL-safe slugs from device names by lowercasing, replacing spaces with hyphens, and removing special characters.

#### Scenario: Slug for "Carmen OG"
- **WHEN** a device is named "Carmen OG"
- **THEN** its slug is "carmen-og"
