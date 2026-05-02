## ADDED Requirements

### Requirement: URL-based page navigation
The application SHALL use React Router for client-side navigation. Each page SHALL have a distinct URL.

#### Scenario: Navigate to controls page
- **WHEN** the user taps the controls summary card
- **THEN** the browser URL SHALL change to `/devices/{slug}/controls` and the controls page SHALL render

#### Scenario: Browser back button
- **WHEN** the user presses the browser back button on the controls page
- **THEN** the browser SHALL navigate back to the device main view

#### Scenario: Direct URL access
- **WHEN** the user navigates directly to `/devices/{slug}/schedule`
- **THEN** the schedule page SHALL render (after authentication check)

### Requirement: Device slug in URL
The selected device SHALL be represented in the URL path. Switching devices SHALL update the URL.

#### Scenario: Switch device
- **WHEN** the user selects a different device in the device switcher
- **THEN** the URL SHALL change to `/devices/{new-slug}`

#### Scenario: First load with no device selected
- **WHEN** the user navigates to `/` and devices are loaded
- **THEN** the app SHALL redirect to `/devices/{first-slug}`

### Requirement: SPA fallback on backend
The Go backend SHALL serve `index.html` for any request path that does not match a static file or API route, enabling client-side routing.

#### Scenario: Unknown path request
- **WHEN** a GET request is made to `/devices/my-vacuum/controls`
- **THEN** the backend SHALL serve the contents of `index.html` (not a 404)

#### Scenario: Static file request
- **WHEN** a GET request is made to `/assets/index-abc123.js`
- **THEN** the backend SHALL serve the actual static file

#### Scenario: API request
- **WHEN** a GET request is made to `/api/devices`
- **THEN** the backend SHALL serve the API response (not index.html)

### Requirement: Remove overlay pattern
The page components (Controls, Schedule, Maintenance) SHALL render as normal page content instead of fixed-position overlays. Body scroll lock hacks SHALL be removed.

#### Scenario: Controls page renders as page
- **WHEN** the controls route is active
- **THEN** the controls content SHALL render in the normal document flow (not as a fixed overlay)
