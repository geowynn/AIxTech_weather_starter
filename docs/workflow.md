# Workflow

- Prefer small changes that keep backend, frontend, and shared types in sync.
- If you touch API behavior, update the route, the frontend API wrapper, and the store together.
- If you change schema fields, update the Drizzle schema and migrations together.
- Use `npm run build` and `npm test` before handing off substantial changes.
- Keep changes scoped to the current task unless the user asks for broader cleanup.
