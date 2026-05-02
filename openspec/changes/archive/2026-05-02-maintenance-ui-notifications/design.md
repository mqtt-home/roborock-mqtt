## Context

The `ConsumableStatus` type already exists with four fields:
- `main_brush_work_time` — seconds of use (typical lifetime: ~300 hours = 1,080,000s)
- `side_brush_work_time` — seconds of use (typical lifetime: ~200 hours = 720,000s)
- `filter_work_time` — seconds of use (typical lifetime: ~150 hours = 540,000s)
- `sensor_dirty_time` — seconds since last sensor cleaning (typical threshold: ~30 hours = 108,000s)

These values are polled with each status update and published in `PublishedStatus.Consumables`. The frontend already has the `ConsumableStatus` TypeScript type but never renders it.

## Goals / Non-Goals

**Goals:**
- Show consumable wear levels in the UI with progress bars and percentage remaining
- Color code: green (>50%), amber (20-50%), red (<20%)
- Configurable email notifications when thresholds are crossed
- Avoid duplicate alerts (track sent state, reset on value drop indicating replacement)
- Simple SMTP configuration in the config file

**Non-Goals:**
- Push notifications (web push, mobile)
- Dustbin-full detection (this is a separate sensor/state, not a consumable timer)
- Consumable reset via the UI (done through the Roborock app)

## Decisions

### 1. Consumable lifetime constants

Define expected lifetimes as constants (matching Roborock's recommendations). Users can override these via config if their model differs.

```json
{
  "notifications": {
    "consumable_lifetimes": {
      "main_brush": 1080000,
      "side_brush": 720000,
      "filter": 540000,
      "sensor": 108000
    }
  }
}
```

Defaults are used when not configured. The percentage remaining is: `max(0, 100 - (work_time / lifetime * 100))`.

### 2. Maintenance display: section on main view or controls page

Add a "Maintenance" card on the main view (below controls summary, above schedule) showing compact progress bars for each consumable. Tapping opens a maintenance detail overlay (same pattern as controls/schedule pages) with full information.

The compact card shows the worst consumable status as a summary. If any consumable is red, the card border turns red as a visual alert.

### 3. Email notifications via SMTP

Config-based SMTP settings:

```json
{
  "notifications": {
    "email": {
      "enabled": false,
      "smtp_host": "smtp.example.com",
      "smtp_port": 587,
      "username": "${SMTP_USER}",
      "password": "${SMTP_PASS}",
      "from": "roborock@example.com",
      "to": "user@example.com"
    },
    "thresholds": {
      "warn_percent": 20,
      "critical_percent": 10
    }
  }
}
```

Supports env var substitution (already exists in config loader). Uses Go's `net/smtp` with STARTTLS.

### 4. Notification state: track sent alerts in data directory

Store sent notification state in `{dataDir}/notifications/state.json`:

```json
{
  "device-name": {
    "main_brush": { "last_notified_percent": 15, "work_time_at_notify": 918000 }
  }
}
```

A notification is sent when a consumable drops below the threshold AND hasn't been notified at this level yet. When `work_time` drops significantly (indicating replacement), the notification state resets for that consumable.

### 5. Check thresholds after each poll

The notification check runs after `PollAll()` in the polling loop. It compares current percentages against thresholds and the notification state, sends emails for new alerts, and updates state.

### 6. Consumable reset via IPC

Add a `reset_consumable` IPC command builder in `commands.go`. The Roborock protocol uses method `reset_consumable` with a param array containing the field name (e.g. `["main_brush_work_time"]`).

REST endpoint: `POST /api/devices/{slug}/consumables/{name}/reset` where name is one of `main_brush`, `side_brush`, `filter`, `sensor`. The handler sends the IPC command and clears the notification state for that consumable.

The UI shows a "Reset" button on each consumable in the maintenance detail page, with a confirmation modal before executing.

## Risks / Trade-offs

- **[SMTP reliability]** → If SMTP send fails, log the error and retry on next poll. Don't block the polling loop.

- **[Lifetime accuracy]** → Default lifetimes are approximate. Different Roborock models may have different recommendations. Config override handles this.

- **[No dustbin sensor]** → The consumable timers don't include dustbin fullness (that's a separate device state). The proposal title mentions "empty the bin" but this is a timer-based proxy at best. Document this limitation.
