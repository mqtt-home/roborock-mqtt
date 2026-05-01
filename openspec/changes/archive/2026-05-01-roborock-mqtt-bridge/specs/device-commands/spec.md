## ADDED Requirements

### Requirement: Start cleaning
The system SHALL send `APP_START` to the device when a start command is received.

#### Scenario: Start full cleaning
- **WHEN** a start command is issued
- **THEN** the system sends an `APP_START` IPC request (protocol 101) to the device

### Requirement: Pause cleaning
The system SHALL send `APP_PAUSE` to the device when a pause command is received.

#### Scenario: Pause active cleaning
- **WHEN** a pause command is issued during active cleaning
- **THEN** the system sends an `APP_PAUSE` IPC request to the device

### Requirement: Return to dock
The system SHALL send `APP_CHARGE` to the device when a dock command is received.

#### Scenario: Send to dock
- **WHEN** a dock command is issued
- **THEN** the system sends an `APP_CHARGE` IPC request to the device

### Requirement: Segment cleaning
The system SHALL send `APP_SEGMENT_CLEAN` with room segment IDs when a segment clean command is received.

#### Scenario: Clean specific rooms
- **WHEN** a segment clean command is issued with segment IDs [16, 17]
- **THEN** the system sends an `APP_SEGMENT_CLEAN` request with the segment IDs as parameters

### Requirement: Set fan speed
The system SHALL send `SET_CUSTOM_MODE` to change the suction power level.

#### Scenario: Change suction to turbo
- **WHEN** a set fan speed command is issued with speed "turbo"
- **THEN** the system maps "turbo" to the numeric fan speed value and sends `SET_CUSTOM_MODE`

### Requirement: Set mop mode
The system SHALL send `SET_CLEAN_MOTOR_MODE` to change the mop intensity.

#### Scenario: Change mop mode to deep
- **WHEN** a set mop mode command is issued with mode "deep"
- **THEN** the system maps "deep" to the numeric mode value and sends the corresponding IPC request

### Requirement: Set water box level
The system SHALL set the water box custom mode to control water flow during mopping.

#### Scenario: Change water level
- **WHEN** a set water box command is issued with level "moderate"
- **THEN** the system maps "moderate" to the numeric value and sends the corresponding IPC request

### Requirement: Get device status
The system SHALL periodically poll device status using `GET_PROP` and parse the response into a structured status object containing battery level, cleaning state, fan speed, water box mode, error codes, and cleaning statistics.

#### Scenario: Status polling
- **WHEN** the polling interval elapses
- **THEN** the system sends a `GET_PROP` request and updates the internal device state from the response

### Requirement: Get consumable status
The system SHALL retrieve consumable wear levels using `GET_CONSUMABLE`.

#### Scenario: Consumable check
- **WHEN** status is polled
- **THEN** the system also retrieves consumable data (filter, brush, sensor hours remaining)
