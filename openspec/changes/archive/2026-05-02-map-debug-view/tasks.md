## 1. Backend: Preserve Unknown Blocks

- [x] 1.1 Add `DebugBlock` struct to `map.go` with type, header/data lengths, and parsed points
- [x] 1.2 Add `DebugBlocks []DebugBlock` field to `MapData`
- [x] 1.3 In `parseBlock` default case: create a `DebugBlock`, attempt to parse data as coordinate pairs (int16 x,y), store in `MapData.DebugBlocks`
- [x] 1.4 Also record known blocks (charger, image, path, etc.) as debug blocks with their type for completeness

## 2. Backend: Include Debug Blocks in Vector JSON

- [x] 2.1 Add `VectorDebugBlock` struct to `map_vector.go` with type, label, header_len, data_len, points array
- [x] 2.2 Add `DebugBlocks []VectorDebugBlock` to `VectorMap`
- [x] 2.3 In `MapToVectorJSON`: transform debug block points to pixel coordinates (same math as path), assign human-readable labels for known types
- [x] 2.4 Add a `blockTypeLabel(id int) string` helper with labels for all known Roborock block types

## 3. Frontend: Debug Panel

- [x] 3.1 Add debug block types to the VectorMap TypeScript interface
- [x] 3.2 Add a togglable "Debug" section below the map in `VectorMap.tsx` with a list of block type badges showing ID, label, and data size
- [x] 3.3 Track `hoveredBlockType` state; when hovering a badge, render the block's points as highlighted circles/rectangles on the SVG map canvas
- [x] 3.4 Style: known blocks in muted color, unknown blocks in accent color, hovered block's points rendered with a bright overlay color
