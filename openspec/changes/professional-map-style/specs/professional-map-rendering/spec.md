## ADDED Requirements

### Requirement: Dark grid background
The map SHALL render with a dark background and a subtle repeating grid pattern.

#### Scenario: Map background
- **WHEN** the map is rendered
- **THEN** the SVG SHALL have a dark background (#0d1117) with a subtle grid pattern in a slightly lighter color

### Requirement: Room outline computation
The backend SHALL compute room boundary outlines as edge segments for each room.

#### Scenario: Room with interior
- **WHEN** a room has a contiguous area of pixels
- **THEN** the vector JSON SHALL include an `outline` field on each room containing edge segments at the room perimeter

### Requirement: Glowing room borders
The map SHALL render room boundaries with a colored glow effect matching the room's color.

#### Scenario: Room outline rendering
- **WHEN** a room has computed outlines
- **THEN** the SVG SHALL render the outlines as bright colored lines with a Gaussian blur glow filter

#### Scenario: Room fill
- **WHEN** a room area is rendered
- **THEN** the room fill SHALL be at very low opacity (~0.12-0.15) to show the grid through

### Requirement: Updated color palette
The map SHALL use a richer color palette optimized for dark backgrounds with good contrast.

#### Scenario: Room colors
- **WHEN** rooms are rendered
- **THEN** each room SHALL use a distinct bright color from the updated palette (teal, orange, purple, blue, green, pink, cyan, amber)

### Requirement: Themed map elements
Walls, paths, robot, charger, and labels SHALL be styled to match the dark blueprint theme.

#### Scenario: Walls
- **WHEN** walls are rendered
- **THEN** they SHALL appear as bright thin lines with a subtle glow

#### Scenario: Robot and charger
- **WHEN** the robot or charger position is rendered
- **THEN** they SHALL have a glow halo effect

#### Scenario: Room labels
- **WHEN** room labels are rendered
- **THEN** they SHALL have a text glow for readability on the dark background

### Requirement: Hover highlight on dark theme
Room hover highlighting SHALL work with the dark theme.

#### Scenario: Hover on dark background
- **WHEN** a room is hovered
- **THEN** the room fill opacity SHALL increase and the outline glow SHALL intensify
