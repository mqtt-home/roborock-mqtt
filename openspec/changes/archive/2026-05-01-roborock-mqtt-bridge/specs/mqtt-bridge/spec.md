## ADDED Requirements

### Requirement: Publish device status to local MQTT
The system SHALL publish the current device status as a JSON message to `{topic}/status` on the local MQTT broker. The message SHALL be retained. Status SHALL be republished whenever it changes or at each polling interval.

#### Scenario: Status update published
- **WHEN** device status is received from the Roborock cloud
- **THEN** the system publishes a JSON status object to `{topic}/status` with retain=true, including battery, state, fan speed, water box mode, mop mode, error code, and consumable data

### Requirement: Subscribe to commands on local MQTT
The system SHALL subscribe to `{topic}/set` on the local MQTT broker and parse incoming JSON messages to dispatch vacuum commands.

#### Scenario: Receive start command
- **WHEN** a message `{"action": "start"}` is published to `{topic}/set`
- **THEN** the system dispatches a start cleaning command to the device

#### Scenario: Receive segment clean command
- **WHEN** a message `{"action": "segment_clean", "segments": [16, 17]}` is published to `{topic}/set`
- **THEN** the system dispatches a segment clean command with the specified room IDs

#### Scenario: Receive fan speed command
- **WHEN** a message `{"action": "set_fan_speed", "speed": "balanced"}` is published to `{topic}/set`
- **THEN** the system dispatches a set fan speed command with the specified level

#### Scenario: Unknown action
- **WHEN** a message with an unrecognized action is received on `{topic}/set`
- **THEN** the system logs a warning and ignores the message

### Requirement: MQTT connection using mqtt-gateway library
The system SHALL use `github.com/philipparndt/mqtt-gateway` for the local MQTT connection, configured via the standard MQTTConfig structure (url, topic, qos, retain).

#### Scenario: Local MQTT initialization
- **WHEN** the application starts
- **THEN** the system connects to the local MQTT broker using the mqtt-gateway library with the configured connection parameters

### Requirement: Graceful shutdown
The system SHALL cleanly disconnect from both the local and cloud MQTT brokers on SIGINT or SIGTERM.

#### Scenario: Shutdown signal received
- **WHEN** the process receives SIGINT or SIGTERM
- **THEN** the system disconnects from the Roborock cloud MQTT, disconnects from the local MQTT broker, and exits cleanly
