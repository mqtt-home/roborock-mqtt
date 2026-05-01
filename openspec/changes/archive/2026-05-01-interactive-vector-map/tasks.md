## 1. Backend Vector Conversion

- [x] 1.1 Create `app/roborock/map_vector.go` with `MapToVectorJSON` function: convert MapData to JSON with run-length encoded room/wall spans per row, path coordinates, and positions
- [x] 1.2 Add `VectorMapJSON` field ([]byte) to `ManagedDevice`, populate alongside MapPNG after each map poll
- [x] 1.3 Add `GET /api/devices/{slug}/map.json` endpoint returning cached vector JSON

## 2. Frontend Interactive Map

- [x] 2.1 Create `VectorMap.tsx` component: fetch `/api/devices/{slug}/map.json`, render SVG with viewBox matching map dimensions
- [x] 2.2 Render room spans as SVG rects with colors from room color palette
- [x] 2.3 Render wall spans as dark SVG rects
- [x] 2.4 Render cleaning path as SVG polyline
- [x] 2.5 Render robot and charger as SVG circle markers with distinct colors
- [x] 2.6 Implement zoom (mouse wheel + pinch-to-zoom) via CSS transform scale
- [x] 2.7 Implement pan (mouse drag + touch drag) via CSS transform translate
- [x] 2.8 Replace `DeviceMap` (static PNG) with `VectorMap` in `App.tsx`
- [x] 2.9 Add periodic refresh of vector map data (same intervals as PNG)
