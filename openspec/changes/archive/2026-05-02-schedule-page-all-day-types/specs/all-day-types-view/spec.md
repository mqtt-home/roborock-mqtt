## ADDED Requirements

### Requirement: Display all day type schedules
The schedule page SHALL display a section for each of the four day types (normal, weekend, free, notAtHome) with their configured time slots, in that order.

#### Scenario: Schedule with all day types configured
- **WHEN** a device schedule has time slots defined for all four day types
- **THEN** the page SHALL display four sections, each with the day type label and its time slots

#### Scenario: Schedule with some day types empty
- **WHEN** a device schedule has time slots for "normal" and "weekend" but not "free" or "notAtHome"
- **THEN** the page SHALL display four sections, with "free" and "notAtHome" showing "No slots configured"

### Requirement: Active day type highlighting
The section for the currently active day type SHALL be visually distinguished from the other sections with an accent border and an "Active" badge.

#### Scenario: Normal day is active
- **WHEN** the active day type is "normal"
- **THEN** the "Normal" section SHALL have an accent border and "Active" badge, and all other sections SHALL use default muted styling

#### Scenario: Active day type changes via SSE
- **WHEN** an SSE event changes the active day type
- **THEN** the highlight SHALL move to the new active day type section

### Requirement: Time slot highlighting only on active day type
Past/next time slot highlighting (past slots dimmed, next slot accented) SHALL only apply to the active day type section. Non-active sections SHALL display time slots without temporal highlighting.

#### Scenario: Active section with past and upcoming slots
- **WHEN** the active day type has slots at 09:00 and 14:00, and the current time is 10:30
- **THEN** the 09:00 slot SHALL appear dimmed with a check icon, and the 14:00 slot SHALL appear highlighted as "Next"

#### Scenario: Non-active section with time slots
- **WHEN** a non-active day type has time slots
- **THEN** all slots SHALL be displayed with neutral styling (no past/next highlighting)
