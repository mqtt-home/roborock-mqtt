## ADDED Requirements

### Requirement: Schedule editor for user schedules
The UI SHALL provide a schedule editor that allows users to create and edit schedules directly, saving them via the API. The editor SHALL replace the existing draft/copy-paste mode.

#### Scenario: Create a new schedule
- **WHEN** a device has no schedule and the user opens the schedule section
- **THEN** the UI SHALL display a "Create Schedule" button that opens an empty schedule editor

#### Scenario: Edit a user schedule
- **WHEN** a device has a user-created schedule
- **THEN** the UI SHALL display an "Edit" button that opens the editor pre-filled with the current schedule

#### Scenario: Save schedule from editor
- **WHEN** the user clicks "Save" in the editor
- **THEN** the UI SHALL call `POST /api/devices/{slug}/schedule` with the edited schedule and update the displayed state

#### Scenario: Cancel editing
- **WHEN** the user clicks "Cancel" in the editor
- **THEN** the UI SHALL discard changes and return to the schedule view

### Requirement: Provisioned schedule badge
The UI SHALL display a "Provisioned" badge on schedules that come from the config file. Provisioned schedules SHALL NOT show edit or delete controls.

#### Scenario: Provisioned schedule displayed
- **WHEN** a device has a provisioned schedule (source = "provisioned")
- **THEN** the UI SHALL show a "Provisioned" badge and SHALL NOT display edit or delete buttons

#### Scenario: User schedule displayed
- **WHEN** a device has a user-created schedule (source = "user")
- **THEN** the UI SHALL NOT show a "Provisioned" badge and SHALL display edit and delete buttons

### Requirement: Override provisioned schedule
The UI SHALL allow users to create a user schedule that overrides a provisioned schedule. The override SHALL be pre-filled with the provisioned schedule's values.

#### Scenario: Override button on provisioned schedule
- **WHEN** a device has a provisioned schedule
- **THEN** the UI SHALL display an "Override" button that opens the editor pre-filled with the provisioned schedule values

#### Scenario: Override created
- **WHEN** the user saves an override schedule
- **THEN** the UI SHALL show the schedule as source "user" and the provisioned schedule SHALL be inactive

### Requirement: Delete user schedule with fallback
The UI SHALL allow deletion of user-created schedules. When deleted, the UI SHALL show the provisioned schedule if one exists, or show the empty/create state.

#### Scenario: Delete user schedule, provisioned exists
- **WHEN** the user deletes a user schedule for a device that has a provisioned schedule
- **THEN** the UI SHALL call `DELETE /api/devices/{slug}/schedule`, the provisioned schedule SHALL become active, and the UI SHALL update to show it with the "Provisioned" badge

#### Scenario: Delete user schedule, no provisioned
- **WHEN** the user deletes a user schedule for a device with no provisioned schedule
- **THEN** the UI SHALL call `DELETE /api/devices/{slug}/schedule` and show the "Create Schedule" state

### Requirement: Remove ScheduleDraft component
The `ScheduleDraft` component and its copy-paste JSON workflow SHALL be removed and replaced by the `ScheduleEditor` component.

#### Scenario: No draft mode in UI
- **WHEN** the user views the schedule section
- **THEN** the UI SHALL NOT show a "Draft Config" toggle or JSON copy-paste area
