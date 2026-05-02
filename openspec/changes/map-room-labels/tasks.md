## 1. Backend: Room Centroids

- [x] 1.1 Compute weighted centroid for each room from its spans in `MapToVectorJSON` in `map_vector.go`
- [x] 1.2 Add `Center [2]int` field to `VectorRoom` and populate it

## 2. Room Name Config

- [x] 2.1 Add `RoomNames` field (`map[string]map[string]string` — device name → room ID → display name) to `RoborockConfig` in `config.go`
- [x] 2.2 Add `RoomNames map[string]string` to `VectorMap` JSON and populate it from config based on device name in the map JSON endpoint

## 3. Frontend: Room Labels and Hover

- [x] 3.1 Update `VectorRoom` TypeScript interface to include `center: [number, number]`
- [x] 3.2 Add `room_names` to the `VectorMapData` interface
- [x] 3.3 Render SVG `<text>` labels at each room's center (name if available, ID fallback), styled with small font and contrasting stroke
- [x] 3.4 Add `hoveredRoom` state; highlight room spans with increased opacity on hover; attach hover handlers to room spans and labels
