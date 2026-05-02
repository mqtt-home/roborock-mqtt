## Why

The app currently uses state-driven full-screen overlays (`fixed inset-0` with body scroll lock) for the Controls, Schedule, and Maintenance pages. This works but has drawbacks:
- No URL-based navigation — browser back button doesn't work, can't deep-link to a page
- Each overlay manually manages body scroll lock and z-index
- Page state (which overlay is open) is scattered across `showControlsPage`, `showMaintenancePage`, `showSchedulePage` booleans

Using React Router gives proper URL-based navigation, browser back button support, and cleaner code.

## What Changes

- Add `react-router-dom` dependency
- Replace overlay-based pages with route-based pages
- Routes: `/` (main view), `/devices/:slug/controls`, `/devices/:slug/schedule`, `/devices/:slug/maintenance`
- Remove `fixed inset-0`, body scroll lock hacks, and `showXxxPage` state booleans
- Navigation via `useNavigate()` / `<Link>` instead of state toggles
- Backend: add catch-all route to serve `index.html` for client-side routing (SPA fallback)

## Capabilities

### New Capabilities
- `client-side-routing`: React Router integration with URL-based page navigation

### Modified Capabilities

_(none)_

## Impact

- **Frontend**: `main.tsx` wraps app in `BrowserRouter`, `App.tsx` defines routes, page components become route components, navigation changes from state to `useNavigate`
- **Backend**: `web.go` needs SPA fallback — serve `index.html` for unknown paths instead of 404
- **Dependencies**: New `react-router-dom` package
