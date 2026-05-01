## Context

The parsed `MapData` already contains all the information needed: a pixel grid (rooms, walls, floor), coordinate-based path, and position markers. Currently we render this to PNG server-side. Instead, we'll convert the pixel grid to vector polygons and send structured JSON to the frontend, which renders it as interactive SVG.

## Goals / Non-Goals

**Goals:**
- Convert pixel map to room polygons (contiguous regions of the same room ID)
- Send path coordinates, room polygons, walls, and positions as JSON
- Render as SVG in the browser with smooth zoom/pan
- Animate the cleaning path to show the bot's trail
- Touch-friendly: pinch-to-zoom, drag-to-pan on mobile

**Non-Goals:**
- 3D rendering
- Room editing or virtual wall placement
- Real-time sub-second path tracking (still poll-based)

## Decisions

### 1. Vector data format

JSON structure served from `/api/devices/{slug}/map.json`:

```json
{
  "width": 434,
  "height": 445,
  "rooms": [
    {"id": 16, "color": "#4285F4", "pixels": [[x1,y1],[x2,y1],...]}
  ],
  "walls": [[x1,y1],[x2,y1],...],
  "path": [[x1,y1],[x2,y2],...],
  "charger": {"x": 100, "y": 200},
  "robot": {"x": 150, "y": 250, "angle": 45}
}
```

Rooms use run-length encoded pixel spans rather than true polygons — simpler to generate and sufficient for SVG rendering with small rectangles. Each "pixel" in the JSON maps to a 1x1 SVG rect.

**Rationale:** True polygon extraction (marching squares) is complex and error-prone. Pixel-based rendering in SVG is simple, fast, and still supports zoom/pan.

### 2. SVG rendering with viewBox

The SVG uses a `viewBox` matching the map dimensions. Zoom/pan is achieved via CSS `transform: scale() translate()` on a wrapper div, not by modifying the SVG viewBox. This keeps rendering simple and performant.

### 3. Cleaning path as SVG polyline

The path coordinates are rendered as an SVG `<polyline>` with stroke styling. During active cleaning, the path grows with each update. An SVG `stroke-dasharray` animation shows the direction of travel.

### 4. Zoom/pan implementation

Use pointer events (mouse + touch) for pan, wheel events for zoom. Store `scale` and `translate` in React state. Pinch-to-zoom via touch events computing distance between two touches.

### 5. Keep PNG rendering for MQTT

MQTT consumers expect a PNG image. Keep the existing PNG rendering for MQTT publish but add the vector JSON endpoint for the web UI.

## Risks / Trade-offs

- **[Large JSON for detailed maps]** A 445x434 map with many rooms could produce large JSON. → Mitigation: Only include non-empty pixels; use run-length encoding per row.
- **[SVG performance with many rects]** Thousands of small SVG rects could be slow. → Mitigation: Group room pixels by row spans (run-length) to reduce rect count dramatically. A typical room row becomes 1-3 rects instead of hundreds of 1x1 rects.
