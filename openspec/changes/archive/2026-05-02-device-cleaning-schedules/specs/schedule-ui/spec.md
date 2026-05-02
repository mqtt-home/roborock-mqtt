## ADDED Requirements

### Requirement: Schedule section in device view
The web UI SHALL display a "Schedule" section for the selected device, positioned below the existing controls. The section SHALL show the current day type, today's time slots, and the not-at-home toggle.

#### Scenario: Device has schedules configured
- **WHEN** the selected device has schedule config defined
- **THEN** the UI SHALL display the schedule section with the active day type label, today's time slots with times and action descriptions, and highlight the next upcoming slot

#### Scenario: Device has no schedules configured
- **WHEN** the selected device has no schedule config
- **THEN** the UI SHALL not display the schedule section

### Requirement: Day type indicator
The UI SHALL display the currently active day type with a visual label. Each day type SHALL have a distinct visual treatment (color or icon) to be easily distinguishable.

#### Scenario: Normal day active
- **WHEN** the active day type is `normal`
- **THEN** the UI SHALL display a "Normal" label with default styling

#### Scenario: Weekend/holiday active
- **WHEN** the active day type is `weekend`
- **THEN** the UI SHALL display a "Weekend" label with distinct styling indicating a non-working day

#### Scenario: Day type changes via SSE
- **WHEN** a schedule state SSE event indicates a day type change
- **THEN** the UI SHALL update the day type indicator in real time without page reload

### Requirement: Not-at-home toggle
The UI SHALL provide a toggle control for the not-at-home state of the selected device. The toggle SHALL immediately call the API to persist the state change.

#### Scenario: User enables not-at-home
- **WHEN** the user activates the not-at-home toggle
- **THEN** the UI SHALL call `PUT /api/devices/{slug}/not-at-home` with `{"enabled": true}` and update the displayed day type to `notAtHome`

#### Scenario: User disables not-at-home
- **WHEN** the user deactivates the not-at-home toggle
- **THEN** the UI SHALL call `PUT /api/devices/{slug}/not-at-home` with `{"enabled": false}` and the day type SHALL re-evaluate based on remaining signals

### Requirement: Today's schedule display
The UI SHALL display the time slots for the currently active day type as a vertical list, showing the time and action description for each slot.

#### Scenario: Multiple slots today
- **WHEN** the active day type has 3 time slots defined
- **THEN** the UI SHALL display all 3 slots in chronological order with their times and action names

#### Scenario: No slots for active day type
- **WHEN** the active day type is `notAtHome` with an empty schedule
- **THEN** the UI SHALL display a message indicating no cleaning is scheduled

#### Scenario: Next slot highlighting
- **WHEN** the current time is 10:30 and slots exist at 09:00 (past) and 14:00 (upcoming)
- **THEN** the UI SHALL visually highlight the 14:00 slot as "next" and show the 09:00 slot as completed

### Requirement: Schedule REST API endpoints
The backend SHALL expose REST API endpoints for schedule state and not-at-home management.

#### Scenario: Get device schedule
- **WHEN** a GET request is made to `/api/devices/{slug}/schedule`
- **THEN** the system SHALL respond with JSON containing: the schedule config for all day types, the active day type, signal values (holiday, vacation, notAtHome), and the next scheduled action (time and action)

#### Scenario: Get global schedule status
- **WHEN** a GET request is made to `/api/schedule/status`
- **THEN** the system SHALL respond with JSON containing: per-device active day types, signal values, and next actions

#### Scenario: Toggle not-at-home
- **WHEN** a PUT request is made to `/api/devices/{slug}/not-at-home` with body `{"enabled": true}`
- **THEN** the system SHALL update the persisted not-at-home state and respond with the updated schedule state

#### Scenario: Device not found
- **WHEN** a schedule API request references an unknown device slug
- **THEN** the system SHALL respond with HTTP 404 and an error message

### Requirement: Schedule draft mode
The UI SHALL provide a draft mode where users can compose schedule time slots and view the resulting JSON configuration snippet. The draft SHALL NOT be persisted by the application — users manually copy the JSON to their config file.

#### Scenario: User creates a draft schedule
- **WHEN** the user adds time slots in the draft editor
- **THEN** the UI SHALL render the corresponding JSON config snippet formatted for copy-paste

#### Scenario: User copies draft to clipboard
- **WHEN** the user clicks the copy button on the draft JSON
- **THEN** the UI SHALL copy the JSON snippet to the clipboard

### Requirement: SSE schedule events
The backend SHALL broadcast schedule state changes via the existing SSE endpoint. Schedule events SHALL use a distinct event type to differentiate from device status events.

#### Scenario: Schedule state change broadcast
- **WHEN** the active day type changes or a not-at-home toggle occurs
- **THEN** the system SHALL send an SSE event with the updated schedule state for the affected device

#### Scenario: Client receives schedule event
- **WHEN** the frontend SSE hook receives a schedule event
- **THEN** the UI SHALL update the schedule section without requiring a manual refresh
