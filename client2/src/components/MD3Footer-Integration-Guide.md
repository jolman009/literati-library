# MD3 Footer Integration Guide

## Overview

The MD3Footer component provides a Material Design 3 compliant footer with links to legal pages (Privacy Policy, Terms of Service), support resources, and company information.

---

## Files Created

- **Component**: `src/components/MD3Footer.jsx`
- **Styles**: `src/components/MD3Footer.css`

---

## Integration Methods

### Method 1: Add to Main App Layout (Recommended)

Add the footer to your main App.jsx so it appears on all pages:

```jsx
// In src/App.jsx
import MD3Footer from './components/MD3Footer';

const App = () => {
  return (
    <div className="app">
      <Material3ThemeProvider>
        <MD3SnackbarProvider>
          <AuthProvider>
            <GamificationProvider>
              {/* Your existing content */}
              <Routes>
                {/* Your routes */}
              </Routes>

              {/* Add footer at the end */}
              <MD3Footer />
            </GamificationProvider>
          </AuthProvider>
        </MD3SnackbarProvider>
      </Material3ThemeProvider>
    </div>
  );
};
```

---

### Method 2: Add to Protected Routes Only

If you only want the footer on authenticated pages:

```jsx
// In your ProtectedAppLayout component
import MD3Footer from '../components/MD3Footer';

const ProtectedAppLayout = () => {
  return (
    <div className="protected-layout">
      <NavigationBar />
      <main className="main-content">
        <Outlet />
      </main>
      <MD3Footer />
    </div>
  );
};
```

---

### Method 3: Sticky Footer (Always at Bottom)

To make the footer stick to the bottom of the page even on short content:

```jsx
// Wrap your app in a flex container
const App = () => {
  return (
    <div className="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Material3ThemeProvider>
        <MD3SnackbarProvider>
          <AuthProvider>
            <GamificationProvider>
              {/* Content area */}
              <div style={{ flex: 1 }}>
                <Routes>
                  {/* Your routes */}
                </Routes>
              </div>

              {/* Footer always at bottom */}
              <MD3Footer />
            </GamificationProvider>
          </AuthProvider>
        </MD3SnackbarProvider>
      </Material3ThemeProvider>
    </div>
  );
};
```

---

## Features

### Links Included

**Legal Section:**
- Privacy Policy (`/legal/privacy-policy`)
- Terms of Service (`/legal/terms-of-service`)
- Cookie Preferences (reopens cookie consent banner)

**Support Section:**
- Contact Us (mailto:info@literati.pro)
- Help Center (`/help`)
- Export My Data (`/settings/data-export`)

**About Section:**
- About Literati (`/about`)
- GitHub (external link - update with your repo URL)

### Bottom Bar

- Copyright notice (auto-updates year)
- Location: "Made in Brownsville, Texas"
- Email: info@literati.pro

---

## Customization

### Update Links

To change or remove links, edit `MD3Footer.jsx`:

```jsx
// Remove a link
// Just delete the <Link> or <a> element

// Add a new link
<Link
  to="/your-page"
  className="md-label-large md3-footer-link"
>
  Your Page Name
</Link>
```

### Update GitHub Link

Replace the GitHub link with your actual repository:

```jsx
<a
  href="https://github.com/YOUR_USERNAME/literati"  // Update this
  target="_blank"
  rel="noopener noreferrer"
  className="md-label-large md3-footer-link"
>
  GitHub
</a>
```

### Change Tagline

Edit the tagline in `MD3Footer.jsx`:

```jsx
<p className="md-body-small md3-footer-tagline">
  Your custom tagline here
</p>
```

---

## Styling

The footer uses Material Design 3 design tokens for theming:

- **Background**: `var(--md-sys-color-surface-container)`
- **Text**: `var(--md-sys-color-on-surface-variant)`
- **Links**: `var(--md-sys-color-primary)` on hover
- **Borders**: `var(--md-sys-color-outline-variant)`

The footer automatically adapts to:
- ✅ Light/Dark themes
- ✅ High contrast mode
- ✅ Reduced motion preferences
- ✅ Mobile, tablet, desktop screen sizes

---

## Responsive Behavior

**Desktop (>768px):**
- 3 columns of links side-by-side
- Bottom bar: copyright on left, meta info on right

**Tablet (768px):**
- 2 columns of links
- Bottom bar stacked

**Mobile (<767px):**
- Single column layout
- Links stacked vertically
- Compact spacing

---

## Accessibility Features

- ✅ Keyboard navigation support
- ✅ Focus indicators on all interactive elements
- ✅ ARIA-compliant link structure
- ✅ Semantic HTML (`<footer>`, `<nav>`)
- ✅ Reduced motion support
- ✅ High contrast mode support
- ✅ Screen reader friendly

---

## Cookie Preferences Button

The "Cookie Preferences" button triggers the cookie consent banner by:
1. Removing the stored consent from localStorage
2. Reloading the page (which triggers the banner)

If you have a different cookie preference system, update this function:

```jsx
<button
  onClick={() => {
    // Your custom cookie preferences function
    showCookiePreferences(); // Example
  }}
  className="md-label-large md3-footer-link md3-footer-button"
>
  Cookie Preferences
</button>
```

---

## Testing Checklist

- [ ] Footer appears on all pages (or protected pages, depending on integration)
- [ ] All links navigate correctly
- [ ] Privacy Policy link opens `/legal/privacy-policy`
- [ ] Terms of Service link opens `/legal/terms-of-service`
- [ ] Email link opens mail client with correct address
- [ ] Cookie preferences button reopens cookie banner
- [ ] Footer adapts to light/dark theme changes
- [ ] Footer is responsive on mobile, tablet, desktop
- [ ] Footer is keyboard navigable
- [ ] Links have visible focus indicators
- [ ] Current year displays correctly in copyright

---

## Example: Full App Integration

```jsx
// src/App.jsx (simplified example)
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MD3Footer from './components/MD3Footer';
import './App.css';

const App = () => {
  return (
    <div className="app-wrapper">
      {/* Main content area */}
      <main className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/legal/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/legal/terms-of-service" element={<TermsOfServicePage />} />
          {/* More routes... */}
        </Routes>
      </main>

      {/* Footer appears on all pages */}
      <MD3Footer />
    </div>
  );
};

export default App;
```

**Corresponding CSS** (in App.css):

```css
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-content {
  flex: 1;
}
```

---

## Troubleshooting

**Issue**: Footer overlaps content
**Solution**: Ensure your main content area has `flex: 1` or sufficient padding-bottom

**Issue**: Links don't navigate
**Solution**: Check that routes are defined in App.jsx for all footer links

**Issue**: Footer doesn't stick to bottom on short pages
**Solution**: Use Method 3 (Sticky Footer) integration

**Issue**: Theme colors don't match
**Solution**: Ensure MD3 design tokens are properly loaded in your CSS

---

## Future Enhancements

Potential additions to the footer:

- **Social media links** (Twitter, Facebook, etc.)
- **Language selector**
- **Newsletter signup**
- **Sitemap link**
- **Accessibility statement**
- **Status page** (for service uptime)

---

*Created on October 3, 2025 as part of Literati's legal compliance initiative.*
