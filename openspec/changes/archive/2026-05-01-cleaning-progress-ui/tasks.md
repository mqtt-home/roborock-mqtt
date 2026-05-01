## 1. Cleaning Progress Component

- [x] 1.1 Create `CleaningProgress.tsx` component with elapsed time, cleaned area, battery, and state badge
- [x] 1.2 Add local timer interpolation: increment displayed time every second between SSE updates, reset on new data
- [x] 1.3 Add state badge with color coding (cleaning=green, returning=blue, charging=yellow, error=red)
- [x] 1.4 Add pulsing CSS animation for the active cleaning state

## 2. Integration

- [x] 2.1 Add active cleaning state detection helper (list of states that indicate work in progress)
- [x] 2.2 Integrate `CleaningProgress` into `App.tsx` — show when device is in an active state, hide when idle
- [x] 2.3 Ensure progress card works with the device switcher (each device tracks its own state independently)
