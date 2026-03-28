# ShelfQuest Documentation

## Directory Structure

### [api/](./api/)
- **[API.md](./api/API.md)** - REST API endpoints, authentication, request/response examples

### [architecture/](./architecture/)
- **[REPOSITORY_ARCHITECTURE.md](./architecture/REPOSITORY_ARCHITECTURE.md)** - Multi-service repo layout and deployment targets

### [deployment/](./deployment/)
- **[DEPLOYMENT.md](./deployment/DEPLOYMENT.md)** - Multi-environment deployment procedures
- **[CI-CD-SETUP.md](./deployment/CI-CD-SETUP.md)** - GitHub Actions and automated pipelines
- **[DOCKER.md](./deployment/DOCKER.md)** - Docker development and production containers
- **[ENVIRONMENT_VARIABLES.md](./deployment/ENVIRONMENT_VARIABLES.md)** - All env vars across services
- **[PWA_CONFIGURATION.md](./deployment/PWA_CONFIGURATION.md)** - Progressive Web App setup (vite-plugin-pwa)
- **[SENTRY_SETUP.md](./deployment/SENTRY_SETUP.md)** - Error tracking and performance monitoring

### [development/](./development/)
- **[DEVELOPER_ONBOARDING.md](./development/DEVELOPER_ONBOARDING.md)** - New developer setup and orientation
- **[TESTING.md](./development/TESTING.md)** - Testing infrastructure (Vitest, Jest, Playwright)
- **[TROUBLESHOOTING.md](./development/TROUBLESHOOTING.md)** - Common issues, diagnostics, and maintenance

### [design/](./design/)
- **[MD3-STYLE-GUIDE.md](./design/MD3-STYLE-GUIDE.md)** - Material Design 3 styling standards and tokens
- **[PRODUCTION_READINESS_MD3_UI.md](./design/PRODUCTION_READINESS_MD3_UI.md)** - UI polish and production readiness audit

### [features/](./features/)
- **[GAMIFICATION_INTEGRATION.md](./features/GAMIFICATION_INTEGRATION.md)** - Achievements, goals, and point tracking system
- **[feature-phase-timeline.md](./features/feature-phase-timeline.md)** - Feature rollout phases and status
- **[edge-extension-ideas.md](./features/edge-extension-ideas.md)** - Browser extension feature exploration

### [production/](./production/)
- **[PRODUCTION_READINESS_BASELINE.md](./production/PRODUCTION_READINESS_BASELINE.md)** - Security and infrastructure audit

### [feedback/](./feedback/)
- **[org.shelfquest.app_feedback.pdf](./feedback/org.shelfquest.app_feedback.pdf)** - App store feedback report

### [archived/](./archived/)
Obsolete or superseded docs kept for historical reference:
- `BookCard.md` - Raw component code (not documentation)
- `SRC_outline.md` - File tree without context
- `MD3-MIGRATION-PLAN.md` - Completed migration plan
- `TESTING_GUIDE.md` - Component-specific test steps (bottom sheet only)
- `QUICK_START_GUIDE.md` - One-time auth fix guide

## Quick Start

| Goal | Start here |
|------|-----------|
| New developer | [Developer Onboarding](./development/DEVELOPER_ONBOARDING.md) |
| API integration | [API Documentation](./api/API.md) |
| Deploying | [Deployment Guide](./deployment/DEPLOYMENT.md) |
| Env vars | [Environment Variables](./deployment/ENVIRONMENT_VARIABLES.md) |
| Debugging | [Troubleshooting](./development/TROUBLESHOOTING.md) |
| UI standards | [MD3 Style Guide](./design/MD3-STYLE-GUIDE.md) |
