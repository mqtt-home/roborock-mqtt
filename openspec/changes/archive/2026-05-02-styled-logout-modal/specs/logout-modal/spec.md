## ADDED Requirements

### Requirement: Styled confirmation modal component
The UI SHALL provide a `ConfirmModal` component with a backdrop overlay, centered card, title, message text, and cancel/confirm action buttons. The component SHALL use the app's existing Tailwind theme tokens.

#### Scenario: Modal is open
- **WHEN** the `open` prop is `true`
- **THEN** the modal SHALL render a semi-transparent backdrop covering the full viewport and a centered card with the title, message, and action buttons

#### Scenario: Modal is closed
- **WHEN** the `open` prop is `false`
- **THEN** the modal SHALL not render anything

#### Scenario: User clicks backdrop
- **WHEN** the user clicks the backdrop area outside the modal card
- **THEN** the modal SHALL call the `onCancel` callback

#### Scenario: User clicks cancel
- **WHEN** the user clicks the cancel button
- **THEN** the modal SHALL call the `onCancel` callback

#### Scenario: User clicks confirm
- **WHEN** the user clicks the confirm button
- **THEN** the modal SHALL call the `onConfirm` callback

### Requirement: Logout uses styled modal instead of window.confirm
The logout button SHALL open a styled `ConfirmModal` with a title of "Log out", a message warning that the user will be logged out from Roborock and will need to re-authenticate with a verification code, and a red-styled "Log out" confirm button.

#### Scenario: User clicks logout button
- **WHEN** the user clicks the logout icon button in the header
- **THEN** the UI SHALL display the styled logout confirmation modal

#### Scenario: User confirms logout
- **WHEN** the user clicks "Log out" in the modal
- **THEN** the UI SHALL call the logout API and redirect to the login page

#### Scenario: User cancels logout
- **WHEN** the user clicks "Cancel" or the backdrop in the modal
- **THEN** the modal SHALL close and no logout SHALL occur
