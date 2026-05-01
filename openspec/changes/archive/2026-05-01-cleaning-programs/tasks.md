## 1. Backend Scene API

- [x] 1.1 Add `Scene` type to `types.go` (id, name, and any relevant fields from the API response)
- [x] 1.2 Add `GetScenes(deviceID string)` and `ExecuteScene(sceneID int)` methods to `client.go` using Hawk auth against RRIOT API URL
- [x] 1.3 Add `Scenes` field to `ManagedDevice` and `SceneSummary` to `DeviceSummary`
- [x] 1.4 Call `GetScenes` for each device after connection in `DeviceManager.ConnectAll()`, cache results

## 2. MQTT Integration

- [x] 2.1 Publish scene list to `{topic}/{slug}/scenes` (retained) after discovery
- [x] 2.2 Handle `{"action": "scene", "scene_id": <id>}` in the MQTT command dispatcher

## 3. Web API Endpoints

- [x] 3.1 Add `GET /api/devices/{slug}/scenes` endpoint
- [x] 3.2 Add `POST /api/devices/{slug}/scenes/{id}/execute` endpoint (needs restClient for Hawk auth)

## 4. Frontend

- [x] 4.1 Add scene types and API functions (`fetchScenes`, `executeScene`) to frontend
- [x] 4.2 Add "Programs" section to the device view with scene names and execute buttons
