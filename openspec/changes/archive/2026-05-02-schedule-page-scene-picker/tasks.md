## 1. Schedule Page Component

- [x] 1.1 Create `web/src/components/SchedulePage.tsx`: full-screen overlay (`fixed inset-0`) with back button, device name header, receives slug and scenes as props
- [x] 1.2 Move the full schedule view content (day type indicator, not-at-home toggle, time slot list, editor access) from `ScheduleSection.tsx` into `SchedulePage.tsx`
- [x] 1.3 Wire SSE schedule state updates into the overlay so it updates in real time

## 2. Compact Schedule Summary

- [x] 2.1 Refactor `ScheduleSection.tsx` into a compact summary card: show active day type badge, next action, and "View Schedule" / "Create Schedule" button
- [x] 2.2 Add `showSchedulePage` state to manage overlay open/close, pass scenes list to `SchedulePage`

## 3. Scene Picker

- [x] 3.1 Update `ScheduleEditor` (or `ScheduleDraft` until provisioning change lands): replace numeric `scene_id` input with a `<select>` dropdown populated from device scenes, add `scenes` prop
- [x] 3.2 Handle edge cases: no scenes available (disable scene action), unknown scene ID in existing schedule (show fallback option)

## 4. Scene Name Display

- [x] 4.1 Update time slot display in `SchedulePage` to resolve scene IDs to names using the scenes list, fall back to "Scene #ID" for unknown IDs
- [x] 4.2 Pass scenes list from `App.tsx` through to `ScheduleSection` and `SchedulePage`

## 5. Integration

- [x] 5.1 Update `App.tsx` to pass `scenes` prop to `ScheduleSection`, remove full schedule rendering from the inline section
- [x] 5.2 Verify TypeScript compiles and the overlay opens/closes correctly
