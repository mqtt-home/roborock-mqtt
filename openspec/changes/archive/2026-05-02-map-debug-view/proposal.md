## Why

The Roborock map binary format contains many block types that are currently ignored with "Unknown map block type" debug logs. Some of these blocks contain spatial data (no-go zones, virtual walls, carpet regions, furniture, etc.) that could be valuable for understanding and eventually rendering the full map.

To identify what each unknown block type represents, we need a debugging view that:
- Preserves all unknown blocks with their raw data in the vector map JSON
- Renders them in the UI with visual highlighting on hover
- Lets us experiment to see which blocks correspond to which map features

## What Changes

- **Backend**: Preserve unknown map blocks in `MapData` and include them in the vector JSON output, with raw data exposed as coordinate pairs where applicable
- **Backend**: Try to parse unknown blocks as coordinate data (point pairs, rectangles) based on common Roborock binary patterns
- **Frontend**: Add a debug panel on the map view listing all block types (known and unknown) with their IDs, data sizes, and hover-to-highlight functionality
- The debug view is togglable so it doesn't clutter normal usage

## Capabilities

### New Capabilities
- `map-debug-view`: Debug overlay for map block visualization with hover highlighting

### Modified Capabilities

_(none)_

## Impact

- **Backend**: `map.go` — store unknown blocks; `map_vector.go` — include debug blocks in JSON
- **Frontend**: `VectorMap.tsx` — debug panel with block list, hover highlighting
- **No new dependencies**
