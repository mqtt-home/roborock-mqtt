## ADDED Requirements

### Requirement: Confirmation modal before executing a program
The UI SHALL display a confirmation modal when the user taps a program button, before executing the scene.

#### Scenario: User taps a program
- **WHEN** the user taps a program button
- **THEN** the UI SHALL display a confirmation modal with the program name and a confirm button, and SHALL NOT execute the scene yet

#### Scenario: User confirms
- **WHEN** the user clicks confirm in the modal
- **THEN** the UI SHALL execute the scene and close the modal

#### Scenario: User cancels
- **WHEN** the user clicks cancel or the backdrop in the modal
- **THEN** the modal SHALL close and no scene SHALL be executed
