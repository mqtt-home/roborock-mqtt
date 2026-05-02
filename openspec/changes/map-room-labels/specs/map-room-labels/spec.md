## ADDED Requirements

### Requirement: Room centroid computation
The backend SHALL compute the visual center of each room from its pixel spans and include it in the vector map JSON.

#### Scenario: Room with spans
- **WHEN** a room has multiple pixel spans
- **THEN** the vector JSON SHALL include a `center` field with the weighted centroid coordinates

#### Scenario: Room with single span
- **WHEN** a room has only one span
- **THEN** the center SHALL be the midpoint of that span

### Requirement: Room name configuration
The config file SHALL support an optional `room_names` map per device under the `roborock` section, mapping room IDs (as strings) to display names.

#### Scenario: Room names configured
- **WHEN** the config contains room names for a device
- **THEN** the map API SHALL include the names in the vector JSON response

#### Scenario: No room names configured
- **WHEN** no room names are configured
- **THEN** the map SHALL still display room IDs as fallback labels

### Requirement: Room labels on map
The map UI SHALL render text labels centered in each room area.

#### Scenario: Named room
- **WHEN** a room has a configured name
- **THEN** the SVG map SHALL display the name centered at the room's centroid

#### Scenario: Unnamed room
- **WHEN** a room has no configured name
- **THEN** the SVG map SHALL display the room ID centered at the room's centroid

#### Scenario: Label readability
- **WHEN** room labels are rendered
- **THEN** they SHALL use a small font with contrasting stroke/shadow for readability over colored backgrounds

### Requirement: Room highlight on hover
The map UI SHALL highlight a room when the user hovers over it (either the room area or its label).

#### Scenario: Hover over room area
- **WHEN** the user hovers over a room's colored area on the map
- **THEN** the room SHALL be visually highlighted (e.g., increased opacity or bright border)

#### Scenario: Hover leaves room
- **WHEN** the user stops hovering a room
- **THEN** the room SHALL return to its default appearance
