## ADDED Requirements

### Requirement: User schedule file persistence
The system SHALL persist user-created schedules as JSON files at `{dataDir}/schedules/devices/{device-name}.json`. Each file SHALL contain a single `DeviceSchedule` object in the same format as the config file's schedule entries.

#### Scenario: Save a user schedule
- **WHEN** a user schedule is saved for device "my-vacuum"
- **THEN** the system SHALL write the schedule to `{dataDir}/schedules/devices/my-vacuum.json`

#### Scenario: Load user schedules on startup
- **WHEN** the application starts and user schedule files exist in the devices directory
- **THEN** the system SHALL load all user schedule files and make them available to the schedule engine

#### Scenario: No user schedule files exist
- **WHEN** the application starts and no user schedule files exist
- **THEN** the system SHALL proceed with only provisioned schedules from config

### Requirement: User schedule CRUD operations
The system SHALL provide create, read, update, and delete operations for user schedules via the `ScheduleStore`.

#### Scenario: Create a user schedule
- **WHEN** a user schedule is created for a device that has no user schedule
- **THEN** the system SHALL save the schedule file and notify the schedule engine to update

#### Scenario: Update a user schedule
- **WHEN** a user schedule is updated for a device that already has a user schedule
- **THEN** the system SHALL overwrite the schedule file and notify the schedule engine to update

#### Scenario: Delete a user schedule
- **WHEN** a user schedule is deleted for a device
- **THEN** the system SHALL remove the schedule file from disk and notify the schedule engine to update

### Requirement: Merge provisioned and user schedules
The schedule engine SHALL merge schedules from both sources. For each device, if a user-created schedule exists, it SHALL take precedence over the provisioned schedule entirely. If no user schedule exists, the provisioned schedule SHALL be used.

#### Scenario: Device has both provisioned and user schedule
- **WHEN** device "my-vacuum" has a provisioned schedule in config AND a user schedule on disk
- **THEN** the schedule engine SHALL use the user schedule and ignore the provisioned schedule

#### Scenario: User schedule deleted, provisioned exists
- **WHEN** a user schedule is deleted for a device that also has a provisioned schedule
- **THEN** the schedule engine SHALL fall back to the provisioned schedule

#### Scenario: Device has only a user schedule
- **WHEN** a device has a user schedule but no provisioned schedule in config
- **THEN** the schedule engine SHALL use the user schedule

### Requirement: Schedule source tracking
The system SHALL track the source of each active schedule as either `"provisioned"` or `"user"`. The schedule API responses SHALL include this source field.

#### Scenario: API response for provisioned schedule
- **WHEN** a `GET /api/devices/{slug}/schedule` request is made for a device with only a provisioned schedule
- **THEN** the response SHALL include `"source": "provisioned"`

#### Scenario: API response for user schedule
- **WHEN** a `GET /api/devices/{slug}/schedule` request is made for a device with a user schedule
- **THEN** the response SHALL include `"source": "user"`

#### Scenario: API response for no schedule
- **WHEN** a `GET /api/devices/{slug}/schedule` request is made for a device with no schedule
- **THEN** the response SHALL include `"source": "none"`

### Requirement: Schedule CRUD REST API
The backend SHALL expose REST endpoints for managing user schedules.

#### Scenario: Create or update user schedule
- **WHEN** a `POST /api/devices/{slug}/schedule` request is made with a valid `DeviceSchedule` body
- **THEN** the system SHALL save the user schedule, update the engine, and respond with the updated schedule state including `"source": "user"`

#### Scenario: Delete user schedule
- **WHEN** a `DELETE /api/devices/{slug}/schedule` request is made
- **THEN** the system SHALL delete the user schedule file, update the engine, and respond with the new state (which may fall back to provisioned or none)

#### Scenario: Delete when no user schedule exists
- **WHEN** a `DELETE /api/devices/{slug}/schedule` request is made for a device with no user schedule
- **THEN** the system SHALL respond with HTTP 404

### Requirement: Provisioned schedules are immutable via API
The system SHALL NOT allow modification or deletion of provisioned schedules via the REST API. Provisioned schedules can only be changed by editing the config file and restarting.

#### Scenario: Attempt to delete provisioned schedule
- **WHEN** a `DELETE /api/devices/{slug}/schedule` request is made for a device with only a provisioned schedule
- **THEN** the system SHALL respond with HTTP 404 (no user schedule to delete)
