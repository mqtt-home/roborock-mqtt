## ADDED Requirements

### Requirement: Show cleaning progress card during active cleaning
The web UI SHALL display a prominent cleaning progress card when the selected device is actively cleaning, replacing or augmenting the standard status card.

#### Scenario: Device starts cleaning
- **WHEN** the device state transitions to an active cleaning state
- **THEN** the UI shows the cleaning progress card with elapsed time, cleaned area, and battery

#### Scenario: Device stops cleaning
- **WHEN** the device returns to idle or charging state
- **THEN** the cleaning progress card is hidden and the standard status card is shown

### Requirement: Live elapsed time counter
The web UI SHALL display a continuously counting elapsed time during cleaning, locally interpolated between SSE updates for smooth display.

#### Scenario: Timer increments
- **WHEN** the device is cleaning and 1 second passes locally
- **THEN** the displayed time increments by 1 second

#### Scenario: Timer resets on SSE update
- **WHEN** a new SSE status update arrives with `clean_time`
- **THEN** the displayed time resets to the server value

### Requirement: Cleaned area display
The web UI SHALL display the cleaned area in square meters during active cleaning.

#### Scenario: Area updates
- **WHEN** a status update includes `clean_area`
- **THEN** the UI shows the formatted area value

### Requirement: Battery drain indicator
The web UI SHALL show the battery level with color coding during cleaning to indicate drain rate.

#### Scenario: Battery above 50%
- **WHEN** battery is above 50% during cleaning
- **THEN** the battery indicator is green

#### Scenario: Battery below 20%
- **WHEN** battery drops below 20% during cleaning
- **THEN** the battery indicator is red

### Requirement: State badge
The web UI SHALL show the current device state as a colored badge (e.g., "Cleaning" in green, "Returning Home" in blue, "Charging" in yellow).

#### Scenario: Cleaning state
- **WHEN** the device state is "cleaning"
- **THEN** a green badge reading "Cleaning" is displayed

#### Scenario: Returning home
- **WHEN** the device state is "returning_home"
- **THEN** a blue badge reading "Returning Home" is displayed

### Requirement: Pulsing animation for active cleaning
The web UI SHALL show a subtle pulsing animation on the progress card to indicate active cleaning.

#### Scenario: Active cleaning pulse
- **WHEN** the device is actively cleaning
- **THEN** the progress card border or background pulses gently
