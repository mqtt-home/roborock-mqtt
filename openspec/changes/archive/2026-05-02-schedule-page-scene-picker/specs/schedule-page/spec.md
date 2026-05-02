## ADDED Requirements

### Requirement: Dedicated schedule overlay page
The UI SHALL provide a full-screen overlay for viewing and editing a device's schedule. The overlay SHALL contain the day type indicator, not-at-home toggle, today's time slots, and the schedule editor.

#### Scenario: Open schedule page
- **WHEN** the user clicks "View Schedule" in the compact summary card
- **THEN** the UI SHALL display a full-screen overlay with the device's complete schedule view

#### Scenario: Close schedule page
- **WHEN** the user clicks the back/close button on the schedule overlay
- **THEN** the overlay SHALL close and the user SHALL return to the device view

#### Scenario: Schedule page content
- **WHEN** the schedule overlay is open for a device with a configured schedule
- **THEN** the overlay SHALL display: the device name, the active day type badge, the not-at-home toggle, all time slots for the active day type with next-slot highlighting, and access to the schedule editor (create/edit/override based on source)

#### Scenario: Schedule page for unconfigured device
- **WHEN** the schedule overlay is open for a device with no schedule
- **THEN** the overlay SHALL display the "Create Schedule" flow

### Requirement: Compact schedule summary in device view
The schedule section in the device view SHALL be replaced with a compact summary card that serves as the entry point to the schedule overlay.

#### Scenario: Device has schedule with upcoming action
- **WHEN** a device has a schedule and there is a next scheduled action
- **THEN** the summary card SHALL show the active day type badge, the next action time and description, and a "View Schedule" button

#### Scenario: Device has schedule with no remaining actions today
- **WHEN** a device has a schedule but all actions for today have passed
- **THEN** the summary card SHALL show the active day type badge, "No more actions today", and a "View Schedule" button

#### Scenario: Device has no schedule
- **WHEN** a device has no schedule configured
- **THEN** the summary card SHALL show "No schedule" with a "Create Schedule" button that opens the schedule overlay

### Requirement: Schedule state updates propagate to overlay
SSE schedule state changes SHALL update the schedule overlay in real time if it is open.

#### Scenario: Day type changes while overlay is open
- **WHEN** the schedule overlay is open and an SSE event changes the active day type
- **THEN** the overlay SHALL update the day type badge and time slot list immediately
