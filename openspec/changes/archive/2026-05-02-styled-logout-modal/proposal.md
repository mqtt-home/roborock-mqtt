## Why

The logout button currently uses `window.confirm()`, which renders a browser-native dialog that looks out of place in the styled web UI. A custom modal dialog consistent with the app's design language (Tailwind, dark/light theme support) would look polished and give the user a clear warning that logging out requires re-authentication via email verification code.

## What Changes

- Replace `window.confirm()` with a styled modal dialog component
- The modal shows a warning message explaining the user is about to log out from Roborock and will need to re-authenticate with a verification code
- The modal has "Cancel" and "Log out" buttons styled consistently with the app

## Capabilities

### New Capabilities
- `logout-modal`: A styled confirmation modal for the logout action

### Modified Capabilities

_(none)_

## Impact

- **Frontend**: New `ConfirmModal` component, updated `App.tsx` logout handler
- **No backend changes**
