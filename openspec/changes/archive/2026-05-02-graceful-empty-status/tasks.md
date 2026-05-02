## 1. Backend

- [x] 1.1 Update `StateName`, `FanSpeedName`, `MopModeName`, and `WaterBoxName` in `roborock/commands.go` to return `""` for value `0`

## 2. Frontend

- [x] 2.1 Add an `isEmptyStatus` helper function that detects when status has no meaningful data (state is empty or all zeros)
- [x] 2.2 Update the status card in `App.tsx` to show a "Waiting for status..." placeholder when status is empty, hiding the detail grid
