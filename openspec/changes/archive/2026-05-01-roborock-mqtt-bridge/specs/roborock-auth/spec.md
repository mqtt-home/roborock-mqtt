## ADDED Requirements

### Requirement: Login with Roborock cloud API
The system SHALL authenticate with the Roborock cloud REST API using username and password credentials via `POST /api/v1/login`. The system SHALL extract the authentication token, IoT credentials (userId, sessionId, HMAC key, MQTT key), and user details from the response.

#### Scenario: Successful login
- **WHEN** valid username and password are provided in the configuration
- **THEN** the system authenticates and stores the token, IoT credentials, and user metadata for subsequent API calls

#### Scenario: Invalid credentials
- **WHEN** incorrect username or password is provided
- **THEN** the system logs an error with the response code (2008 for user not found, 2012 for incorrect password) and exits

### Requirement: Hawk protocol authentication for REST API calls
The system SHALL sign all subsequent REST API requests using the Hawk protocol with HMAC-SHA256. The signature SHALL include the user ID, session ID, timestamp, nonce, and MD5 hash of the request path.

#### Scenario: Signed API request
- **WHEN** the system makes a REST API call after login (e.g., `GET /api/v1/getHomeDetail`)
- **THEN** the request includes a Hawk authorization header with a valid HMAC-SHA256 MAC computed from userId, sessionId, timestamp, nonce, and path hash

### Requirement: Device discovery via home detail
The system SHALL call `GET /api/v1/getHomeDetail` after login to retrieve the list of devices associated with the account. The system SHALL extract the first device's ID, device key, and model information.

#### Scenario: Home with devices
- **WHEN** the home detail response contains one or more devices
- **THEN** the system selects the first device and stores its device ID, device key, model, and name

#### Scenario: No devices found
- **WHEN** the home detail response contains no devices
- **THEN** the system logs an error and exits

### Requirement: Token refresh on expiry
The system SHALL re-authenticate when the existing token expires or when API calls return authentication errors.

#### Scenario: Token expired during operation
- **WHEN** an API call returns an authentication error
- **THEN** the system performs a fresh login and retries the failed operation
