## Context

The `VectorRoom` struct already has `id`, `color`, and `spans`. The spans are run-length encoded pixel rows. To place a label we need the visual center of the room area. Room names aren't in the map binary — they need to be configured or fetched.

## Goals / Non-Goals

**Goals:**
- Compute room centroid from spans and include it in the vector JSON
- Render room labels on the SVG map (name if configured, ID as fallback)
- Config-based room name mapping per device

**Non-Goals:**
- Fetching room names from the Roborock cloud API (would require additional API calls and auth scope)
- Editable room names in the UI (config-only for now)

## Decisions

### 1. Compute centroid from spans

For each room, compute the average X and Y of all its pixel spans (weighted by span width). This gives a reasonable visual center even for irregular room shapes.

```
centerX = sum(span.x + span.w/2 * span.w) / sum(span.w)
centerY = sum(span.y * span.w) / sum(span.w)
```

### 2. Include center in VectorRoom JSON

Add `center` field to `VectorRoom`:
```json
{ "id": 16, "color": "#4285F4", "center": [120, 85], "spans": [...] }
```

### 3. Room name config

Optional `room_names` per device in the config:

```json
{
  "roborock": {
    "room_names": {
      "My Vacuum": {
        "16": "Living Room",
        "17": "Kitchen",
        "18": "Bedroom"
      }
    }
  }
}
```

Room IDs are strings (JSON keys) mapping to display names. These are passed through the map JSON API.

### 4. API includes room names

The vector map JSON gets a `room_names` map from the config. The frontend uses this for labels, falling back to "Room {id}" if unconfigured.

### 5. SVG text labels

Render `<text>` elements at each room's center point. Use small font size (3-4 SVG units), white text with dark stroke for readability over colored room backgrounds.
