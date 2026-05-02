## Context

The app is a single-page React app (React 19, Tailwind, Vite) with a mobile-first `max-w-md` layout. The current device view stacks: status card, controls, fan speed, mop mode, programs, schedule section, and map — all in one scrollable column.

Scenes are already fetched per device via `GET /api/devices/{slug}/scenes` returning `[{id, name}]`. The `ScheduleEditor` (from the provisioning change) uses a numeric `scene_id` input.

## Goals / Non-Goals

**Goals:**
- Dedicated schedule page/dialog with full space for visualization and editing
- Compact summary in device view as entry point
- Scene picker dropdown in schedule editor, showing scene names

**Non-Goals:**
- Client-side routing (react-router) — the app doesn't use a router; use a dialog/overlay pattern instead
- Fetching scene details beyond id/name — the existing API is sufficient

## Decisions

### 1. Full-screen overlay instead of route-based page

Since the app has no router, the schedule "page" is implemented as a full-screen overlay (`fixed inset-0`) with its own scroll context. This keeps the architecture simple — no routing library, just state-driven show/hide. A back/close button returns to the device view.

**Why not a modal dialog:** The schedule content (4 day types, time slots, editor, day type controls) needs full vertical space. A modal with max-height would require its own scrolling, which is awkward on mobile. A full-screen overlay is the native mobile pattern for this.

### 2. Compact schedule summary in device view

The inline `ScheduleSection` becomes a compact card showing:
- Active day type badge
- Next scheduled action (time + action name)
- A "View Schedule" button that opens the full overlay

This replaces the current full schedule rendering inline.

### 3. Scene picker: dropdown populated from device scenes

The schedule editor replaces the numeric `scene_id` input with a `<select>` dropdown populated by calling `fetchScenes(slug)`. The dropdown shows scene names, the value is the scene ID.

The scenes are loaded once when the editor opens and cached for the session. If no scenes are available (device has none), the "scene" action option is disabled or shows a message.

### 4. Scene name display in time slot list

When displaying scheduled time slots (not editing), show the scene name instead of "Scene #12345". This requires looking up the scene name from the loaded scenes list. If the scene ID doesn't match any known scene, fall back to "Scene #ID".

## Risks / Trade-offs

- **[Scene list freshness]** → Scenes are fetched from the Roborock cloud and cached per device. If a user adds a scene in the Roborock app, it won't appear until the next app restart. Acceptable — scenes change rarely.

- **[No deep linking]** → The overlay has no URL. Users can't bookmark or share a direct link to a device's schedule. Acceptable for a home automation control panel.
