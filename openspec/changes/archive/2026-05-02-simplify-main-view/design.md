## Context

The main view currently stacks: status, controls (3 buttons), fan speed (4 buttons), mop mode (3 buttons), programs, schedule summary, map. On mobile this is a lot of scrolling, and programs — the primary action — are buried below the rarely-used manual controls.

The app already uses the full-screen overlay pattern for the schedule page (`SchedulePage.tsx`).

## Goals / Non-Goals

**Goals:**
- Simplify the main view to: status, programs, schedule, map, with a "Controls" entry point
- Keep Pause/Dock accessible on the main view during active cleaning
- Put Start, Pause, Dock, Fan Speed, Mop Mode in a dedicated controls overlay

**Non-Goals:**
- Changing the actual control functionality
- Removing any controls entirely

## Decisions

### 1. Main view layout after change

```
Status card
Programs (primary action)
[Pause] [Dock]          ← only visible during cleaning
Controls →              ← card/button that opens overlay
Schedule →
Map
```

### 2. Controls overlay: same pattern as SchedulePage

Full-screen overlay (`fixed inset-0`) with back button, body scroll lock. Contains:
- Start / Pause / Dock buttons (same as current)
- Fan Speed selector (same grid)
- Mop Mode selector (same grid)
- Current fan speed and mop mode shown as active state

### 3. Inline Pause/Dock during cleaning

When the device is actively cleaning, show compact Pause and Dock buttons directly on the main view below the CleaningProgress card. This way users can stop/dock without navigating to the controls page.

### 4. Controls entry point: compact card with chevron

Same pattern as the schedule summary card — a single-line card showing current fan speed and mop mode, with a chevron to open the full controls page.
