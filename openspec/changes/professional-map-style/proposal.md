## Why

The current map rendering uses flat colored rectangles for rooms, plain gray for floors, and dark fills for walls. It looks functional but basic. Inspired by a professional smart home blueprint aesthetic, the map should have a dark tech/blueprint theme with:
- Subtle dark grid background
- Room areas as semi-transparent fills with glowing colored borders
- Neon-style outline glow effects on room boundaries
- Clean room name labels
- Distinct room color palette with more visual depth

## What Changes

- Restyle the SVG map rendering in `VectorMap.tsx` for a dark tech/blueprint aesthetic
- **Backend**: Compute room boundary outlines (not just filled spans) so the frontend can render glowing room borders
- Dark background with subtle grid pattern
- Room fills: very low opacity with their color, plus a bright glowing outline at room edges
- Walls rendered with subtle glow
- Path, robot, charger styled to match the theme
- Room labels with glow effect for readability

## Capabilities

### New Capabilities
- `professional-map-rendering`: Blueprint-style map with room outlines, glow effects, and dark grid background

### Modified Capabilities

_(none)_

## Impact

- **Backend**: `map_vector.go` — compute room boundary edges (perimeter spans/edges) for each room
- **Frontend**: `VectorMap.tsx` — complete SVG style overhaul with SVG filters for glow, grid pattern, new color scheme
