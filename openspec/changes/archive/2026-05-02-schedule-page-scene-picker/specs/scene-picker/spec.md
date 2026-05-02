## ADDED Requirements

### Requirement: Scene picker dropdown in schedule editor
The schedule editor SHALL display a dropdown for selecting scenes by name instead of a numeric scene ID input. The dropdown SHALL be populated from the device's available scenes.

#### Scenario: Scenes available
- **WHEN** the schedule editor is open and the device has scenes available
- **THEN** the action "Scene" dropdown SHALL list all available scenes by name, and selecting one SHALL set the `scene_id` on the time slot

#### Scenario: No scenes available
- **WHEN** the schedule editor is open and the device has no scenes
- **THEN** the "Scene" action option SHALL be disabled in the action selector, or show a "No scenes available" message

#### Scenario: Scene ID from existing schedule
- **WHEN** the editor loads a time slot with `action: "scene"` and `scene_id: 12345`
- **THEN** the scene dropdown SHALL pre-select the scene matching ID 12345

#### Scenario: Scene ID not found in available scenes
- **WHEN** the editor loads a time slot with a `scene_id` that does not match any available scene
- **THEN** the dropdown SHALL show "Unknown scene (ID)" as the selected value

### Requirement: Scene name display in time slot list
The schedule time slot list SHALL display scene names instead of numeric IDs when showing scheduled actions.

#### Scenario: Known scene in time slot
- **WHEN** a time slot has `action: "scene"` with `scene_id: 12345` and the scene list contains a scene with `id: 12345, name: "Daily Clean"`
- **THEN** the time slot display SHALL show "Daily Clean" instead of "Scene #12345"

#### Scenario: Unknown scene in time slot
- **WHEN** a time slot has `action: "scene"` with a `scene_id` not in the scenes list
- **THEN** the time slot display SHALL show "Scene #ID" as a fallback
