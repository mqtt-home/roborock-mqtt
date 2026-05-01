## Why

The current map is a static PNG rendered server-side. It can't be zoomed, panned, or interacted with. The cleaning path is drawn as a thin white overlay that's hard to see. Users want to explore their floor plan — zoom into rooms, follow the bot's cleaning track, and see positions clearly. Converting the pixel-based map data to vector format (SVG) enables smooth browser-native zoom/pan and crisp rendering at any scale.

## What Changes

- Backend converts parsed map data to a JSON vector format instead of (or in addition to) PNG: room polygons, wall segments, path polylines, position markers
- New API endpoint serves the vector map data as JSON
- Frontend replaces the static `<img>` with an interactive SVG-based map component using CSS transforms for zoom/pan
- Cleaning path rendered as an animated polyline showing the bot's trail
- Robot and charger positions shown as distinct SVG markers
- Room segments rendered as colored polygons with labels
- Touch gesture support for mobile (pinch-to-zoom, drag-to-pan)

## Capabilities

### New Capabilities
- `interactive-vector-map`: Convert raster map data to vector format (JSON), render as interactive SVG with zoom/pan and animated cleaning path

### Modified Capabilities

## Impact

- `app/roborock/map_vector.go` — new: convert parsed MapData to vector JSON (polygons, polylines, markers)
- `app/roborock/manager.go` — cache vector map data per device alongside PNG
- `app/web/web.go` — new endpoint `GET /api/devices/{slug}/map.json`
- `app/main.go` — publish vector map to MQTT as JSON
- `app/web/src/components/VectorMap.tsx` — new: interactive SVG map component
- `app/web/src/components/DeviceMap.tsx` — replaced by VectorMap
- No new dependencies — SVG rendering uses browser-native capabilities
