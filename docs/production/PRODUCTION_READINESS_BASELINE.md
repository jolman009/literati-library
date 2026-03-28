# ShelfQuest — Production Readiness Baseline

> **Last audited:** 2026-02-01 (evening update)
> **Audited by:** Code audit against actual files (not self-reported)
> **Method:** Every claim verified by reading source files, configs, and CI workflows

---

## Overall Readiness: ~65%

| Category | Score | Prev | Change | Notes |
|---|---|---|---|---|
| Security | 75% | 75% | — | P0 gaps unchanged; keystore credentials secured |
| Testing | 60% | 40% | ▲ +20% | All 230 server tests passing; 0 failures |
| Compliance & Legal | 85% | 85% | — | Cookie Policy + account deletion still missing |
| Production Infrastructure | 70% | 70% | — | No Redis; monitoring unverified |
| UI/UX | 90% | 90% | — | Material Design 3, dark mode, responsive, PWA |
| Core Functionality | 80% | 80% | — | Auth, books, reading, gamification, AI notes all working |

### Changes since initial audit (same day)

| Item | Status | Impact |
|---|---|---|
| ✅ Fixed all 38 failing server tests (4 suites) | 230 pass / 0 fail | Testing 40% → 60% |
| ✅ Secured Android keystore credentials | Moved to gitignored `keystore.properties` | Security hygiene |
| ✅ Built ShelfQuest v1.0.9 AAB | Ready for Google Play upload | Release pipeline |
| ✅ Converted auth.integration.test.js from Vitest to Jest | 14 new passing tests | Testing coverage |

---

## 1. Security — 75%

### What's implemented and mounted in `server.js`

| Feature | File | Status |
|---|---|---|
| JWT access + refresh tokens (httpOnly cookies) | `server2/src/middlewares/enhancedAuth.js` (669 lines) | **Working** |
| Deep input sanitization (XSS, SQL injection, NoSQL injection) | `server2/src/middlewares/advancedSecurity.js` (653 lines) | **Working** — mounted at app level |
| Rate limiting (express-rate-limit) | `server2/src/middlewares/rateLimitConfig.js` (220 lines) | **Working** — general, auth, upload, API, gamification |
| Slow-down middleware (progressive delays) | `rateLimitConfig.js` | **Working** |
| CSRF protection (token-based) | `advancedSecurity.js` L247-298 | **Working** — but tokens are deterministic (IP+UA hash) |
| Account lockout (5 attempts / 15 min) | `server2/src/routes/secureAuth.js` L25-64 | **Working** — in-memory Map, resets on server restart |
| Password strength + breach check (HIBP) | `advancedSecurity.js` | **Working** |
| Security headers (Helmet, CSP, HSTS) | `server2/src/middlewares/securityMiddleware.js` | **Working** |
| Mongo sanitization | `express-mongo-sanitize` in `server.js` | **Working** |
| Centralized security config + env validation | `server2/src/config/securityConfig.js` (347 lines) | **Working** |
| Security audit logging to DB | `server2/src/routes/secureAuth.js` L572-579 | **Working** |
| Android keystore credentials | `android/keystore.properties` (gitignored) | **Secured** |

### Known gaps (P0)

| # | Gap | Location | Impact | Fix complexity |
|---|---|---|---|---|
| P0-1a | Account lockout uses **in-memory Map** | `secureAuth.js` L26 | HIGH — resets on deploy/restart | Medium — move to Supabase `security_audit_log` or Redis |
| P0-1b | Token blacklist uses **in-memory Set** | `enhancedAuth.js` L6 | CRITICAL — blacklist lost on restart; no distributed support | Medium — same solution |
| P0-2a | `adaptiveRateLimit` is **stubbed** — just calls `next()` | `advancedSecurity.js` L152-155 | CRITICAL — no adaptive protection on `/login` | Low — re-enable when IPv6 issue resolved |
| P0-2b | `sensitiveOperationRateLimit` is **stubbed** — just calls `next()` | `advancedSecurity.js` L160-163 | CRITICAL — no rate limiting on register, password change/reset | Low — same fix |
| P0-2c | `express-rate-limit` import is **commented out** | `advancedSecurity.js` L2 | HIGH — disabled due to IPv6 issue | Low — import from rateLimitConfig instead |
| P0-3a | `accessToken` returned in register response body | `secureAuth.js` L157 | HIGH — token in logs/cache | Trivial — remove field |
| P0-3b | `accessToken` returned in login response body | `secureAuth.js` L255 | HIGH — same | Trivial — remove field |
| P0-3c | `accessToken` returned in refresh response body | `enhancedAuth.js` L462 | HIGH — same | Trivial — remove field |
| — | CSRF tokens are **deterministic** (IP + User-Agent hash) | `advancedSecurity.js` | Medium — predictable on shared networks | Low — switch to random tokens |
| — | **No 2FA/MFA** | — | Medium — not required for app stores | High — needs TOTP library + UI flow |
| — | **No Redis** for session/rate-limit persistence | `.env.example` references it but nothing connects | HIGH — all stateful security is in-memory | Medium — Redis config is scaffolded |

---

## 2. Testing — 60%

### Infrastructure (exists and is configured)

| Component | File | Details |
|---|---|---|
| Vitest (client) | `client2/vitest.config.js` | jsdom env, v8 coverage, 30% thresholds, unit + integration projects |
| Jest (server) | `server2/jest.config.js` | Node env, coverage reporters, setup file |
| Playwright (E2E) | `client2/playwright.config.js` | 7 browsers (Chromium, Firefox, WebKit, mobile, Edge, Chrome) |
| Test utilities | `client2/src/test-utils.jsx` | Custom render, mock data factories, provider wrappers |
| Setup file | `client2/src/setupTests.js` | Mocks for epubjs, contexts, router, localStorage, fetch, etc. |
| Codecov | `.github/workflows/ci.yml` | Integrated for client, server, and AI service with flags |
| Lighthouse CI | `client2/.lighthouserc.json` | Performance 0.6, a11y 0.7, best-practices 0.7, SEO 0.7 |

### Test suites: 25 files

| Location | Count | Files | Status |
|---|---|---|---|
| Server API tests | 5 | auth, books, gamification, reading-sessions, security | ✅ All passing |
| Server unit tests | 2 | secureAuth (29 tests), simple | ✅ All passing |
| Server integration | 3 | auth (14), reading-session-backend (15), reading-session-verification (14) | ✅ All passing |
| **Server total** | **10 suites** | **230 tests passing, 15 skipped, 0 failures** | ✅ |
| Client unit tests | 6 | App, DashboardPage, LibraryPage, MD3Button, environment, simple | ⚠️ Unverified this session |
| Client context tests | 2 | AuthContext (two locations) | ⚠️ Unverified |
| Client utility tests | 1 | bookStatus | ⚠️ Unverified |
| Client integration | 1 | reading-session | ⚠️ Unverified |
| E2E specs (Playwright) | 5 | auth, gamification, library, reading-session, security | ⚠️ Unverified against live services |

### CI/CD Pipelines: 14 GitHub Actions workflows

| Workflow | Purpose | Status |
|---|---|---|
| `ci.yml` | Primary — client/server/AI tests, Docker build, security scan | **Active** — but `continue-on-error: true` on 5 steps |
| `test.yml` | Secondary — comprehensive test + E2E + Lighthouse | **Active** — but `continue-on-error: true` on 5 jobs |
| `cd-production.yml` | Production deploy with approval gate, Trivy, SSH, smoke tests | **Configured** — triggers on `v*.*.*` tags |
| `cd-staging.yml` | Staging auto-deploy on `develop` push | **Configured** |
| `ci-cd.yml` | Legacy pipeline | **Broken** — references `test:unit` script that doesn't exist |
| Others (9) | Security scan, Docker, Jekyll, dependency updates, etc. | Various |

### Known gaps

| # | Gap | Impact |
|---|---|---|
| P2-7 | **`continue-on-error: true`** on 10 steps/jobs across `ci.yml` and `test.yml` | Tests can fail without blocking merges |
| P2-8 | **`ci-cd.yml` is broken** — calls `pnpm run test:unit` which doesn't exist | Silent failure; tests never run in this workflow |
| ~~P2-9~~ | ~~Run and fix all server tests~~ | ✅ **DONE** — 230 passing, 0 failures |
| P2-10 | **Coverage is still limited** — 25 test files across a large codebase | Many untested paths in middleware and components |
| — | **E2E tests unverified** — Playwright configured but never run against live services | Could block CI if enforced |
| — | **No load/performance baseline** — Artillery configured in CD but no baseline recorded | Can't detect performance regressions |

---

## 3. Compliance & Legal — 85%

### What exists

| Component | File | Status |
|---|---|---|
| Privacy Policy | `client2/src/pages/legal/PrivacyPolicyPage.jsx` | **Complete** — 9 sections, GDPR-specific, data retention timeline |
| Terms of Service | `client2/src/pages/legal/TermsOfServicePage.jsx` | **Complete** — 13 sections, Texas jurisdiction, DMCA, age 13+ |
| Cookie Consent banner | `client2/src/components/legal/CookieConsent.jsx` | **Complete** — granular preferences, child mode, localStorage persistence |
| Data Export (GDPR Art. 20) | `server2/src/routes/dataExport.js` | **Complete** — `/api/data-export/user-data` exports full user data as JSON |
| SECURITY.md | `server2/SECURITY.md` | **Complete** — 350+ lines covering all security features |
| .env.example files | Root, client2, server2, ai-service, monitoring | **Complete** |

### Known gaps

| # | Gap | Impact | Fix complexity |
|---|---|---|---|
| P1-4 | **No account deletion endpoint** — Privacy Policy describes it, no `/api/account/delete` exists | HIGH — GDPR Article 17 right to erasure | Medium — needs cascade delete across all tables |
| P1-5 | **No Cookie Policy page** — referenced in Privacy Policy but doesn't exist; only banner exists | Medium — regulatory expectation | Low — single page component |
| P1-6 | **No automated accessibility testing** — `eslint-plugin-jsx-a11y` provides static linting only | Medium — no runtime a11y tests | Low — add `jest-axe` |
| — | **App store assets are guides only** — 4 markdown planning docs, no actual icons/screenshots | Blocking for new store submissions | High — needs design work |

---

## 4. Production Infrastructure — 70%

### Containerization

| Component | File | Details |
|---|---|---|
| Client Docker | `client2/Dockerfile` | Multi-stage build → Nginx |
| Server Docker | `server2/Dockerfile` | Node.js 20 |
| AI Service Docker | `ai-service/Dockerfile` | Python 3.11 FastAPI |
| Compose | `docker-compose.yml` | Orchestrates all services with health checks, bridge network |

### Deployment

| Platform | Config | Status |
|---|---|---|
| Render | `render.yaml` (root + server2) | **Configured** — server + AI service, auto-deploy from main, health checks |
| Vercel | `client2/vercel.json` | **Configured** — SPA routing, headers, cache control |
| Google Play | `android/` | **v1.0.9 built** — AAB signed and ready for upload |
| CD Production | `.github/workflows/cd-production.yml` | **Configured** — manual approval, Docker push to ghcr.io |
| CD Staging | `.github/workflows/cd-staging.yml` | **Configured** — auto-deploy on `develop` |

### Monitoring & Error Tracking

| Component | Config | Status |
|---|---|---|
| Sentry (client) | `client2/src/services/sentry.jsx` | **Integrated** — `@sentry/react`, performance, session replay |
| Sentry (server) | `server2/src/config/sentry.js` | **Integrated** — `@sentry/node`, Express middleware |
| Prometheus | `monitoring/prometheus.yml` + `alerts.yml` | **Configured** — not confirmed running |
| Grafana | `monitoring/grafana/` provisioning | **Configured** — datasources + dashboards |
| Loki (logs) | `monitoring/loki-config.yml` | **Configured** |
| Tempo (traces) | `monitoring/tempo.yml` | **Configured** |
| AlertManager | `monitoring/alertmanager.yml` | **Configured** — SMTP + Slack + PagerDuty in `.env.example` |

### Known gaps

| Gap | Impact |
|---|---|
| **No Redis** — `.env.example` mentions it but nothing connects | In-memory security state doesn't survive restarts |
| **Monitoring stack not confirmed running** — configs exist but may never have been deployed | No proof of active monitoring |
| **CD pipelines reference infrastructure that may not exist** — SSH servers, ghcr.io, staging env | Workflows would fail on first real run |
| **No database backup/recovery strategy** — relies entirely on Supabase managed backups | No custom backup automation or tested restore |
| **No staging environment confirmed** — `cd-staging.yml` exists but no evidence of staging Supabase project | Changes go straight to production |

---

## 5. Architecture — 75%

### Three-tier architecture (all services exist)

| Tier | Tech | Location |
|---|---|---|
| Frontend | React 19 + Vite + Material Design 3 | `client2/` |
| Backend | Express.js (Node 20) | `server2/` |
| AI Service | FastAPI (Python 3.11) + Google Generative AI | `ai-service/` |
| Database | Supabase (PostgreSQL) | `database/consolidated/` (9 migration files) |
| Storage | Supabase Storage | File uploads via `server2/src/routes/books.js` |
| Mobile | Capacitor 8 + TWA wrapper | `android/` (v1.0.9) |

### Database

- **25 tables** defined across 9 consolidated, idempotent migration files
- **Row Level Security** enabled on all tables (except `rag_chunks`)
- **10 functions**, 14 triggers, 4 views, 2 materialized views
- **pgvector** extension for AI/RAG semantic search

---

## 6. Priority Action Items

### P0 — Security (before any public release)

1. ~~**Persist account lockout and token blacklist**~~ → Still in-memory (`secureAuth.js` L26, `enhancedAuth.js` L6)
2. **Fix rate limiting stubs** — `adaptiveRateLimit` (L152-155) and `sensitiveOperationRateLimit` (L160-163) both just call `next()`. The `express-rate-limit` import is commented out (L2). Wire up actual limiters from `rateLimitConfig.js`.
3. **Remove JWT tokens from response body** — `accessToken` is in register (L157), login (L255), and refresh (L462) JSON responses. Remove these fields; clients should use httpOnly cookies.

### P1 — Compliance (before app store submission)

4. **Build account deletion endpoint** — `/api/account/delete` with cascade delete; Privacy Policy already describes the behavior
5. **Create Cookie Policy page** — referenced in Privacy Policy but doesn't exist; use `LegalPageLayout.jsx` pattern
6. **Add `jest-axe` accessibility tests** — only static `jsx-a11y` linting currently

### P2 — Testing & CI (before scaling)

7. **Remove `continue-on-error: true`** from 10 locations across `ci.yml` (5) and `test.yml` (5) — tests should block merges
8. **Delete or fix `ci-cd.yml`** — references nonexistent `test:unit` script; silent failure
9. ~~**Run and fix all server tests**~~ ✅ **DONE** — 230 passing, 0 failures
10. **Increase coverage** — focus on auth routes, middleware, and book upload flow
11. **Verify client tests pass** — 10 Vitest test files not verified this session

### P3 — Infrastructure (before production traffic)

12. **Add Redis** for session store, rate limiting, and token blacklist persistence
13. **Verify monitoring stack** — run Prometheus/Grafana/Loki locally and confirm dashboards populate
14. **Test CD pipelines end-to-end** — create a staging environment and run `cd-staging.yml`
15. **Document and test database restore process** from Supabase backups

---

## Appendix: Files Referenced

| File | Lines | Purpose |
|---|---|---|
| `server2/src/middlewares/enhancedAuth.js` | 669 | JWT + refresh tokens + httpOnly cookies |
| `server2/src/middlewares/advancedSecurity.js` | 653 | Input sanitization, CSRF, rate limiting stubs |
| `server2/src/middlewares/rateLimitConfig.js` | 220 | Express rate limiting (5 tiers) |
| `server2/src/middlewares/securityMiddleware.js` | — | Helmet, security headers |
| `server2/src/config/securityConfig.js` | 347 | Centralized security configuration |
| `server2/src/routes/secureAuth.js` | 719 | Auth routes with lockout + audit logging |
| `server2/src/routes/dataExport.js` | — | GDPR data export endpoint |
| `server2/src/server.js` | 563 | Express app — all middleware mounted here |
| `android/app/build.gradle` | 267 | Android build config — v1.0.9, keystore.properties |
| `android/keystore.properties` | — | Signing credentials (gitignored) |
| `client2/vitest.config.js` | — | Client test configuration |
| `server2/jest.config.js` | — | Server test configuration |
| `client2/playwright.config.js` | — | E2E test configuration (7 browsers) |
| `.github/workflows/ci.yml` | — | Primary CI pipeline (5x continue-on-error) |
| `.github/workflows/test.yml` | — | Secondary test pipeline (5x continue-on-error) |
| `.github/workflows/ci-cd.yml` | — | Legacy pipeline (broken — nonexistent test:unit) |
| `.github/workflows/cd-production.yml` | — | Production deployment pipeline |
| `docker-compose.yml` | — | Container orchestration |
| `render.yaml` | — | Render.com deployment config |
| `monitoring/` | — | Prometheus + Grafana + Loki + Tempo + AlertManager |
| `database/consolidated/001-009` | — | 9 idempotent SQL migration files |
