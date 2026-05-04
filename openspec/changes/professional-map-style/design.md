## Context

The current map uses simple `<rect>` elements per pixel row: gray for floor, colored for rooms, dark for walls. Room outlines aren't computed — rooms are just filled span areas. The reference image shows a blueprint/tech aesthetic with glowing room borders.

## Goals / Non-Goals

**Goals:**
- Dark grid background (subtle repeating grid pattern via SVG `<pattern>`)
- Room fills at very low opacity (~0.15) with their color
- Room boundary outlines rendered as bright glowing lines (SVG filter blur)
- Walls with subtle glow
- Path as a thin bright line
- Robot/charger with glow halos
- Room labels with text glow for readability
- Color palette: teal, orange, purple, blue, green (richer than current)

**Non-Goals:**
- 3D effects or animations
- Custom room icons (like the wifi/dock icons in the reference — those are app-specific)
- Changing the backend map parsing

## Decisions

### 1. Room boundary computation: edge detection from spans

For each room, detect boundary pixels by checking which span edges are at the room perimeter (no adjacent same-room pixel on one or more sides). This can be done in the backend by scanning spans and marking edges, or in the frontend by rendering room fills at low opacity and then overlaying edge-only rects.

**Approach**: Backend computes room outlines as a list of horizontal and vertical edge segments. Each edge is a line from (x1,y1) to (x2,y2). This is more efficient than per-pixel edge detection in the frontend.

### 2. SVG glow effects via filters

Define SVG `<filter>` elements:
- `roomGlow`: Gaussian blur + merge for room outline glow
- `wallGlow`: Subtler blur for walls
- `labelGlow`: Text shadow/glow

These are defined once in `<defs>` and referenced via `filter="url(#roomGlow)"`.

### 3. Grid background pattern

SVG `<pattern>` with thin lines every N pixels, rendered in a very dark color (e.g., `#1a2332`) on a dark background (`#0d1117`).

### 4. Updated color palette

Richer colors with good contrast on dark backgrounds:
```
Teal:    #00D4AA
Orange:  #FF8C42
Purple:  #A855F7
Blue:    #3B82F6
Green:   #22C55E
Pink:    #EC4899
Cyan:    #06B6D4
Amber:   #F59E0B
```

### 5. Room outline extraction

For each room, scan its spans to find boundary edges:
- **Top edge**: span row Y where row Y-1 has no span at the same X range for this room
- **Bottom edge**: span row Y where row Y+1 has no span at the same X range
- **Left/right edges**: span start/end where adjacent pixel isn't same room

Output as `VectorRoom.Outline []VectorEdge` where each edge is `{x1, y1, x2, y2}`.
