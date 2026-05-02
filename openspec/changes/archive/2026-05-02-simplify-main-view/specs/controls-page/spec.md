## ADDED Requirements

### Requirement: Controls overlay page
The UI SHALL provide a full-screen overlay for manual vacuum controls, containing Start/Pause/Dock buttons, Fan Speed selector, and Mop Mode selector.

#### Scenario: Open controls page
- **WHEN** the user taps the controls summary card on the main view
- **THEN** the UI SHALL display a full-screen controls overlay with back button

#### Scenario: Close controls page
- **WHEN** the user taps the back button on the controls overlay
- **THEN** the overlay SHALL close and the user SHALL return to the main view

#### Scenario: Controls page content
- **WHEN** the controls overlay is open
- **THEN** it SHALL display Start, Pause, Dock buttons and Fan Speed and Mop Mode selectors with the current values highlighted

### Requirement: Simplified main view
The main view SHALL show Programs as the primary action section. Controls, Fan Speed, and Mop Mode SHALL be removed from the main view and replaced with a compact controls summary card.

#### Scenario: Main view layout
- **WHEN** the main device view is displayed
- **THEN** the layout SHALL be: status card, programs, controls summary, schedule summary, map

#### Scenario: Controls summary card
- **WHEN** the device has status data
- **THEN** the controls summary card SHALL show the current fan speed and mop mode as text with a chevron, tapping it opens the controls overlay

### Requirement: Inline cleaning controls
The main view SHALL show Pause and Dock buttons inline when the device is actively cleaning, so the user can stop a cleaning run without opening the controls overlay.

#### Scenario: Device is cleaning
- **WHEN** the device state is in an active cleaning state
- **THEN** the main view SHALL display compact Pause and Dock buttons below the cleaning progress card

#### Scenario: Device is not cleaning
- **WHEN** the device state is idle, charging, or any non-cleaning state
- **THEN** the main view SHALL NOT display inline Pause/Dock buttons
