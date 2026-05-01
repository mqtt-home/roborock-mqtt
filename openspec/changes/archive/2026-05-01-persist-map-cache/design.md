## Context

The session directory (`.session/` next to `config.json`) already stores `session.json` for login/device persistence. Map cache files will live alongside it, using the device slug as the filename.

## Goals / Non-Goals

**Goals:**
- Persist PNG map per device to disk after each successful poll
- Load cached maps at DeviceManager startup
- Publish cached maps to MQTT immediately on bridge start
- Serve cached maps via web API before first live poll

**Non-Goals:**
- Map versioning or history
- Cache invalidation based on time (always use latest cached)
- Persisting vector JSON separately (can be regenerated from PNG parse, or persisted too once vector map is implemented)

## Decisions

### 1. File layout

```
.session/
  session.json
  maps/
    carmen-og.png
    carmen-eg.png
```

### 2. Save on every successful poll

After `PollMap` succeeds and `SetMapPNG` is called, write the PNG bytes to `maps/{slug}.png`. Overwrites previous file. Done in a goroutine to avoid blocking the poll loop.

### 3. Load at startup

In `DeviceManager`, after creating managed devices (but before `ConnectAll`), load any cached map files from disk into `ManagedDevice.MapPNG`. This makes them available to the web API and MQTT publish immediately.

### 4. Session directory passed to DeviceManager

The DeviceManager already receives the `restClient` which has the session directory. Reuse `restClient.sessionDir` for map cache location.

## Risks / Trade-offs

- **[Stale maps]** After a rearrangement of furniture, the cached map shows the old layout until the next poll. → Acceptable; maps update within the first poll cycle.
- **[Disk writes per poll]** Writing PNG on every poll (every 30s-150s) is minimal I/O. → Acceptable.
