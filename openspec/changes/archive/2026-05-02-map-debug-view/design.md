## Context

The Roborock binary map format uses numbered block types. Currently only types 1 (charger), 2 (image), 3 (vacuum path), 8 (robot position), 11 (room segments), and 1024 (digest) are parsed. The rest (9, 10, 12, 15, 16, 17, 18, 19, 21, 22, 24, 25, 26, 28, 30, 31, 32) are logged and skipped.

Based on Roborock reverse-engineering documentation:
- Type 9: No-go zones (rectangles)
- Type 10: Virtual walls (line segments)
- Type 12: No-mop zones (rectangles)
- Type 15: Restricted zones (?)
- Type 17: Secondary image (e.g. AI obstacle map overlay)
- Type 24: Smart carpet data
- Type 25: Carpet cleaning settings
- Others: Less documented, may be empty or metadata

Many spatial blocks use a consistent encoding: header contains point count at offset [8:12], data contains packed int16 coordinate pairs (x, y).

## Goals / Non-Goals

**Goals:**
- Store all unknown blocks with their raw header + data in MapData
- Attempt to parse blocks that look like coordinate data (rectangles, lines, points)
- Include parsed debug blocks in the vector JSON
- Show a togglable debug panel listing all block types with hover-to-highlight on the map canvas

**Non-Goals:**
- Fully documenting every block type (this is a discovery tool)
- Replacing the unknown blocks with proper named rendering (that comes later once we know what they are)

## Decisions

### 1. Store unknown blocks as `DebugBlock` in MapData

```go
type DebugBlock struct {
    Type       int       // block type ID
    HeaderLen  int       // header length
    DataLen    int       // data length
    Points     []MapPoint // parsed coordinate pairs (if applicable)
    RawHeader  []byte    // raw header bytes
    RawData    []byte    // raw data bytes
}
```

For blocks with data that looks like coordinate pairs (dataLen divisible by 4, reasonable values), parse them as `[]MapPoint`. For image-like blocks (type 17 with large data), skip point parsing.

### 2. Include debug blocks in vector JSON

Add a `debug_blocks` array to `VectorMap`:

```json
{
  "debug_blocks": [
    {
      "type": 9,
      "label": "Block 9",
      "header_len": 12,
      "data_len": 0,
      "points": [[x1,y1], [x2,y2], ...],
      "has_raw_data": true
    }
  ]
}
```

Points are transformed to map pixel coordinates (same as path/charger). Blocks without parseable coordinate data just have metadata.

### 3. Frontend debug panel

A collapsible "Debug" section below the map showing a list of block type badges. Each badge shows the type ID and data size. On hover, any points in that block are highlighted on the map canvas with a distinct color. Known blocks (charger, image, path, etc.) are also listed for completeness but styled differently.

### 4. Block name labels

Use known names where available (from reverse-engineering docs), show "Block N" for truly unknown types. This helps the user correlate.
