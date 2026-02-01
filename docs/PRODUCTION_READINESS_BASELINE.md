# ShelfQuest — Production Readiness Baseline

> **Last audited:** 2026-02-01
> **Audited by:** Code audit against actual files (not self-reported)
> **Method:** Every claim verified by reading source files, configs, and CI workflows

---

## Overall Readiness: ~60%

| Category | Score | Trend |
|---|---|---|
| Security | 75% | Middleware real and mounted; gaps in persistence and 2FA |
| Testing | 40% | Infrastructure solid; actual coverage low |
| Compliance & Legal | 85% | Legal docs thorough; missing deletion endpoint |
| Production Infrastructure | 70% | Docker, CD pipelines, Sentry, monitoring configs all exist |
| UI/UX | 90% | Material Design 3, dark mode, responsive, PWA |
| Core Functionality | 80% | Auth, books, reading, gamification, AI notes all working |

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
| Account lockout (5 attempts / 15 min) | `server2/src/routes/secureAuth.js` L27-28, L183-190 | **Working** — in-memory Map, resets on server restart |
| Password strength + breach check (HIBP) | `advancedSecurity.js` | **Working** |
| Security headers (Helmet, CSP, HSTS) | `server2/src/middlewares/securityMiddleware.js` | **Working** |
| Mongo sanitization | `express-mongo-sanitize` in `server.js` | **Working** |
| Centralized security config + env validation | `server2/src/config/securityConfig.js` (347 lines) | **Working** |
| Security audit logging to DB | `server2/src/routes/secureAuth.js` L572-579 | **Working** |

### Known gaps

| Gap | Impact | Fix complexity |
|---|---|---|
| `advancedSecurity.js` adaptive rate limiting is **stubbed** (calls `next()` only, L152-163) | Medium — basic rate limiting still works via `rateLimitConfig.js` | Low — re-enable when IPv6 issue resolved |
| Account lockout uses **in-memory Map** | High — resets on deploy/restart | Medium — move to Supabase `security_audit_log` or Redis |
| Token blacklist uses **in-memory Set** | High — same restart problem | Medium — same solution |
| CSRF tokens are **deterministic** (IP + User-Agent hash) | Medium — predictable on shared networks | Low — switch to random tokens with server-side store |
| JWT tokens returned in **response body** alongside cookies | Low — backward compat, cookies are primary | Low — remove body tokens when all clients use cookies |
| **No 2FA/MFA** | Medium — not required for app stores but expected for sensitive accounts | High — needs TOTP library + UI flow |
| **No Redis** for session/rate-limit persistence | High — all stateful security is in-memory | Medium — Redis config is scaffolded in `.env.example` but not implemented |

---

## 2. Testing — 40%

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

### Actual test files: 25

| Location | Count | Files |
|---|---|---|
| Client unit tests | 6 | App, DashboardPage, LibraryPage, MD3Button, environment, simple |
| Client context tests | 2 | AuthContext (two locations) |
| Client utility tests | 1 | bookStatus |
| Client integration | 1 | reading-session |
| E2E specs (Playwright) | 5 | auth, gamification, library, reading-session, security |
| Server unit tests | 2 | secureAuth, simple |
| Server integration | 3 | auth, reading-session-backend, reading-session-verification |
| Server API tests | 5 | auth, books, gamification, reading-sessions, security |

### CI/CD Pipelines: 14 GitHub Actions workflows

| Workflow | Purpose | Status |
|---|---|---|
| `ci.yml` | Primary — client/server/AI tests, Docker build, security scan, quality gates | **Active** |
| `test.yml` | Secondary — comprehensive test + E2E + Lighthouse | **Active** |
| `cd-production.yml` | Production deploy with approval gate, Trivy, SSH, smoke tests, Artillery load test | **Configured** — triggers on `v*.*.*` tags |
| `cd-staging.yml` | Staging auto-deploy on `develop` push, Playwright, Lighthouse, Artillery | **Configured** |
| `ci-cd.yml` | Legacy pipeline | **Broken** — references `test:unit` script that doesn't exist in package.json |
| `security-scan-enhanced.yml` | Enhanced Trivy scanning | **Active** |
| `deploy-vercel.yml` | Vercel deployment | **Disabled** (marked redundant) |
| Others (7) | Docker test, Jekyll pages, dependency updates, node version check, etc. | Various |

### Known gaps

| Gap | Impact |
|---|---|
| **Coverage is low** — 25 test files across a large codebase | Many untested paths in routes, middleware, and components |
| **`ci-cd.yml` is broken** — references nonexistent `test:unit` script | Silently fails if triggered |
| **E2E tests may not pass** — configured but unverified against live services | Could block CI if enforced |
| **No load/performance test baseline** — Artillery is configured in CD but no baseline metrics recorded | Can't detect regressions |
| **`continue-on-error: true`** on test jobs in `ci.yml` and `test.yml` | Tests can fail without blocking merges |

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

| Gap | Impact | Fix complexity |
|---|---|---|
| **No Cookie Policy page** | Medium — referenced in Privacy Policy but doesn't exist | Low — single page component |
| **No account deletion endpoint** | High — Privacy Policy describes it, but no `/api/account/delete` exists | Medium — needs cascade delete across all tables |
| **No automated accessibility testing** | Medium — `eslint-plugin-jsx-a11y` provides linting but no runtime tests | Low — add `jest-axe` |
| **App store assets are guides only** | Blocking for app store submission — 4 markdown planning docs, no actual icons or screenshots | High — needs design work |

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
| CD Production | `.github/workflows/cd-production.yml` | **Configured** — manual approval, Docker push to ghcr.io, SSH deploy to 2 servers, smoke tests |
| CD Staging | `.github/workflows/cd-staging.yml` | **Configured** — auto-deploy on `develop`, Playwright + Lighthouse + Artillery |

### Monitoring & Error Tracking

| Component | Config | Status |
|---|---|---|
| Sentry (client) | `client2/src/services/sentry.jsx` | **Integrated** — `@sentry/react`, performance monitoring, session replay |
| Sentry (server) | `server2/src/config/sentry.js` | **Integrated** — `@sentry/node`, Express middleware, transaction filtering |
| Prometheus | `monitoring/prometheus.yml` + `alerts.yml` | **Configured** — not confirmed running |
| Grafana | `monitoring/grafana/` provisioning | **Configured** — datasources + dashboards |
| Loki (logs) | `monitoring/loki-config.yml` | **Configured** |
| Tempo (traces) | `monitoring/tempo.yml` | **Configured** |
| AlertManager | `monitoring/alertmanager.yml` | **Configured** — SMTP + Slack + PagerDuty in `.env.example` |

### Known gaps

| Gap | Impact |
|---|---|
| **No Redis** — `.env.example` mentions it but nothing imports or connects to Redis | In-memory security state doesn't survive restarts |
| **Monitoring stack not confirmed running** — configs exist but may never have been deployed | No proof of active monitoring |
| **CD pipelines reference infrastructure that may not exist** — SSH servers, ghcr.io, staging env | Workflows would fail on first real run |
| **No database backup/recovery strategy** — relies entirely on Supabase managed backups | No custom backup automation or tested restore process |
| **No staging environment confirmed** — `cd-staging.yml` exists but no evidence of a staging Supabase project | Changes go straight to production |

---

## 5. Architecture — 75%

### Three-tier architecture (all services exist)

| Tier | Tech | Location |
|---|---|---|
| Frontend | React 18 + Vite + Material Design 3 | `client2/` |
| Backend | Express.js (Node 20) | `server2/` |
| AI Service | FastAPI (Python 3.11) + Google Generative AI | `ai-service/` |
| Database | Supabase (PostgreSQL) | `database/consolidated/` (9 migration files) |
| Storage | Supabase Storage | File uploads via `server2/src/routes/books.js` |

### Database

- **25 tables** defined across 9 consolidated, idempotent migration files
- **Row Level Security** enabled on all tables (except `rag_chunks`)
- **10 functions**, 14 triggers, 4 views, 2 materialized views
- **pgvector** extension for AI/RAG semantic search

---

## 6. Priority Action Items

### P0 — Security (before any public release)

1. **Persist account lockout and token blacklist** — move from in-memory to Supabase or Redis
2. **Fix `advancedSecurity.js` rate limiting stubs** — re-enable adaptive rate limiting (L152-163)
3. **Remove JWT tokens from response body** — rely solely on httpOnly cookies

### P1 — Compliance (before app store submission)

4. **Build account deletion endpoint** — `/api/account/delete` with cascade delete; Privacy Policy already describes the behavior
5. **Create Cookie Policy page** — referenced in Privacy Policy but doesn't exist
6. **Add `jest-axe` accessibility tests** — `eslint-plugin-jsx-a11y` catches some issues but can't test runtime behavior

### P2 — Testing (before scaling)

7. **Remove `continue-on-error: true`** from test jobs in `ci.yml` and `test.yml` — tests should block merges
8. **Delete or fix `ci-cd.yml`** — references nonexistent `test:unit` script
9. **Run and fix all 25 existing tests** — verify they pass, then enforce in CI
10. **Increase coverage** — focus on auth routes, middleware, and book upload flow

### P3 — Infrastructure (before production traffic)

11. **Add Redis** for session store, rate limiting, and token blacklist persistence
12. **Verify monitoring stack** — run Prometheus/Grafana/Loki locally and confirm dashboards populate
13. **Test CD pipelines end-to-end** — create a staging environment and run `cd-staging.yml`
14. **Document and test database restore process** from Supabase backups

---

## Appendix: Files Referenced

| File | Lines | Purpose |
|---|---|---|
| `server2/src/middlewares/enhancedAuth.js` | 669 | JWT + refresh tokens + httpOnly cookies |
| `server2/src/middlewares/advancedSecurity.js` | 653 | Input sanitization, CSRF, file upload security |
| `server2/src/middlewares/rateLimitConfig.js` | 220 | Express rate limiting (5 tiers) |
| `server2/src/middlewares/securityMiddleware.js` | — | Helmet, security headers |
| `server2/src/config/securityConfig.js` | 347 | Centralized security configuration |
| `server2/src/routes/secureAuth.js` | 719 | Auth routes with lockout + audit logging |
| `server2/src/routes/dataExport.js` | — | GDPR data export endpoint |
| `server2/src/server.js` | 563 | Express app — all middleware mounted here |
| `server2/src/config/sentry.js` | — | Server-side error tracking |
| `client2/src/services/sentry.jsx` | — | Client-side error tracking |
| `client2/vitest.config.js` | — | Client test configuration |
| `server2/jest.config.js` | — | Server test configuration |
| `client2/playwright.config.js` | — | E2E test configuration (7 browsers) |
| `client2/.lighthouserc.json` | — | Performance budget thresholds |
| `.github/workflows/ci.yml` | — | Primary CI pipeline |
| `.github/workflows/cd-production.yml` | — | Production deployment pipeline |
| `docker-compose.yml` | — | Container orchestration |
| `render.yaml` | — | Render.com deployment config |
| `monitoring/` | — | Prometheus + Grafana + Loki + Tempo + AlertManager |
| `database/consolidated/001-009` | — | 9 idempotent SQL migration files |
