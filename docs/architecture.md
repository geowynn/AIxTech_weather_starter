# Architecture

## System Shape

- `backend/` is the Node.js service layer.
- `frontend/` is the React/Vite client.
- SQLite stores saved locations and their latest weather snapshot.
- Drizzle defines the schema and migration files.
- Portless provides the stable local development URL.

## Runtime Flow

- `scripts/dev.mjs` starts the backend with Portless in front of it.
- `backend/src/server.ts` creates the Express app, mounts `/api`, serves `/health`, and attaches Vite middleware in development.
- `backend/src/routes/locations.ts` exposes the location CRUD API.
- `backend/src/weather.ts` talks to the Singapore weather APIs and normalizes responses into `WeatherSnapshot`.
- `backend/src/db.ts` owns the SQLite connection, migration bootstrap, and CRUD helpers.
- `frontend/src/state/store.tsx` loads and mutates app state.
- `frontend/src/components/` contains the UI, including the sidebar, hero panel, map, and weather cards.

## Source Map

- `backend/src/schema.ts`: SQLite schema and JSON columns.
- `backend/src/logger.ts`: structured logging.
- `backend/src/weather.ts`: external API client and snapshot shaping.
- `frontend/src/api.ts`: frontend request helpers.
- `frontend/src/types.ts`: shared frontend data types.
- `frontend/src/index.css`: theming and global styling.
