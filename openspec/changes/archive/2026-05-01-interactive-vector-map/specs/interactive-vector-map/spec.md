## ADDED Requirements

### Requirement: Convert map data to vector JSON
The system SHALL convert parsed map data to a JSON vector format containing room pixel spans (run-length encoded per row), wall pixels, cleaning path coordinates, and position markers.

#### Scenario: Map with rooms and path
- **WHEN** a map is parsed with room segments, walls, and a cleaning path
- **THEN** the system produces JSON with room spans grouped by ID, wall spans, path as coordinate array, and robot/charger positions

### Requirement: Serve vector map via API
The system SHALL expose `GET /api/devices/{slug}/map.json` returning the vector map data as JSON.

#### Scenario: Vector map available
- **WHEN** a GET request is made to `/api/devices/carmen-og/map.json`
- **THEN** the system responds with the cached vector map JSON

#### Scenario: No map available
- **WHEN** no map has been fetched
- **THEN** the system responds with HTTP 404

### Requirement: Interactive SVG map component
The web UI SHALL render the vector map data as an SVG with room polygons, walls, path, and position markers.

#### Scenario: Map renders
- **WHEN** vector map data is available for the selected device
- **THEN** the UI renders an SVG showing colored room areas, dark walls, and position markers

### Requirement: Zoom and pan
The web UI SHALL support zoom (mouse wheel, pinch-to-zoom) and pan (mouse drag, touch drag) on the map.

#### Scenario: Mouse wheel zoom
- **WHEN** the user scrolls the mouse wheel over the map
- **THEN** the map zooms in or out centered on the cursor position

#### Scenario: Touch pinch zoom
- **WHEN** the user pinches with two fingers on mobile
- **THEN** the map zooms in or out centered between the fingers

#### Scenario: Drag to pan
- **WHEN** the user drags on the map
- **THEN** the map pans in the drag direction

### Requirement: Cleaning path visualization
The web UI SHALL render the cleaning path as a polyline on the map showing the bot's trail.

#### Scenario: Path displayed
- **WHEN** the map contains path data
- **THEN** the UI renders a white/light polyline tracing the cleaning route

### Requirement: Robot and charger markers
The web UI SHALL display distinct markers for the robot position and charger position on the map.

#### Scenario: Markers shown
- **WHEN** the map contains robot and charger positions
- **THEN** the UI shows a green marker for the robot and a blue marker for the charger

### Requirement: Keep PNG for MQTT
The system SHALL continue publishing the PNG map to MQTT for non-web consumers.

#### Scenario: Both formats available
- **WHEN** a map is polled
- **THEN** both PNG is published to MQTT and vector JSON is cached for the web API
