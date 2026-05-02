## Why

The map already renders rooms as colored areas (each room gets a distinct color from the pixel data), but rooms have no labels — just anonymous colored regions. The Roborock app shows room names centered in each room area, making the map much more useful.

Room names aren't available in the binary map data (they're stored in the Roborock cloud), so we need a way for users to configure room name mappings.

## What Changes

- Compute the visual center (centroid) of each room's pixel area in the backend vector map
- Display room ID labels centered in each room on the SVG map
- Add a room name configuration in the config file mapping room IDs to names per device
- When names are configured, display the name instead of the ID
- Show room IDs in the debug panel so users can identify which ID corresponds to which room

## Capabilities

### New Capabilities
- `map-room-labels`: Room labels rendered on the map with configurable names

### Modified Capabilities

_(none)_

## Impact

- **Backend**: `map_vector.go` — compute room centroids, include center position in `VectorRoom`
- **Config**: New optional `room_names` map per device under `roborock` config
- **Frontend**: `VectorMap.tsx` — render SVG text labels at room centers
