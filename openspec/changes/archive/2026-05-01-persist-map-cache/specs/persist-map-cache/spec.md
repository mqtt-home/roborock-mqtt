## ADDED Requirements

### Requirement: Save map to disk after each poll
The system SHALL write the PNG map data to `{sessionDir}/maps/{slug}.png` after each successful map poll, overwriting the previous file.

#### Scenario: Map polled successfully
- **WHEN** a map poll returns PNG data for a device
- **THEN** the system writes the PNG to disk at the expected path

#### Scenario: Map poll fails
- **WHEN** a map poll fails
- **THEN** the cached file on disk is not modified

### Requirement: Load cached maps at startup
The system SHALL load cached map files from `{sessionDir}/maps/` into each managed device at startup, before the first live poll.

#### Scenario: Cache exists for device
- **WHEN** a cached map file exists for a device slug
- **THEN** the device's MapPNG is populated from the cached file at startup

#### Scenario: No cache exists
- **WHEN** no cached map file exists for a device
- **THEN** the device's MapPNG remains nil until the first live poll

### Requirement: Publish cached maps to MQTT at startup
The system SHALL publish any cached maps to MQTT immediately when the bridge starts, so consumers have data before the first poll.

#### Scenario: Cached maps published
- **WHEN** the bridge starts with cached maps available
- **THEN** the PNG is published to `{topic}/{slug}/map` with retain=true

### Requirement: Serve cached maps via web API at startup
The system SHALL serve cached maps from the web API immediately after startup, before the first live poll completes.

#### Scenario: Web API returns cached map
- **WHEN** a GET request is made to `/api/devices/{slug}/map` before the first poll
- **THEN** the system responds with the cached PNG from disk
