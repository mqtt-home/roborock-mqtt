## ADDED Requirements

### Requirement: Web server with chi router
The system SHALL serve a web UI and REST API on a configurable port using the chi router. The web server SHALL be optional and controlled by the `web.enabled` config flag.

#### Scenario: Web server enabled
- **WHEN** `web.enabled` is true in the configuration
- **THEN** the system starts an HTTP server on the configured port serving the SPA and API routes

#### Scenario: Web server disabled
- **WHEN** `web.enabled` is false in the configuration
- **THEN** no HTTP server is started

### Requirement: Health endpoint
The system SHALL expose `GET /api/health` returning HTTP 200 for health checks.

#### Scenario: Health check
- **WHEN** a GET request is made to `/api/health`
- **THEN** the system responds with HTTP 200

### Requirement: Status API
The system SHALL expose `GET /api/status` returning the current device status as JSON.

#### Scenario: Get status
- **WHEN** a GET request is made to `/api/status`
- **THEN** the system responds with the current device status JSON

### Requirement: Command API endpoints
The system SHALL expose POST endpoints for device commands: `/api/start`, `/api/pause`, `/api/dock`, `/api/fan-speed`, `/api/mop-mode`.

#### Scenario: Start via API
- **WHEN** a POST request is made to `/api/start`
- **THEN** the system dispatches a start cleaning command

#### Scenario: Set fan speed via API
- **WHEN** a POST request is made to `/api/fan-speed` with `{"speed": "turbo"}`
- **THEN** the system dispatches a set fan speed command

### Requirement: Server-Sent Events for live status
The system SHALL expose `GET /api/events` as an SSE endpoint that streams status updates to connected clients in real-time.

#### Scenario: SSE client receives update
- **WHEN** a client is connected to `/api/events` and the device status changes
- **THEN** the client receives the updated status as an SSE event

### Requirement: SPA serving
The system SHALL serve the built React frontend from `web/dist/` as a single-page application, with all non-API routes falling back to `index.html`.

#### Scenario: Frontend loaded
- **WHEN** a browser navigates to the root URL
- **THEN** the system serves the React SPA from the embedded dist directory
