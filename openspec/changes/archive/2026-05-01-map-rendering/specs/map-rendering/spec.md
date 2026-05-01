## ADDED Requirements

### Requirement: Request map data from device
The system SHALL send a `GET_MAP_V1` IPC command with a security nonce to request map data from a device.

#### Scenario: Map request sent
- **WHEN** a map poll is triggered
- **THEN** the system sends a `GET_MAP_V1` request with a generated endpoint and nonce

### Requirement: Decode Protocol 301 map response
The system SHALL handle Protocol 301 responses by decrypting the body with AES-CBC using the nonce-derived key, then decompressing with gzip.

#### Scenario: Valid map response
- **WHEN** a Protocol 301 message is received matching a pending map request
- **THEN** the system decrypts with AES-CBC, decompresses with gzip, and passes the raw data to the map parser

#### Scenario: Invalid map response
- **WHEN** a Protocol 301 message fails decryption or decompression
- **THEN** the system logs a warning and discards the message

### Requirement: Parse binary map format
The system SHALL parse the proprietary block-based binary format extracting image pixels, room segments, robot position, charger position, and paths.

#### Scenario: Map with rooms
- **WHEN** the map data contains image and room blocks
- **THEN** the parser extracts pixel data with room IDs and segment boundaries

### Requirement: Render map to PNG
The system SHALL render parsed map data to a PNG image with distinct colors for walls, floors, rooms, robot position, and charger position.

#### Scenario: PNG generated
- **WHEN** map data is successfully parsed
- **THEN** the system produces a PNG image with rooms in distinct colors, walls in dark gray, and position markers

### Requirement: Publish map to MQTT
The system SHALL publish the rendered PNG to `{topic}/{slug}/map` with retain=true after each successful map poll.

#### Scenario: Map published
- **WHEN** a new map PNG is rendered
- **THEN** the system publishes the raw PNG bytes to the MQTT topic

### Requirement: Serve map via web API
The system SHALL expose `GET /api/devices/{slug}/map` returning the cached PNG image with content type `image/png`.

#### Scenario: Map endpoint
- **WHEN** a GET request is made to `/api/devices/carmen-og/map`
- **THEN** the system responds with the cached PNG image

#### Scenario: No map available
- **WHEN** no map has been fetched yet
- **THEN** the system responds with HTTP 404

### Requirement: Display map in web UI
The web UI SHALL display the map image for the selected device, refreshing periodically.

#### Scenario: Map displayed
- **WHEN** the selected device has a map available
- **THEN** the UI shows the map PNG image above the controls

### Requirement: Periodic map polling
The system SHALL poll maps less frequently than status — every 5th poll cycle by default, or more frequently during active cleaning.

#### Scenario: Idle device
- **WHEN** the device is idle
- **THEN** the map is polled every 5th status poll cycle

#### Scenario: Cleaning device
- **WHEN** the device is actively cleaning
- **THEN** the map is polled on every status poll cycle
