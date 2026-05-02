## 1. Controls Page Component

- [x] 1.1 Create `web/src/components/ControlsPage.tsx`: full-screen overlay with back button, body scroll lock, receives slug/status/scenes/actionLoading/handlers as props
- [x] 1.2 Move Start/Pause/Dock buttons, Fan Speed selector, and Mop Mode selector into the controls overlay

## 2. Main View Restructure

- [x] 2.1 Remove Controls, Fan Speed, and Mop Mode sections from `App.tsx`
- [x] 2.2 Add a compact controls summary card showing current fan speed and mop mode with a chevron, opens controls overlay on tap
- [x] 2.3 Add `showControlsPage` state to manage overlay open/close
- [x] 2.4 Add inline Pause/Dock buttons below CleaningProgress when device is actively cleaning
- [x] 2.5 Reorder main view: status, inline cleaning controls (if cleaning), programs, controls summary, schedule, map
