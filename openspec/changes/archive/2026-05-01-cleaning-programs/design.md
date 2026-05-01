## Context

Roborock stores cleaning scenes in the cloud. They're configured in the Roborock mobile app and represent pre-set cleaning routines (e.g., "Clean Kitchen + Living Room on Turbo"). The scenes are per-device and accessible via the RRIOT API with Hawk authentication.

## Goals / Non-Goals

**Goals:**
- Fetch scenes per device at startup and cache them
- Expose scenes via MQTT and web UI
- Allow triggering scenes via MQTT command and web UI button

**Non-Goals:**
- Creating or editing scenes (use the Roborock app for that)
- Real-time scene sync (scenes are fetched at startup; restart to refresh)

## Decisions

### 1. Scene discovery at startup

After connecting each device, call `GET /user/scene/device/{duid}` with Hawk auth. Cache the scene list in `ManagedDevice`. No periodic refresh — scenes rarely change.

**Rationale:** Simple, avoids unnecessary API calls.

### 2. MQTT topic for scenes

Publish scene list to `{topic}/{slug}/scenes` (retained). Accept scene execution on `{topic}/{slug}/set` with `{"action": "scene", "scene_id": 123}`.

**Rationale:** Reuses existing command topic pattern.

### 3. REST API endpoints

- `GET /api/devices/{slug}/scenes` — list scenes for a device
- `POST /api/devices/{slug}/scenes/{id}/execute` — trigger a scene

Both require the `restClient` for Hawk-authenticated API calls.

### 4. Web UI

Add a "Programs" section below the controls showing scene names with execute buttons.

## Risks / Trade-offs

- **[Stale scenes]** If user adds a scene in the Roborock app, they need to restart the bridge. → Acceptable for v1; could add a refresh button later.
