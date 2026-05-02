## ADDED Requirements

### Requirement: Backend returns empty string for zero-value status fields
The backend SHALL return an empty string `""` instead of `unknown(0)` when the state, fan speed, mop mode, or water box level has a numeric value of `0`.

#### Scenario: State code is 0
- **WHEN** the device status has state value `0`
- **THEN** the `state` field in the published status SHALL be `""`

#### Scenario: Fan speed code is 0
- **WHEN** the device status has fan_power value `0`
- **THEN** the `fan_speed` field in the published status SHALL be `""`

#### Scenario: Known state code
- **WHEN** the device status has a recognized non-zero state value (e.g., `8` for charging)
- **THEN** the `state` field SHALL be the corresponding name (e.g., `"charging"`)

#### Scenario: Unknown non-zero state code
- **WHEN** the device status has an unrecognized non-zero state value (e.g., `999`)
- **THEN** the `state` field SHALL be `"unknown(999)"`

### Requirement: Frontend shows placeholder when status is empty
The web UI SHALL display a "Waiting for status..." placeholder instead of the status detail grid when the device status has no meaningful data.

#### Scenario: Status state is empty string
- **WHEN** the device status has `state === ""`
- **THEN** the UI SHALL display a placeholder message in the status card area and SHALL NOT render the battery, fan speed, mop mode, or clean time fields

#### Scenario: Status has valid data
- **WHEN** the device status has a non-empty state (e.g., `"charging"`)
- **THEN** the UI SHALL display the full status card with all detail fields as before

#### Scenario: Status transitions from empty to valid
- **WHEN** the device status updates via SSE from empty to a valid state
- **THEN** the UI SHALL replace the placeholder with the full status card
