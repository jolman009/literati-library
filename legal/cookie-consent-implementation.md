# Cookie Consent Mechanism Implementation Guide
## For Literati Digital Library Application

**Document Date**: October 3, 2025
**Last Updated**: October 3, 2025
**Compliance**: GDPR (ePrivacy Directive), CCPA, LGPD

---

## Executive Summary

This document outlines the cookie consent implementation strategy for Literati, ensuring compliance with European GDPR/ePrivacy Directive, California CCPA, and other privacy regulations.

**Key Requirements**:
- ✅ Inform users about cookie usage before placing non-essential cookies
- ✅ Obtain explicit consent for non-essential cookies
- ✅ Provide granular control over cookie categories
- ✅ Allow users to withdraw consent easily
- ✅ Document consent for compliance purposes

---

## 1. Cookie Inventory

### 1.1 Cookies Used by Literati

| Cookie Name | Type | Purpose | Duration | Category | Consent Required? |
|-------------|------|---------|----------|----------|-------------------|
| `auth_token` | First-party | User authentication (JWT) | Session/7 days | Strictly Necessary | ❌ No |
| `refresh_token` | First-party | Authentication refresh | 30 days | Strictly Necessary | ❌ No |
| `theme_preference` | First-party | Remember dark/light mode | 1 year | Functional | ✅ Yes (opt-in) |
| `reading_position` | First-party | Save reading progress | 1 year | Functional | ✅ Yes (opt-in) |
| `cookie_consent` | First-party | Store consent preferences | 1 year | Strictly Necessary | ❌ No |
| `session_id` | First-party | Session management | Session | Strictly Necessary | ❌ No |

**Note**: Literati currently does not use:
- ❌ Analytics cookies (Google Analytics, etc.)
- ❌ Advertising cookies
- ❌ Third-party tracking cookies
- ❌ Social media cookies

**If these are added in the future, this document must be updated.**

### 1.2 Local Storage and IndexedDB

In addition to cookies, Literati uses browser storage APIs:

| Storage Type | Purpose | Category | Consent Required? |
|--------------|---------|----------|-------------------|
| `localStorage` | Cache theme, settings, reading data | Functional | ✅ Yes (implied by service use) |
| `IndexedDB` | Store book files locally (PWA offline mode) | Strictly Necessary | ❌ No (core functionality) |
| `sessionStorage` | Temporary session data | Strictly Necessary | ❌ No |

---

## 2. Cookie Categories

### 2.1 Strictly Necessary Cookies

**Definition**: Essential for the website to function. Cannot be disabled.

**Literati Examples**:
- `auth_token` - Required for user login and authentication
- `session_id` - Required for maintaining user session
- `cookie_consent` - Stores the user's cookie preferences

**Legal Basis**: These cookies are exempt from consent requirements under GDPR/ePrivacy Directive as they are strictly necessary for service provision.

**User Control**: Users cannot opt out (but should be informed).

### 2.2 Functional Cookies

**Definition**: Enable enhanced functionality and personalization.

**Literati Examples**:
- `theme_preference` - Remembers dark/light mode choice
- `reading_position` - Saves reading progress across sessions

**Legal Basis**: Require explicit consent under GDPR.

**User Control**: Users can opt in/out. Service works without these (with reduced functionality).

### 2.3 Analytics Cookies (Not Currently Used)

**Definition**: Track usage and performance.

**If Implemented**: Require explicit consent.

**Recommendation**: Use privacy-friendly analytics (e.g., Plausible, Fathom) that don't require consent, or implement with consent.

### 2.4 Advertising Cookies (Not Currently Used)

**Definition**: Track users for advertising purposes.

**If Implemented**: Require explicit consent and provide clear disclosures.

**Current Status**: Not used by Literati.

---

## 3. Consent Implementation Requirements

### 3.1 GDPR/ePrivacy Directive Requirements

**Must Have**:
- ✅ Clear information about what cookies are used and why
- ✅ Explicit consent before placing non-essential cookies
- ✅ Granular controls (category-level at minimum)
- ✅ Easy way to withdraw consent
- ✅ "Reject All" option as prominent as "Accept All"
- ✅ No pre-ticked boxes
- ✅ Access to service not conditional on consent (for non-essential cookies)

**Must NOT**:
- ❌ Cookie walls (blocking access unless user accepts all cookies)
- ❌ Pre-ticked consent boxes
- ❌ Ambiguous language
- ❌ Hiding the "Reject" button

### 3.2 CCPA Requirements

**Must Have**:
- ✅ "Do Not Sell My Personal Information" link (if selling data - Literati doesn't)
- ✅ Clear disclosure of data collection in Privacy Policy
- ✅ Opt-out mechanism for data sales (N/A for Literati)

**Literati Status**: ✅ Compliant (no data selling, clear Privacy Policy)

### 3.3 LGPD (Brazil) Requirements

**Must Have**:
- ✅ Transparent information about data processing
- ✅ Consent for non-essential processing
- ✅ Easy withdrawal of consent

**Literati Status**: ✅ Compliant (same implementation as GDPR)

---

## 4. Recommended Cookie Consent Solution

### 4.1 Recommended Libraries

**Option 1: CookieYes / Cookiebot (Third-Party SaaS)**
- ✅ Fully compliant with GDPR, CCPA
- ✅ Auto-detects cookies
- ✅ Multi-language support
- ✅ Hosted solution (easy integration)
- ❌ Paid service
- ❌ Adds third-party dependency

**Option 2: Cookie Consent by Osano (Open Source)**
- ✅ Free and open source
- ✅ Lightweight and customizable
- ✅ GDPR compliant
- ❌ Manual cookie configuration required
- ❌ Less feature-rich than paid solutions

**Option 3: Custom Implementation (Recommended for Literati)**
- ✅ Full control over UI/UX
- ✅ No third-party dependencies
- ✅ Lightweight (minimal cookies to manage)
- ✅ Privacy-friendly (no external tracking)
- ❌ More development effort

**Recommendation**: Given Literati's minimal cookie usage, a **custom implementation** is recommended for maximum control and privacy.

---

## 5. Custom Cookie Consent Implementation

### 5.1 User Interface Design

**Cookie Consent Banner (First Visit)**:

```
┌──────────────────────────────────────────────────────────────┐
│  🍪 We use cookies                                          │
│                                                              │
│  We use cookies to keep you logged in and remember your     │
│  preferences. You can choose which cookies to accept.       │
│                                                              │
│  [Customize]  [Reject All]  [Accept All]                   │
│                                                              │
│  📄 See our Privacy Policy | 🍪 Cookie Policy              │
└──────────────────────────────────────────────────────────────┘
```

**Cookie Preferences Modal (When "Customize" is clicked)**:

```
┌──────────────────────────────────────────────────────────────┐
│  Cookie Preferences                                       [X] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ✓ Strictly Necessary Cookies (Always Active)               │
│     Required for login, security, and basic functionality.  │
│                                                              │
│  [ ] Functional Cookies                                     │
│     Remember your theme and reading preferences.            │
│                                                              │
│  [ ] Analytics Cookies (Not Currently Used)                 │
│     Help us improve the app (future feature).               │
│                                                              │
│  [Save Preferences]  [Reject All]  [Accept All]            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Implementation Code Structure

**File Structure**:
```
client2/src/
  components/
    CookieConsent/
      CookieBanner.jsx          # Main consent banner
      CookiePreferences.jsx     # Preferences modal
      useCookieConsent.js       # React hook for consent state
  utils/
    cookieManager.js            # Cookie utility functions
  constants/
    cookieConfig.js             # Cookie definitions
```

### 5.3 Cookie Manager Utility (cookieManager.js)

**Key Functions Needed**:

```javascript
// Get consent status
export function getCookieConsent() {
  // Returns: { necessary: true, functional: false, analytics: false }
}

// Save consent preferences
export function saveCookieConsent(preferences) {
  // Stores preferences in localStorage and cookie
}

// Check if specific cookie category is allowed
export function isCookieAllowed(category) {
  // Returns: boolean
}

// Set cookie only if consent given
export function setConsentCookie(name, value, category) {
  // Sets cookie only if user has consented to that category
}

// Clear cookies when consent withdrawn
export function clearCookiesByCategory(category) {
  // Removes all cookies in a category when consent is withdrawn
}
```

### 5.4 React Hook for Consent Management

**useCookieConsent.js**:

```javascript
export function useCookieConsent() {
  const [consent, setConsent] = useState(getCookieConsent());
  const [showBanner, setShowBanner] = useState(!consent);

  const updateConsent = (newConsent) => {
    saveCookieConsent(newConsent);
    setConsent(newConsent);
    setShowBanner(false);
  };

  const resetConsent = () => {
    // Allow users to change preferences later
    setShowBanner(true);
  };

  return { consent, showBanner, updateConsent, resetConsent };
}
```

### 5.5 Cookie Configuration (cookieConfig.js)

```javascript
export const COOKIE_CATEGORIES = {
  NECESSARY: 'necessary',
  FUNCTIONAL: 'functional',
  ANALYTICS: 'analytics',
};

export const COOKIES_BY_CATEGORY = {
  [COOKIE_CATEGORIES.NECESSARY]: [
    {
      name: 'auth_token',
      description: 'Keeps you logged in',
      duration: '7 days or session',
    },
    {
      name: 'session_id',
      description: 'Maintains your session',
      duration: 'Session',
    },
    {
      name: 'cookie_consent',
      description: 'Remembers your cookie preferences',
      duration: '1 year',
    },
  ],
  [COOKIE_CATEGORIES.FUNCTIONAL]: [
    {
      name: 'theme_preference',
      description: 'Remembers your dark/light mode choice',
      duration: '1 year',
    },
    {
      name: 'reading_position',
      description: 'Saves your reading progress',
      duration: '1 year',
    },
  ],
  [COOKIE_CATEGORIES.ANALYTICS]: [
    // Not currently used
  ],
};
```

---

## 6. Integration Points

### 6.1 Where to Show Cookie Banner

**Show On**:
- ✅ First visit to the application
- ✅ When user clears cookies/consent data
- ✅ After major privacy policy updates (optional)

**Do NOT Show On**:
- ❌ Every page navigation (annoying UX)
- ❌ If user has already made a choice

### 6.2 Consent Storage

**Storage Method**: `localStorage` + `cookie_consent` cookie

**Why Both?**:
- Cookie: Accessible server-side if needed
- localStorage: Persistent, larger storage, accessible client-side

**Data Structure**:
```json
{
  "version": "1.0",
  "timestamp": "2025-10-03T12:00:00Z",
  "preferences": {
    "necessary": true,
    "functional": false,
    "analytics": false
  }
}
```

### 6.3 Respecting Consent in Code

**Before setting a functional cookie**:

```javascript
import { isCookieAllowed, setConsentCookie, COOKIE_CATEGORIES } from './cookieManager';

// Example: Save theme preference
function saveThemePreference(theme) {
  if (isCookieAllowed(COOKIE_CATEGORIES.FUNCTIONAL)) {
    setConsentCookie('theme_preference', theme, COOKIE_CATEGORIES.FUNCTIONAL);
  } else {
    // Fallback: Use sessionStorage (not persistent)
    sessionStorage.setItem('theme_preference', theme);
  }
}
```

---

## 7. Cookie Policy Page

### 7.1 Required Content

Create a dedicated **Cookie Policy** page at `/legal/cookies` that includes:

1. **What Are Cookies**: Explain cookies in simple language
2. **Cookies We Use**: List all cookies with descriptions (use `cookieConfig.js` data)
3. **Why We Use Cookies**: Explain purpose of each category
4. **How to Control Cookies**: Explain how to manage preferences
5. **Third-Party Cookies**: List any (currently none for Literati)
6. **Contact Information**: How to ask questions

### 7.2 Sample Cookie Policy Content

```markdown
# Cookie Policy for Literati

## What Are Cookies?

Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and provide a better experience.

## Cookies We Use

### Strictly Necessary Cookies
These cookies are essential for the app to function and cannot be disabled.

- **auth_token**: Keeps you logged in (7 days)
- **session_id**: Maintains your session (session only)
- **cookie_consent**: Remembers your cookie preferences (1 year)

### Functional Cookies
These cookies enhance your experience but are not essential. You can opt out.

- **theme_preference**: Remembers your dark/light mode choice (1 year)
- **reading_position**: Saves your reading progress (1 year)

## How to Control Cookies

You can manage your cookie preferences at any time:

1. Click the "Cookie Preferences" link in the footer
2. Choose which categories to enable/disable
3. Click "Save Preferences"

You can also disable cookies in your browser settings, but this may affect functionality.

## Contact Us

Questions about cookies? Email us at info@literati.pro
```

---

## 8. Accessibility Considerations

### 8.1 Accessibility Requirements

**Cookie Banner Must Be**:
- ✅ Keyboard navigable (Tab, Enter, Esc)
- ✅ Screen reader friendly (ARIA labels)
- ✅ High contrast mode compatible
- ✅ Focus indicators visible

**Example ARIA Implementation**:

```jsx
<div role="dialog" aria-labelledby="cookie-banner-title" aria-describedby="cookie-banner-desc">
  <h2 id="cookie-banner-title">We use cookies</h2>
  <p id="cookie-banner-desc">
    We use cookies to keep you logged in and remember your preferences.
  </p>
  <button aria-label="Customize cookie preferences">Customize</button>
  <button aria-label="Reject all non-essential cookies">Reject All</button>
  <button aria-label="Accept all cookies">Accept All</button>
</div>
```

---

## 9. Compliance Checklist

### 9.1 Pre-Launch Checklist

- [ ] Cookie inventory completed and documented
- [ ] Cookie banner designed and implemented
- [ ] Cookie preferences modal functional
- [ ] Consent properly stored and respected in code
- [ ] Cookie Policy page created and linked
- [ ] Privacy Policy updated to reference cookies
- [ ] "Reject All" option as prominent as "Accept All"
- [ ] No cookies set before consent (except strictly necessary)
- [ ] Testing completed (all browsers, mobile, accessibility)
- [ ] Documentation provided to users in clear language

### 9.2 Ongoing Compliance

- [ ] Review cookie usage quarterly
- [ ] Update Cookie Policy when adding new cookies
- [ ] Test consent mechanism after major updates
- [ ] Monitor regulatory changes (GDPR, ePrivacy updates)
- [ ] Keep consent records (if required by regulation)

---

## 10. Testing Guidelines

### 10.1 Functional Testing

**Test Scenarios**:
1. ✅ First visit shows banner
2. ✅ "Accept All" enables all cookies
3. ✅ "Reject All" disables non-essential cookies
4. ✅ "Customize" allows granular control
5. ✅ Consent persists across sessions
6. ✅ Withdrawing consent clears cookies
7. ✅ Strictly necessary cookies always work
8. ✅ Functional cookies respect consent

### 10.2 Browser Testing

**Test On**:
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers (iOS Safari, Chrome Android)
- Private/Incognito mode
- With browser cookie blocking enabled

### 10.3 Accessibility Testing

**Test With**:
- Screen readers (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation
- High contrast mode
- Browser zoom (up to 200%)

---

## 11. Implementation Timeline

### Phase 1: Design and Planning (Week 1)
- [ ] Finalize cookie banner UI/UX design
- [ ] Review cookie inventory
- [ ] Create Cookie Policy page content

### Phase 2: Development (Week 2-3)
- [ ] Implement cookie manager utilities
- [ ] Build CookieBanner component
- [ ] Build CookiePreferences modal
- [ ] Create useCookieConsent hook
- [ ] Update existing code to respect consent

### Phase 3: Testing (Week 4)
- [ ] Functional testing
- [ ] Browser compatibility testing
- [ ] Accessibility testing
- [ ] User acceptance testing

### Phase 4: Deployment (Week 5)
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Gather user feedback

---

## 12. Resources and References

### 12.1 Legal Resources

- **GDPR ePrivacy Directive**: [EUR-Lex](https://eur-lex.europa.eu/)
- **ICO Cookie Guidance** (UK): [ico.org.uk/cookies](https://ico.org.uk/)
- **CNIL Cookie Guidance** (France): [cnil.fr](https://www.cnil.fr/)

### 12.2 Technical Resources

- **MDN Web Docs - HTTP Cookies**: [developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- **Web Accessibility Initiative - ARIA**: [w3.org/WAI](https://www.w3.org/WAI/)

### 12.3 Recommended Tools

- **Cookie Scanner**: Use tools like CookieMetrix or Cookiebot Scanner to audit cookies
- **Accessibility Checker**: Use axe DevTools or WAVE to test accessibility

---

## 13. Contact and Support

**Data Protection Officer**
Email: info@literati.pro
Address: 628 Montreal Court, Brownsville, Texas 78526

**For Technical Implementation Questions**
Contact: Development Team

---

## 14. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | October 3, 2025 | Literati Team | Initial cookie consent implementation guide |

---

*This document should be reviewed and updated whenever cookie usage changes or privacy regulations are updated.*
