## 1. Schedule Page Update

- [x] 1.1 Replace the single "Today" time slot section in `SchedulePage.tsx` with a loop over all four day types (`normal`, `weekend`, `free`, `notAtHome`), each rendered as a labeled section with its time slots
- [x] 1.2 Add active day type highlighting: accent border and "Active" badge on the section matching the active day type, muted style on others
- [x] 1.3 Apply past/next time slot highlighting only within the active day type section; render non-active sections' slots with neutral styling
- [x] 1.4 Show "No slots configured" placeholder for day types with empty slot arrays
