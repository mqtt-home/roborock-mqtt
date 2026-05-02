## 1. Setup

- [x] 1.1 Install `react-router-dom` package
- [x] 1.2 Wrap app in `BrowserRouter` in `main.tsx`
- [x] 1.3 Add SPA fallback in `web/web.go`: serve `index.html` for non-API, non-static-file paths

## 2. Route Structure

- [x] 2.1 Refactor `App.tsx`: define `<Routes>` with paths `/`, `/devices/:slug`, `/devices/:slug/controls`, `/devices/:slug/schedule`, `/devices/:slug/maintenance`
- [x] 2.2 Create a `DeviceLayout` component that renders the shared header, device switcher, and SSE-connected state, with an `<Outlet>` for child routes
- [x] 2.3 Move the device main view content (status card, programs, summary cards, map) into a `DeviceHome` component rendered at `/devices/:slug`

## 3. Convert Pages

- [x] 3.1 Update `ControlsPage.tsx`: remove `fixed inset-0`, body scroll lock, and `onClose` prop; use `useNavigate` for back button; get `slug` from `useParams`
- [x] 3.2 Update `SchedulePage.tsx`: remove overlay wrapper, body scroll lock, and `onClose` prop; use `useNavigate` for back; get `slug` from `useParams`
- [x] 3.3 Update `MaintenancePage.tsx`: remove overlay wrapper, body scroll lock, and `onClose` prop; use `useNavigate` for back; get `slug` from `useParams`

## 4. Navigation Updates

- [x] 4.1 Update summary cards in `DeviceHome` to use `<Link>` or `useNavigate` instead of `setShowXxxPage` state
- [x] 4.2 Update `ScheduleSection.tsx` to use `<Link>` to `/devices/:slug/schedule` instead of internal `showPage` state; remove `SchedulePage` import and overlay render
- [x] 4.3 Update `DeviceSwitcher` to navigate to `/devices/:slug` on device selection
- [x] 4.4 Add redirect from `/` to `/devices/:firstSlug` after devices load

## 5. Cleanup

- [x] 5.1 Remove all `showControlsPage`, `showMaintenancePage` state and overlay renders from App.tsx
- [x] 5.2 Verify TypeScript compiles and all routes work
