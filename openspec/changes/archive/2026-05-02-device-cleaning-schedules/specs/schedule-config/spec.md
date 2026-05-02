## ADDED Requirements

### Requirement: Per-device schedule definition in config
The system SHALL support a `schedules` map under the `roborock` config section, keyed by device name. Each device entry SHALL contain up to four day-type keys (`normal`, `weekend`, `free`, `notAtHome`), each mapping to an array of time slot objects.

#### Scenario: Config with schedules for one device
- **WHEN** the config file contains a `schedules` map with an entry matching a known device name
- **THEN** the system SHALL parse the schedule and associate it with the corresponding managed device

#### Scenario: Config with no schedules section
- **WHEN** the config file does not contain a `schedules` section
- **THEN** the system SHALL start normally with no schedules active and no errors

#### Scenario: Schedule references unknown device name
- **WHEN** the config contains a schedule entry for a device name that does not match any discovered device
- **THEN** the system SHALL log a warning with the unmatched device name and skip that schedule entry

### Requirement: Time slot structure
Each time slot object SHALL contain a `time` field (string, `HH:MM` format in 24-hour local time) and an `action` field (string). When `action` is `"scene"`, the slot SHALL also contain a `scene_id` field (integer). When `action` is `"start"`, no additional fields are required.

#### Scenario: Valid scene time slot
- **WHEN** a time slot has `{"time": "09:00", "action": "scene", "scene_id": 12345}`
- **THEN** the system SHALL accept the slot and schedule scene execution at 09:00

#### Scenario: Valid start time slot
- **WHEN** a time slot has `{"time": "18:00", "action": "start"}`
- **THEN** the system SHALL accept the slot and schedule a cleaning start at 18:00

#### Scenario: Invalid time format
- **WHEN** a time slot has a `time` value not matching `HH:MM` 24-hour format
- **THEN** the system SHALL log an error for that slot and skip it

### Requirement: Day type definitions
The system SHALL support exactly four day types with the following semantics:
- `normal`: Default weekday schedule
- `weekend`: Saturday, Sunday, and public holidays
- `free`: Vacation at home
- `notAtHome`: Nobody is home (typically empty schedule)

#### Scenario: All four day types defined
- **WHEN** a device schedule defines all four day types with time slots
- **THEN** the system SHALL store all four schedules for that device

#### Scenario: Partial day types defined
- **WHEN** a device schedule only defines `normal` and `weekend`
- **THEN** the system SHALL treat undefined day types as having no scheduled actions (empty array)

### Requirement: MQTT signal topic configuration
The system SHALL support a `schedule_signals` map under the `roborock` config section with optional keys `public_holiday` and `vacation`, each mapping to an MQTT topic string.

#### Scenario: Custom signal topics configured
- **WHEN** the config contains `"schedule_signals": {"public_holiday": "home/holiday", "vacation": "home/vacation"}`
- **THEN** the system SHALL subscribe to `home/holiday` and `home/vacation` for day type resolution

#### Scenario: No signal topics configured
- **WHEN** the config does not contain a `schedule_signals` section
- **THEN** the system SHALL use default topics `rules/public-holiday` for public holiday and `rules/free-day` for vacation

#### Scenario: Only one signal topic configured
- **WHEN** the config contains only `"schedule_signals": {"public_holiday": "my/topic"}`
- **THEN** the system SHALL use `my/topic` for public holiday and the default `rules/free-day` for vacation
