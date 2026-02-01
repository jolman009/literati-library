# ShelfQuest v1.0.9 Release Notes

## Google Play "What's New" (paste into Play Console)

### en-US (500 char limit)

```
What's new in v1.0.9:

- Redesigned login and sign-up pages with cleaner layout and visible password requirements
- Updated ShelfQuest logo
- Improved reading session tracking and gamification stats
- Better dark/light mode support across all pages
- Database reliability improvements for faster, more consistent performance
- Enhanced security for authentication and session management
- Bug fixes and stability improvements
```

---

## Detailed Release Notes (internal reference)

### UI/UX Improvements
- Redesigned Login and Sign-Up pages (LoginV2/SignUpV2) with unified styling, visible borders, and consistent card dimensions
- Real-time password requirements display during sign-up
- Updated ShelfQuest logo (v7)
- Improved dark/light mode contrast across Dashboard, Library, and Notes pages
- Mobile responsive fixes for auth cards and layout

### Backend & Infrastructure
- Consolidated 10 scattered database migrations into 9 ordered, idempotent files
- Fixed all server test suites: 230 tests passing, 0 failures (was 95 failing)
- Production readiness audit and baseline documentation
- Improved authentication security: token refresh, breach detection, session management
- Server middleware consolidation and logging improvements

### Reading & Gamification
- Reading session backend storage with multi-device sync support
- Gamification stats now pull from reading_sessions table for accurate tracking
- Reading streak calculation from session dates
- Session completion flow with duration tracking

### Security
- Moved signing credentials out of version control
- Enhanced input sanitization (XSS, SQL injection prevention)
- Account lockout after failed login attempts
- Secure cookie configuration for cross-origin auth
