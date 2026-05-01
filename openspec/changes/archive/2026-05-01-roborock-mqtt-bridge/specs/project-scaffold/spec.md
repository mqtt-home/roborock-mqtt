## ADDED Requirements

### Requirement: Go module initialization
The system SHALL be a Go module with `go.mod` at `app/go.mod` using module path `github.com/mqtt-home/roborock-mqtt`.

#### Scenario: Module setup
- **WHEN** the project is built
- **THEN** Go dependencies are resolved from the go.mod in the app directory

### Requirement: Configuration loading from JSON file
The system SHALL load configuration from a JSON file path provided as the first CLI argument. The configuration SHALL support environment variable substitution using `${VAR_NAME}` syntax.

#### Scenario: Load config
- **WHEN** the application starts with a config file path argument
- **THEN** the system loads and parses the JSON configuration, substituting environment variables

#### Scenario: Missing config file
- **WHEN** no CLI argument is provided
- **THEN** the system logs an error and exits

### Requirement: Structured logging with go-logger
The system SHALL use `github.com/philipparndt/go-logger` for structured logging. The log level SHALL be configurable via the `loglevel` config field, defaulting to "info".

#### Scenario: Log level configuration
- **WHEN** the config specifies `loglevel: "debug"`
- **THEN** the system outputs debug-level log messages

### Requirement: Pprof endpoint
The system SHALL start a pprof HTTP server on port 6060 at startup for runtime diagnostics.

#### Scenario: Pprof available
- **WHEN** the application is running
- **THEN** pprof endpoints are accessible at `http://localhost:6060/debug/pprof/`

### Requirement: Version information via ldflags
The system SHALL expose version, git commit, and build time injected via Go ldflags at build time.

#### Scenario: Version set at build
- **WHEN** the binary is built with ldflags
- **THEN** the version, commit hash, and build timestamp are available in the `version` package

### Requirement: Makefile with standard targets
The project SHALL include a Makefile with targets: build, build-frontend, build-backend, dev-frontend, dev-backend, run, docker, clean, deps.

#### Scenario: Build project
- **WHEN** `make build` is run
- **THEN** both the frontend and backend are compiled

### Requirement: Multi-stage Dockerfile
The project SHALL include a multi-stage Dockerfile building the frontend (node), backend (golang), and producing a distroless final image.

#### Scenario: Docker build
- **WHEN** the Docker image is built
- **THEN** the resulting image contains only the Go binary and frontend dist files, running as non-root

### Requirement: GitHub Actions CI/CD
The project SHALL include GitHub Actions workflows for build validation on push and release builds on version tags using GoReleaser with multi-arch Docker images.

#### Scenario: Push triggers build
- **WHEN** code is pushed to the repository
- **THEN** the build workflow compiles the project and builds a Docker image

#### Scenario: Tag triggers release
- **WHEN** a version tag (v*) is pushed
- **THEN** the release workflow builds multi-arch binaries and Docker images and pushes to DockerHub

### Requirement: GoReleaser configuration
The project SHALL include a `.goreleaser.yml` configuring builds for linux/amd64 and linux/arm64 with CGO_ENABLED=0, Docker image builds, and multi-arch manifests.

#### Scenario: Release build
- **WHEN** GoReleaser runs
- **THEN** it produces static binaries for both architectures and creates Docker manifest images
