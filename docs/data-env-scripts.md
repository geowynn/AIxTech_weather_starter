# Data, Env, and Scripts

## Data

- SQLite database file: `backend/weather.db`
- Drizzle migrations: `backend/drizzle/`

## Environment Variables

- `PORT`
- `DATABASE_PATH`
- `LOG_FILE_PATH`
- `LOG_LEVEL`
- `WEATHER_API_KEY`
- `PORTLESS_PORT`
- `PORTLESS_HTTPS`

## Common Commands

```bash
npm install
npm run dev
npm run build
npm run start
npm test
npm run test:watch
npm run doctor
npm run reset
npm run db:generate
npm run db:migrate
```

## Command Notes

- `npm run dev` starts the full app in development.
- `npm run build` builds the frontend and typechecks the backend.
- `npm run start` runs the compiled backend.
- `npm test` runs the backend test suite.
- `npm run doctor` checks the live app health.
- `npm run reset` removes the local database files.
- `npm run db:generate` and `npm run db:migrate` manage Drizzle migrations.
