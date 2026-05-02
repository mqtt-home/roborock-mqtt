## Context

The app is a React 19 SPA with Vite. Three "pages" exist as overlay components managed by boolean state. The Go backend serves static files from `./web/dist/` with a catch-all `/*` handler, but currently returns 404 for non-existent files instead of the SPA index.html.

## Goals / Non-Goals

**Goals:**
- URL-based navigation with browser back button support
- Clean route definitions for all pages
- Remove overlay hacks (fixed positioning, body scroll lock)

**Non-Goals:**
- Server-side rendering
- Route guards / authentication middleware (login is already handled by the app state)
- Lazy loading / code splitting (the app is small)

## Decisions

### 1. Route structure

```
/                                  → Main device view (redirects to first device)
/devices/:slug                     → Device main view
/devices/:slug/controls            → Controls page
/devices/:slug/schedule            → Schedule page
/devices/:slug/maintenance         → Maintenance page
```

The device slug is part of the URL, which means switching devices changes the URL too. The DeviceSwitcher navigates to `/devices/:slug`.

### 2. BrowserRouter in main.tsx

Wrap the app in `<BrowserRouter>` at the top level. Routes are defined in `App.tsx` using `<Routes>` and `<Route>`.

### 3. Shared layout for authenticated state

The header (title, home toggle, wifi, theme, logout), device switcher, and footer are shared across all device routes. Use a layout component or render them outside `<Routes>`. The status data (SSE), scenes, devices are managed in the parent and passed down or provided via context.

### 4. Page components become route components

`ControlsPage`, `SchedulePage`, `MaintenancePage` drop their `fixed inset-0` overlay wrapper and body scroll lock. They become normal page components that render in the main content area. The "back" button uses `useNavigate(-1)` or links to `/devices/:slug`.

### 5. Backend SPA fallback

The Go file server needs to serve `index.html` for any path that doesn't match a static file. This is the standard SPA pattern — check if the file exists, if not serve index.html.

### 6. Summary cards use Link instead of onClick

The controls, schedule, and maintenance summary cards on the main view use `<Link to="...">` instead of `onClick={() => setShowXxxPage(true)}`. The ScheduleSection component uses `useNavigate` instead of internal `showPage` state.
