# Testing

## Current Pattern

- Backend tests live under `backend/src/**/*.test.ts`.
- The test suite uses Vitest in a Node environment.
- Tests inject a fake weather client so API behavior can be verified without network calls.

## Practical Guidance

- Add tests near the code they cover.
- Prefer request-level tests for API routes.
- Keep tests deterministic and isolated from the live Singapore weather API.
