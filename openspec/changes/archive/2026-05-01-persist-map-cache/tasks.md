## 1. Map Cache Persistence

- [x] 1.1 Add `SaveMapCache(slug string, pngData []byte)` method to DeviceManager: write PNG to `{sessionDir}/maps/{slug}.png`
- [x] 1.2 Call `SaveMapCache` after each successful map poll in `PollAll`
- [x] 1.3 Add `LoadMapCaches()` method to DeviceManager: read cached PNGs from `{sessionDir}/maps/` into each device's MapPNG

## 2. Startup Integration

- [x] 2.1 Call `LoadMapCaches()` after creating DeviceManager in `startBridge`, before `ConnectAll`
- [x] 2.2 Publish any loaded cached maps to MQTT immediately after loading
- [x] 2.3 `.session/maps/` already covered by existing `.session` gitignore entry
