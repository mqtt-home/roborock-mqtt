## 1. Implementation

- [x] 1.1 Add `pendingScene` state (`SceneInfo | null`) to `App.tsx`, change program button click to set `pendingScene` instead of executing
- [x] 1.2 Render `ConfirmModal` driven by `pendingScene`: show "Start {name}?", confirm executes the scene, cancel clears state
