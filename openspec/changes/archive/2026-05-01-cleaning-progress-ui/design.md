## Context

The SSE status updates already contain all needed data: `state`, `clean_time`, `clean_area`, `battery`, `in_cleaning`. The backend publishes these on every poll (default 30s). This change is frontend-only.

## Goals / Non-Goals

**Goals:**
- Visual cleaning progress card with live-updating timer
- Battery drain visualization during cleaning
- Clear distinction between cleaning, returning, and idle states
- Smooth UX with animations

**Non-Goals:**
- Map visualization (separate change)
- Historical cleaning stats
- Estimated time remaining (not available from API)

## Decisions

### 1. Frontend-only change

No backend modifications needed. The existing SSE events provide all required fields.

### 2. Progress card component

A `CleaningProgress` component that renders when `in_cleaning` is true or state indicates active work (cleaning, returning_home, segment_cleaning, etc.). Shows:
- Large elapsed time counter (locally incremented between SSE updates for smooth display)
- Cleaned area with unit
- Battery level with color-coded indicator
- Current state as a status badge

### 3. Local timer interpolation

Between SSE updates (every 30s), the component locally increments the displayed time every second for a smooth counting effect. On each SSE update, it resets to the server's `clean_time` value.

### 4. Active states

States that indicate active cleaning: `cleaning`, `spot_cleaning`, `segment_cleaning`, `zoned_cleaning`, `going_to_target`, `returning_home`, `washing_mop`, `emptying_dustbin`, `going_to_wash_mop`.

## Risks / Trade-offs

- **[Timer drift]** Local timer may drift from server time by up to 30s. → Acceptable; resets on each SSE update.
