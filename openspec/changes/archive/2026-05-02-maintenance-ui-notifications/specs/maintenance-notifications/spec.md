## ADDED Requirements

### Requirement: Email notification configuration
The system SHALL support email notification configuration in the config file under a `notifications` section with SMTP settings and threshold values.

#### Scenario: Email notifications disabled (default)
- **WHEN** no `notifications.email` section exists in the config
- **THEN** the system SHALL not attempt to send any notification emails

#### Scenario: Email notifications enabled
- **WHEN** the config contains `notifications.email.enabled: true` with valid SMTP settings
- **THEN** the system SHALL send emails when consumable thresholds are crossed

#### Scenario: SMTP with environment variables
- **WHEN** the SMTP username is configured as `"${SMTP_USER}"`
- **THEN** the system SHALL resolve the environment variable at config load time

### Requirement: Threshold-based alerting
The system SHALL check consumable percentages against configured thresholds after each status poll and send email notifications when thresholds are crossed.

#### Scenario: Consumable drops below warn threshold
- **WHEN** a consumable remaining percentage drops below `thresholds.warn_percent` (default 20%) AND no notification has been sent for this level
- **THEN** the system SHALL send a warning email identifying the device, consumable name, and remaining percentage

#### Scenario: Consumable drops below critical threshold
- **WHEN** a consumable remaining percentage drops below `thresholds.critical_percent` (default 10%) AND no critical notification has been sent
- **THEN** the system SHALL send a critical email with urgent subject line

#### Scenario: Duplicate suppression
- **WHEN** a warning notification has already been sent for a consumable at the current threshold level
- **THEN** the system SHALL NOT send another notification until the consumable is reset or replaced

### Requirement: Notification state persistence
The system SHALL persist notification state in `{dataDir}/notifications/state.json` to survive restarts.

#### Scenario: State persisted on notification send
- **WHEN** a notification email is sent
- **THEN** the system SHALL write the notification state to disk

#### Scenario: State loaded on startup
- **WHEN** the application starts
- **THEN** the system SHALL load existing notification state from disk to avoid re-sending alerts

#### Scenario: State cleared on consumable reset
- **WHEN** a consumable counter is reset (via API or detected by work time drop)
- **THEN** the notification state for that consumable SHALL be cleared

### Requirement: Email content
Notification emails SHALL contain the device name, consumable name, remaining percentage, and hours of use. The subject line SHALL indicate severity (warning or critical).

#### Scenario: Warning email content
- **WHEN** a warning email is sent for main brush at 18% remaining
- **THEN** the email subject SHALL include "Warning" and the device name, and the body SHALL include the consumable name, 18% remaining, and hours used

#### Scenario: Critical email content
- **WHEN** a critical email is sent for filter at 5% remaining
- **THEN** the email subject SHALL include "Critical" and the device name
