## ADDED Requirements

### Requirement: Discover scenes per device
The system SHALL fetch cleaning scenes for each device from `GET /user/scene/device/{deviceId}` using Hawk authentication against the RRIOT API URL after device connection.

#### Scenario: Device has scenes
- **WHEN** the scene API returns a list of scenes for a device
- **THEN** the system caches the scenes in the managed device and logs the count

#### Scenario: Device has no scenes
- **WHEN** the scene API returns an empty list
- **THEN** the system proceeds without error

#### Scenario: Scene API fails
- **WHEN** the scene API call fails
- **THEN** the system logs a warning and continues without scenes

### Requirement: Execute scene via REST API
The system SHALL call `POST /user/scene/{sceneId}/execute` with Hawk authentication when a scene execution is requested.

#### Scenario: Execute scene successfully
- **WHEN** a scene execution is triggered
- **THEN** the system calls the execute endpoint and returns success

### Requirement: Publish scenes to local MQTT
The system SHALL publish each device's scene list as JSON to `{topic}/{slug}/scenes` with retain=true after discovery.

#### Scenario: Scenes published
- **WHEN** scenes are discovered for a device
- **THEN** the system publishes a JSON array of scene objects to the MQTT topic

### Requirement: Execute scene via MQTT command
The system SHALL accept scene execution commands on `{topic}/{slug}/set` with `{"action": "scene", "scene_id": <id>}`.

#### Scenario: Scene command received
- **WHEN** a message `{"action": "scene", "scene_id": 12345}` is published to `{topic}/{slug}/set`
- **THEN** the system executes the scene via the cloud API

### Requirement: Scene list API endpoint
The system SHALL expose `GET /api/devices/{slug}/scenes` returning the cached scene list for a device.

#### Scenario: Get scenes
- **WHEN** a GET request is made to `/api/devices/carmen-og/scenes`
- **THEN** the system responds with the cached scene list as JSON

### Requirement: Scene execute API endpoint
The system SHALL expose `POST /api/devices/{slug}/scenes/{id}/execute` to trigger a scene.

#### Scenario: Execute via API
- **WHEN** a POST request is made to `/api/devices/carmen-og/scenes/12345/execute`
- **THEN** the system calls the Roborock cloud API to execute the scene

### Requirement: Web UI scene list
The web UI SHALL display a "Programs" section for the selected device showing each scene name with an execute button.

#### Scenario: Display programs
- **WHEN** the selected device has scenes
- **THEN** the UI shows a list of scene names with execute buttons

#### Scenario: Execute from UI
- **WHEN** the user clicks an execute button for a scene
- **THEN** the UI calls the execute API endpoint
