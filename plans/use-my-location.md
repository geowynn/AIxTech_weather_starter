# Plan: Use My Location

> Source PRD: Use My Location geolocation and Singapore forecast-area auto-detection

## Architectural decisions

Durable decisions that apply across all phases:

- **Route boundary**: Reuse `POST /api/locations` for auto-detected locations and manual coordinate creation.
- **Persisted data**: Save the user's exact latitude and longitude; do not replace them with forecast-area coordinates.
- **Forecast-area identity**: Resolve the nearest known Singapore forecast area on the server and use that derived identity for duplicate detection.
- **Existing locations**: Resolve forecast areas on demand when an existing location does not already have one available in its weather snapshot.
- **Client state**: Use the existing location store as the source of truth for creation, loading, errors, and selecting the active dashboard location.
- **Error presentation**: Use one reusable in-app modal with message variants for outside-Singapore, permission, unavailable, timeout, provider, and unexpected errors.
- **Geolocation**: Use browser defaults with an explicit 15-second timeout; do not require HTTPS for localhost.
- **Manual flow**: Preserve the existing manual latitude/longitude form and its behavior.

---

## Phase 1: Auto-detect and save exact coordinates

**User stories**: 1, 2, 3, 11

### What to build

Deliver the successful path from the new “Use my location” action beside the manual form through browser coordinate acquisition, Singapore validation, server-side nearest forecast-area resolution, exact-coordinate persistence, weather refresh, and selection of the newly created dashboard location. Add the corresponding frontend, backend, and browser integration coverage.

### Acceptance criteria

- [ ] The auto-detect action is visible alongside the existing manual coordinate form.
- [ ] A successful browser position request sends the exact latitude and longitude to the existing location-creation boundary.
- [ ] The browser request uses a 15-second timeout and otherwise browser-default options.
- [ ] Valid Singapore coordinates create one saved location and trigger the existing weather refresh behavior.
- [ ] The saved location retains the exact coordinates returned by the browser.
- [ ] The newly created location becomes the selected dashboard location.
- [ ] Frontend, backend, and browser integration tests cover the complete successful flow.

---

## Phase 2: Location failure handling

**User stories**: 4, 8, 9, 10, 11

### What to build

Add the reusable in-app error modal and connect all geolocation and validation failures to it. The flow must leave persistence unchanged whenever the location cannot be accepted, while giving users a clear retry-oriented message.

### Acceptance criteria

- [ ] Coordinates outside the Singapore bounds show the specific outside-Singapore message and create nothing.
- [ ] Permission denial shows the permission-specific message.
- [ ] Position unavailable and timeout errors show the generic retry-later message.
- [ ] Unexpected geolocation, provider, or request failures show the generic retry-later message and create nothing.
- [ ] The modal can be reused for future location-related errors without duplicating modal implementations.
- [ ] The auto-detect action exposes an appropriate loading/disabled state while the request is active.
- [ ] The modal can be dismissed and the user can retry without reloading the page.
- [ ] Frontend and browser integration tests cover every error category and verify no new location is persisted.

---

## Phase 3: Forecast-area duplicate resolution

**User stories**: 5, 6, 7, 11

### What to build

Make forecast area the duplicate identity while preserving exact coordinates for new locations. Before insertion, the backend resolves the nearest known area for the requested coordinates and resolves existing locations on demand when necessary. When the area is already saved, the client shows the duplicate message, closes the add flow, and selects the existing dashboard location instead of creating another record.

### Acceptance criteria

- [ ] A valid Singapore coordinate outside known forecast-area metadata falls back to the nearest known forecast area.
- [ ] Existing locations without a stored area identity are resolved on demand before duplicate comparison.
- [ ] A request for an already-saved forecast area creates no additional location.
- [ ] Duplicate detection retains the existing location's exact saved coordinates.
- [ ] The duplicate response communicates that the forecast area is already saved.
- [ ] The frontend selects the existing matching location in the current dashboard and closes the add flow.
- [ ] Forecast-area resolution or provider failure prevents insertion and shows the generic retry modal.
- [ ] Backend tests cover area resolution, on-demand existing-location resolution, duplicate prevention, and fallback behavior.
- [ ] Browser integration tests verify duplicate messaging and selection of the existing location.

