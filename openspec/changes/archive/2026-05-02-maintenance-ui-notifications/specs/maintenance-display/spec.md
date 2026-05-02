## ADDED Requirements

### Requirement: Consumable percentage computation
The backend SHALL compute the remaining percentage for each consumable as `max(0, 100 - (work_time / lifetime * 100))`, using configurable lifetime values with sensible defaults.

#### Scenario: Default lifetimes
- **WHEN** no custom lifetimes are configured
- **THEN** the system SHALL use defaults: main brush 1,080,000s, side brush 720,000s, filter 540,000s, sensor 108,000s

#### Scenario: Custom lifetimes in config
- **WHEN** the config contains `notifications.consumable_lifetimes.main_brush: 900000`
- **THEN** the system SHALL use 900,000s as the main brush lifetime for percentage calculation

#### Scenario: Work time exceeds lifetime
- **WHEN** a consumable's work time exceeds its configured lifetime
- **THEN** the remaining percentage SHALL be 0 (not negative)

### Requirement: Consumable data in API responses
The device status API and SSE events SHALL include consumable percentages alongside the raw work time values.

#### Scenario: Status includes consumable percentages
- **WHEN** a device status is published
- **THEN** it SHALL include a `consumable_percents` field with `main_brush`, `side_brush`, `filter`, and `sensor` as integer percentages (0-100)

### Requirement: Maintenance summary card on main view
The web UI SHALL display a compact maintenance card on the main device view showing the overall consumable health.

#### Scenario: All consumables healthy
- **WHEN** all consumable percentages are above 50%
- **THEN** the card SHALL show a green indicator with "All good" text

#### Scenario: One consumable in warning state
- **WHEN** one or more consumables are between 20-50%
- **THEN** the card SHALL show an amber indicator with the name of the worst consumable

#### Scenario: One consumable critical
- **WHEN** one or more consumables are below 20%
- **THEN** the card SHALL show a red indicator with the name of the worst consumable and a red border

### Requirement: Maintenance detail page
The web UI SHALL provide a full-screen maintenance overlay (accessible from the summary card) showing each consumable with its name, remaining percentage, hours used, and a color-coded progress bar.

#### Scenario: Maintenance page content
- **WHEN** the maintenance page is open
- **THEN** it SHALL display four consumable entries: Main Brush, Side Brush, Filter, Sensor — each with a progress bar, percentage, and hours used

#### Scenario: Reset button per consumable
- **WHEN** the maintenance page is open
- **THEN** each consumable entry SHALL have a "Reset" button that resets the counter after confirmation

### Requirement: Consumable counter reset
The system SHALL support resetting individual consumable counters via the Roborock cloud IPC protocol and a REST API endpoint.

#### Scenario: Reset main brush via API
- **WHEN** a `POST /api/devices/{slug}/consumables/main_brush/reset` request is made
- **THEN** the system SHALL send a `reset_consumable` IPC command for `main_brush_work_time` to the device and clear the notification state for that consumable

#### Scenario: Reset via UI
- **WHEN** the user clicks "Reset" on a consumable and confirms
- **THEN** the UI SHALL call the reset API endpoint and refresh the consumable display

#### Scenario: Reset clears notification state
- **WHEN** a consumable counter is reset
- **THEN** the notification state for that consumable SHALL be cleared so future threshold alerts can fire again

### Requirement: Progress bar color coding
- **WHEN** a consumable is above 50% remaining
- **THEN** its progress bar SHALL be green
- **WHEN** a consumable is between 20-50%
- **THEN** its progress bar SHALL be amber
- **WHEN** a consumable is below 20%
- **THEN** its progress bar SHALL be red
