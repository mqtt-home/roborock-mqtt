## 1. Backend: Room Outlines

- [x] 1.1 Add `VectorEdge` struct (`x1, y1, x2, y2`) and `Outline []VectorEdge` field to `VectorRoom` in `map_vector.go`
- [x] 1.2 Implement room outline extraction: scan each room's spans to find boundary edges (top, bottom, left, right perimeter segments)
- [x] 1.3 Update color palette in `hexColors` to the new bright-on-dark palette

## 2. Frontend: SVG Overhaul

- [x] 2.1 Add SVG `<defs>` section with: grid `<pattern>`, glow `<filter>` elements (roomGlow, wallGlow, labelGlow, markerGlow)
- [x] 2.2 Render dark background rect with grid pattern overlay
- [x] 2.3 Restyle room fills: very low opacity (~0.12) with room color
- [x] 2.4 Render room outlines as `<line>` elements with room color and glow filter
- [x] 2.5 Restyle walls: slate color (#475569) with subtle glow filter
- [x] 2.6 Restyle path: cyan-tinted line, thinner, translucent
- [x] 2.7 Restyle robot and charger: add glow halo circles behind markers
- [x] 2.8 Restyle room labels: white text with glow filter for readability
- [x] 2.9 Update hover: increase fill opacity (0.12 → 0.25), thicken and brighten outlines on hovered room
