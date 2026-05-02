## ADDED Requirements

### Requirement: Day type priority resolution
The system SHALL resolve the active day type for each device using the following priority (highest first):
1. `notAtHome` — if the persisted not-at-home flag is `true` for the device
2. `weekend` — if today is Saturday or Sunday, OR the public holiday MQTT signal is `true`
3. `free` — if the vacation MQTT signal is `true`
4. `normal` — fallback when no other condition applies

The system SHALL evaluate priority at each scheduled time check, not once per day.

#### Scenario: notAtHome overrides all other day types
- **WHEN** the not-at-home flag is `true` for a device AND today is a public holiday
- **THEN** the resolved day type SHALL be `notAtHome`

#### Scenario: Public holiday resolves as weekend
- **WHEN** the not-at-home flag is `false` AND today is a weekday AND the public holiday signal is `true`
- **THEN** the resolved day type SHALL be `weekend`

#### Scenario: Vacation resolves as free
- **WHEN** the not-at-home flag is `false` AND today is a weekday AND the public holiday signal is `false` AND the vacation signal is `true`
- **THEN** the resolved day type SHALL be `free`

#### Scenario: Normal weekday
- **WHEN** the not-at-home flag is `false` AND today is a weekday AND both MQTT signals are `false`
- **THEN** the resolved day type SHALL be `normal`

#### Scenario: Saturday without overrides
- **WHEN** the not-at-home flag is `false` AND today is Saturday AND no MQTT signals are active
- **THEN** the resolved day type SHALL be `weekend`

### Requirement: Schedule execution at matching time slots
The system SHALL check every minute whether any time slot matches the current `HH:MM` in the `Europe/Berlin` timezone for the resolved day type. When a match is found, the system SHALL dispatch the configured action for the device. All time and weekday evaluations SHALL use `Europe/Berlin`.

#### Scenario: Time slot matches current time
- **WHEN** the resolved day type is `normal` AND the `normal` schedule contains a slot with `time: "09:00"` AND the current time is 09:00
- **THEN** the system SHALL execute the configured action for that slot

#### Scenario: No slot matches current time
- **WHEN** no time slot for the resolved day type matches the current `HH:MM`
- **THEN** the system SHALL take no action

#### Scenario: Multiple slots at the same time
- **WHEN** two time slots are defined at the same `HH:MM` for the same day type
- **THEN** the system SHALL execute both actions in the order they appear in the config

### Requirement: Action dispatch
The system SHALL support the following actions in scheduled time slots:
- `"start"`: Start a full cleaning run (equivalent to the start command)
- `"scene"`: Execute the scene identified by `scene_id`

#### Scenario: Scene action execution
- **WHEN** a scheduled slot has `action: "scene"` with `scene_id: 12345`
- **THEN** the system SHALL call the scene execution function with the given scene ID

#### Scenario: Start action execution
- **WHEN** a scheduled slot has `action: "start"`
- **THEN** the system SHALL call the device's start cleaning function

#### Scenario: Action fails
- **WHEN** a scheduled action fails (device offline, scene not found)
- **THEN** the system SHALL log the error and continue processing remaining schedules

### Requirement: MQTT signal subscription
The system SHALL subscribe to the configured MQTT topics for public holiday and vacation signals. The system SHALL interpret the payload as a boolean: `"true"` or `true` means active, anything else means inactive. The system SHALL store the latest value in memory.

#### Scenario: Holiday signal received as true
- **WHEN** a message with payload `"true"` is received on the public holiday topic
- **THEN** the system SHALL set the internal public holiday flag to `true`

#### Scenario: Holiday signal received as false
- **WHEN** a message with payload `"false"` is received on the public holiday topic
- **THEN** the system SHALL set the internal public holiday flag to `false`

#### Scenario: No retained message on signal topic
- **WHEN** no message has been received on a signal topic
- **THEN** the system SHALL default to `false` for that signal

### Requirement: Not-at-home state persistence
The system SHALL persist the not-at-home flag per device in a JSON file at `{dataDir}/schedules/not-at-home.json`. The file SHALL be a map of device names to boolean values.

#### Scenario: Toggle not-at-home on
- **WHEN** a user sets not-at-home to `true` for a device via the API
- **THEN** the system SHALL update the in-memory flag AND write the updated state to the persistence file

#### Scenario: Toggle not-at-home off
- **WHEN** a user sets not-at-home to `false` for a device via the API
- **THEN** the system SHALL update the in-memory flag AND write the updated state to the persistence file

#### Scenario: Load not-at-home state on startup
- **WHEN** the application starts and the persistence file exists
- **THEN** the system SHALL load the not-at-home flags from the file

#### Scenario: Persistence file does not exist on startup
- **WHEN** the application starts and the persistence file does not exist
- **THEN** the system SHALL default all devices to not-at-home `false`

### Requirement: Schedule state publishing via MQTT
The system SHALL publish the current schedule state for each device to `{mqttTopic}/{slug}/schedule` as a retained JSON message containing the active day type, the next scheduled action time, and signal values.

#### Scenario: Day type changes
- **WHEN** the resolved day type changes for a device (e.g., vacation signal toggles)
- **THEN** the system SHALL publish an updated schedule state message

#### Scenario: Schedule action executes
- **WHEN** a scheduled action is executed
- **THEN** the system SHALL publish an updated schedule state with the new next scheduled action
