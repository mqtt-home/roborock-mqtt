## Why

There is no maintained, reliable tool to integrate Roborock vacuum robots into MQTT-based smart home setups. The existing open-source project (roborock-bridge) is unmaintained and has significant bugs. We need a clean, production-quality Go application that authenticates with the Roborock cloud API, communicates with devices via their encrypted MQTT protocol, and exposes vacuum state and controls through a local MQTT broker — following the same patterns as our other smart home bridges.

## What Changes

- New Go application that authenticates with the Roborock cloud REST API (EU IoT endpoint) using Hawk protocol
- MQTT client connecting to Roborock's cloud broker for real-time device communication
- AES/ECB encrypted binary protocol implementation for device commands and status
- Local MQTT publishing of vacuum status (battery, state, cleaning mode, consumables, map info)
- Local MQTT subscription for controlling the vacuum (start, pause, dock, segment clean, suction/mop modes)
- Web UI for monitoring and controlling the vacuum
- Pprof endpoint for runtime diagnostics
- CI/CD pipeline with GitHub Actions and GoReleaser for multi-arch Docker images
- Configuration via JSON file with environment variable substitution

## Capabilities

### New Capabilities
- `roborock-auth`: Cloud API authentication (login, Hawk signing, IoT credential extraction)
- `roborock-cloud-mqtt`: Encrypted MQTT communication with Roborock cloud broker (binary protocol, AES encryption, CRC32 validation)
- `device-commands`: Vacuum command abstraction (start, pause, dock, segment clean, suction modes, mop modes, consumable status)
- `mqtt-bridge`: Local MQTT integration for publishing status and receiving commands
- `webapp`: Web UI for vacuum monitoring and control with SSE status streaming
- `project-scaffold`: Go project setup with config, logging, pprof, Makefile, Dockerfile, CI/CD

### Modified Capabilities

## Impact

- New standalone Go application in the `app/` directory
- Dependencies: `github.com/philipparndt/mqtt-gateway`, `github.com/philipparndt/go-logger`, standard crypto/aes, encoding, and net/http libraries
- New React/TypeScript web frontend in `app/web/`
- GitHub Actions workflows for build and release
- Docker multi-arch images (amd64, arm64) published to DockerHub
- Configuration file format: JSON with MQTT, Roborock credentials, web server, and log level settings
