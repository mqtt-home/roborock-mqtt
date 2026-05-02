## Why

The application already polls consumable wear data (main brush, side brush, filter, sensor) for each device, but this information is only published to MQTT — it's never shown in the web UI. Users have no visibility into when maintenance is needed without checking MQTT directly.

Additionally, there's no way to get proactive notifications when a consumable reaches a critical threshold. For a home automation setup, email notifications when the dustbin is full or a brush needs replacement would save users from discovering issues only when the robot fails mid-clean.

## What Changes

- Add a maintenance section to the web UI showing consumable wear levels with visual progress bars
- Display remaining lifetime as percentages with color coding (green/amber/red)
- Add email notification support for maintenance alerts when consumables exceed configurable thresholds
- Email configuration in the config file (SMTP settings, recipient, optional per-consumable thresholds)
- Track which alerts have been sent to avoid duplicate notifications (reset when consumable is replaced/reset)
- Allow resetting consumable counters from the web UI (e.g., after replacing a brush or filter)

## Capabilities

### New Capabilities
- `maintenance-display`: Web UI visualization of consumable wear levels with progress indicators and color-coded status
- `maintenance-notifications`: Email notification system for maintenance alerts when consumables reach configured thresholds

### Modified Capabilities

_(none)_

## Impact

- **Config**: New `notifications` section with SMTP settings and threshold configuration
- **Backend**: New email sender, threshold checker running after each status poll, notification state persistence
- **Frontend**: New maintenance section/page in the device view
- **Backend commands**: New `reset_consumable` IPC command to reset individual consumable counters via the Roborock cloud protocol
- **Dependencies**: Go `net/smtp` (stdlib) for email sending — no external dependency needed
