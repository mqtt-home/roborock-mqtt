## Context

When the application starts and connects to devices, there is a brief window before the first status poll completes. During this time the device status has all-zero numeric values. The backend's name-lookup functions return `unknown(0)` for unrecognized codes, and the frontend renders these directly — producing "Unknown(0)", "0%", "0s".

The fix is two-layered:
1. **Backend**: Map state `0` to an empty string rather than `unknown(0)`, so the frontend can distinguish "no data yet" from "genuinely unknown state code"
2. **Frontend**: Detect when status is empty/zero and render a clean placeholder instead of the detail grid

## Goals / Non-Goals

**Goals:**
- Show a clean "Waiting for status..." placeholder when device status has not been received yet
- Avoid displaying meaningless zero values (0%, 0s, Unknown)

**Non-Goals:**
- Skeleton/shimmer loading animations — a simple text placeholder is sufficient
- Changing the SSE or API data structures

## Decisions

### 1. Backend: return empty strings for zero-value lookups

Change `StateName(0)`, `FanSpeedName(0)`, `MopModeName(0)`, and `WaterBoxName(0)` to return `""` instead of `unknown(0)`. This makes the JSON status cleaner and lets the frontend detect empty state trivially.

For genuinely unknown non-zero values, keep the existing `unknown(N)` format.

### 2. Frontend: detect empty status with a simple check

A status is "empty" when `state === ""` or `state === "unknown(0)"`. When detected, replace the entire status card content with a single muted "Waiting for status..." line. The card frame stays visible so the layout doesn't jump.

## Risks / Trade-offs

- **[Backwards compatibility]** → Changing `unknown(0)` to `""` in MQTT-published status could affect external consumers. Acceptable: the empty string is more correct than a fake "unknown" label, and external consumers should handle empty values anyway.
