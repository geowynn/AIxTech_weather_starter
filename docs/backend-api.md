# Backend API

## Endpoints

- `GET /health`
- `GET /api/locations`
- `POST /api/locations`
- `GET /api/locations/:locationId`
- `POST /api/locations/:locationId/refresh`
- `DELETE /api/locations/:locationId`

## Behavior

- New locations must stay within Singapore latitude and longitude bounds.
- Duplicate forecast areas are rejected, and the response identifies the existing location.
- Exact latitude and longitude are preserved for every saved location.
- Forecast areas are resolved on demand when an existing location does not have one cached.
- Weather refreshes are defensive: provider failures are logged and should not crash the request path.
- Frontend interaction logs are accepted at `POST /api/logs`.

## Implementation Notes

- Routes live in `backend/src/routes/locations.ts`.
- Express setup lives in `backend/src/server.ts`.
- Structured logging uses `pino` and `pino-http`.
