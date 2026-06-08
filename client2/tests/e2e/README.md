# End-to-End Tests (Playwright)

These tests drive the real client + server through a browser. They are split into
two classes, and that distinction matters for CI.

## Running locally

```bash
# from client2/
pnpm exec playwright install   # first time only
pnpm run test:e2e
```

`playwright.config.js` boots both the Vite client (`:5173`) and the Express
server (`:5000`) automatically via its `webServer` block.

## Two classes of test

### 1. Pure-frontend tests (no database)

These exercise routing, form validation, error messaging, rate-limit surfacing,
and accessibility. They pass with just the client + server processes running and
do **not** require a working database. Examples: landing/login/register
navigation, empty-form validation errors, invalid-credential error text, the
`/forgot-password` flow, login rate-limiting, ARIA labels.

The contract these rely on (the `data-testid` hooks + auth routes) is pinned by a
**blocking** unit test: [`src/__tests__/auth-testid-contract.test.js`](../../src/__tests__/auth-testid-contract.test.js).
If a component rewrite drops one of those hooks, that test fails on the PR — the
breakage can no longer hide in the non-blocking E2E job.

### 2. Database-dependent tests

These need a live backend **with a writable database and a seeded test user**
(`e2e.test@example.com`). They are marked with a `DB-dependent:` comment in
`auth.spec.js`:

- `should register new user successfully`
- `should login with valid credentials`
- `should logout successfully`
- `should persist authentication across browser refresh`
- `should handle session expiration gracefully`

`global-setup.js` tries to create the seeded user via
`POST /auth/secure/register` before the run.

## Why the CI E2E job is non-blocking

In CI, `server2/.env.test` points at the real Supabase URL but with a **placeholder
service key** (`SUPABASE_SERVICE_ROLE_KEY=test_service_role_key`). Every Supabase
query therefore fails auth, so the seeded user can't be created and the
`authenticatedPage` fixture can't log in. That is why the `e2e-tests` job in
`.github/workflows/test.yml` is `continue-on-error: true` ("non-blocking until
staging env exists").

To make the database-dependent tests pass in CI, provide a real test database:

1. A dedicated Supabase **test project** (or a local Postgres + the SQL migrations
   under `database/`), and
2. A valid `SUPABASE_SERVICE_ROLE_KEY` (and anon key) wired into the workflow as
   GitHub secrets, replacing the placeholders in `server2/.env.test`.

Once a real test DB is in place, the `continue-on-error: true` flag on the
`e2e-tests` job can be removed to make the full suite blocking.
