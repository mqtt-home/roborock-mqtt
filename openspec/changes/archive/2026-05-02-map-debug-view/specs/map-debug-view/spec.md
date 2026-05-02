## ADDED Requirements

### Requirement: Preserve unknown map blocks
The map parser SHALL store all unknown block types with their metadata and attempt to parse coordinate data from their contents.

#### Scenario: Unknown block with no data
- **WHEN** a block with unknown type has dataLen=0
- **THEN** the system SHALL store it as a debug block with type, header length, and empty points

#### Scenario: Unknown block with coordinate-like data
- **WHEN** a block with unknown type has data that can be interpreted as int16 coordinate pairs
- **THEN** the system SHALL parse and store the coordinates as points, transformed to pixel coordinates

#### Scenario: Unknown block with large non-coordinate data
- **WHEN** a block with unknown type has very large data (e.g., type 17 secondary image)
- **THEN** the system SHALL store the metadata but not attempt to parse it as coordinates

### Requirement: Debug blocks in vector JSON
The vector map JSON SHALL include a `debug_blocks` array containing all block types (known and unknown) with their type ID, label, data size, and parsed points.

#### Scenario: Vector JSON includes debug blocks
- **WHEN** the map is converted to vector JSON
- **THEN** the JSON SHALL contain a `debug_blocks` field with an entry for each block encountered during parsing

### Requirement: Debug panel in map UI
The map view SHALL provide a togglable debug panel listing all map block types. Hovering a block type SHALL highlight its associated data on the map canvas.

#### Scenario: Toggle debug panel
- **WHEN** the user clicks a debug toggle on the map view
- **THEN** a panel SHALL appear listing all block types with their IDs, names, and data sizes

#### Scenario: Hover to highlight
- **WHEN** the user hovers over a block entry in the debug panel
- **THEN** the map canvas SHALL highlight the points/areas associated with that block type in a distinct color

#### Scenario: No points for a block
- **WHEN** a block has no parseable coordinate data
- **THEN** hovering it SHALL show no highlight on the map, and the entry SHALL indicate "no spatial data"

### Requirement: Known block type labels
The debug panel SHALL display human-readable labels for known block types (e.g., "Charger" for type 1, "No-Go Zones" for type 9) and "Block N" for truly unknown types.

#### Scenario: Known block type
- **WHEN** the debug panel lists block type 1
- **THEN** it SHALL display "Charger (1)"

#### Scenario: Unknown block type
- **WHEN** the debug panel lists block type 31
- **THEN** it SHALL display "Block 31"
