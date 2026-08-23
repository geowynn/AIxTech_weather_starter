# TypeScript Conventions

- Keep backend and frontend data shapes aligned when changing location or weather fields.
- Update `backend/src/schema.ts`, `backend/src/weather.ts`, and `frontend/src/types.ts` together when the snapshot model changes.
- Update `frontend/src/api.ts` whenever backend request or response shapes change.
- Prefer explicit types for shared payloads and API responses.
- Keep generated Drizzle artifacts in `backend/drizzle/` in sync with schema updates.
