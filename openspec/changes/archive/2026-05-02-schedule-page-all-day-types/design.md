## Context

The `SchedulePage` overlay currently renders a single "Today ({dayType})" section showing only the active day type's time slots. The `DeviceSchedule` object already contains all four day types (`normal`, `weekend`, `free`, `notAtHome`) — the data is loaded, just not displayed.

## Goals / Non-Goals

**Goals:**
- Show all four day type sections on the schedule page
- Visually distinguish the active day type from inactive ones
- Keep past/next time slot highlighting for the active day type only

**Non-Goals:**
- Collapsible/expandable sections — keep it simple, show everything
- Reordering day types — use the fixed priority order

## Decisions

### 1. Iterate over all day types in priority order

Display sections in order: Normal, Weekend, Free Day, Not at Home. This matches the priority order users think about when configuring schedules.

### 2. Active day type: accent border + "Active" badge

The active day type section gets a colored left border or accent border matching the day type color, plus a small "Active" badge next to the heading. Non-active sections use the default muted card style.

### 3. Past/next highlighting only for active day type

Time slot past/next/upcoming highlighting only applies to the active day type. Non-active sections show their slots without temporal highlighting — they're informational.

### 4. Empty day types shown with placeholder

If a day type has no slots, show "No slots configured" in muted text. Don't hide empty sections — users need to see what's missing.
