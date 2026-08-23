# Frontend Patterns

- The frontend uses relative `/api` requests, so it does not need separate backend host configuration.
- Client state lives in `frontend/src/state/store.tsx`.
- The sidebar controls location search, adding, and selection.
- The hero area shows the selected location, weather summary, map, and forecast panels.
- Theme selection is persisted in `localStorage`.
- Leaflet powers the map views.
- Tailwind plus custom CSS variables in `frontend/src/index.css` drive the visual themes.
