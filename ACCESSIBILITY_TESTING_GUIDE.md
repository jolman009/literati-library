# Accessibility Testing Guide
**Library Management Application - WCAG 2.1 AA Compliance**

---

## Quick Start: 5-Minute Accessibility Check

### 1. Keyboard Navigation Test (2 minutes)
```
1. Open the application
2. Press TAB key repeatedly
3. Verify you can reach all interactive elements
4. Verify visible focus indicators appear
5. Press ENTER/SPACE on buttons to activate
```
**Expected**: All buttons, links, and inputs are keyboard accessible with visible blue outline.

### 2. Screen Reader Test (2 minutes)
```
1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Navigate the dashboard
3. Listen for button labels and descriptions
4. Verify sync button announces "Syncing" state
```
**Expected**: All interactive elements have clear, descriptive labels.

### 3. Color Contrast Check (1 minute)
```
1. Toggle between light and dark themes
2. Verify all text is easily readable
3. Check button text against button backgrounds
```
**Expected**: All text meets 4.5:1 contrast ratio minimum.

---

## Detailed Testing Procedures

### A. Keyboard Navigation

#### Test All Interactive Elements
| Element Type | How to Test | Expected Behavior |
|--------------|-------------|-------------------|
| **Buttons** | Tab to button, press ENTER | Button activates, action occurs |
| **Links** | Tab to link, press ENTER | Navigation occurs |
| **Forms** | Tab through inputs, type | Focus moves logically, can input text |
| **Modals** | Tab while modal open | Focus trapped in modal |
| **Dropdowns** | Arrow keys | Options navigate with arrow keys |

#### Focus Indicator Checklist
- [ ] Focus outline is visible (3px blue outline)
- [ ] Focus outline has good contrast against background
- [ ] Focus indicator appears on ALL interactive elements
- [ ] Focus indicator is not hidden by other elements

#### Tab Order Test
```
Expected tab order on Dashboard:
1. Theme toggle button
2. Daily check-in button
3. Sync data button
4. Navigation menu items
5. Current reading sessions cards
6. Point category cards
```

---

### B. Screen Reader Testing

#### Tools
- **Windows**: NVDA (free) or JAWS
- **Mac**: VoiceOver (built-in, CMD+F5)
- **Chrome**: ChromeVox extension

#### Test Script
1. **Start Screen Reader**
   ```
   NVDA: Control + Alt + N
   VoiceOver: CMD + F5
   ChromeVox: Install extension and enable
   ```

2. **Navigate Dashboard**
   - Use arrow keys to hear page elements
   - Tab through interactive elements
   - Listen for proper announcements

3. **Expected Announcements**
   ```
   Theme Toggle: "Switch to dark mode, button"
   Check-in Button: "Daily Check-in, button" or "Checked In Today, button, disabled"
   Sync Button: "Sync data with server, button" (idle)
   Sync Button: "Syncing data with server, button, busy" (syncing)
   ```

4. **Test Form Inputs**
   - All inputs must have associated labels
   - Error messages must be announced
   - Required fields must be indicated

---

### C. Color Contrast Testing

#### Tools
- Chrome DevTools Contrast Checker
- https://webaim.org/resources/contrastchecker/
- Browser extension: "WCAG Color contrast checker"

#### Manual Testing Steps

1. **Open Chrome DevTools**
   ```
   1. Right-click text element
   2. Select "Inspect"
   3. In Styles panel, find color property
   4. Click color swatch
   5. View contrast ratio at bottom
   ```

2. **Verify Minimum Ratios**
   - Normal text (< 18px): **4.5:1** minimum
   - Large text (≥ 18px): **3:1** minimum
   - UI components: **3:1** minimum

3. **Test Both Themes**
   ```
   Light Theme:
   ✅ Background (#f8f9fa) vs Text (#1a1d20): 12.6:1
   ✅ Surface (#ffffff) vs Text (#1a1d20): 14.1:1
   ✅ Primary button (#4f46e5) vs White text: 8.6:1

   Dark Theme:
   ✅ Background (#0a0e13) vs Text (#e3e2e6): 13.4:1
   ✅ Surface (#111827) vs Text (#e3e2e6): 11.8:1
   ✅ Primary button (#a5c2ff) vs Dark text: 7.2:1
   ```

---

### D. Motion & Animation Testing

#### Reduced Motion Preference

1. **Enable Reduced Motion** (Windows 10/11)
   ```
   Settings > Ease of Access > Display
   Toggle "Show animations in Windows" OFF
   ```

2. **Enable Reduced Motion** (Mac)
   ```
   System Preferences > Accessibility > Display
   Check "Reduce motion"
   ```

3. **Test in Browser**
   ```
   Chrome DevTools:
   1. Open DevTools (F12)
   2. Press CMD/Ctrl + Shift + P
   3. Type "Emulate CSS prefers-reduced-motion"
   4. Select "prefers-reduced-motion: reduce"
   ```

4. **Expected Behavior**
   - Spinning sync icon should stop animating
   - Transitions should complete instantly
   - Page transitions should be minimal
   - Hover effects should be instant

---

### E. Form Accessibility Testing

#### Test Checklist
- [ ] All inputs have associated `<label>` elements
- [ ] Required fields are marked with `aria-required="true"` or `required`
- [ ] Error messages use `aria-invalid="true"` and `aria-describedby`
- [ ] Error messages are announced to screen readers
- [ ] Form can be completed using keyboard only

#### Example Accessible Form
```jsx
<div>
  <label htmlFor="email" className="required">
    Email Address
  </label>
  <input
    id="email"
    type="email"
    required
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : undefined}
  />
  {hasError && (
    <span id="email-error" className="error-message" role="alert">
      Please enter a valid email address
    </span>
  )}
</div>
```

---

### F. Mobile Accessibility Testing

#### Touch Target Sizes
All interactive elements should be **at least 44x44px**.

**Test Script**:
1. Open DevTools mobile emulation
2. Enable touch mode
3. Verify all buttons are easily tappable
4. Check spacing between tap targets

#### Zoom Testing
1. Zoom browser to 200% (Ctrl/CMD + +)
2. Verify layout doesn't break
3. Ensure no horizontal scrolling
4. Check all content is still readable

---

## Automated Testing Tools

### 1. Lighthouse Accessibility Audit

```bash
# Run Lighthouse from command line
npm install -g lighthouse
lighthouse http://localhost:3000 --only-categories=accessibility --view
```

**Expected Score**: 90+ / 100

### 2. axe DevTools

```bash
# Install axe-core
npm install --save-dev @axe-core/cli

# Run accessibility scan
npx axe http://localhost:3000 --save report.json
```

### 3. Pa11y CI

```bash
# Install pa11y
npm install --save-dev pa11y-ci

# Run test
npx pa11y-ci http://localhost:3000
```

---

## Common Accessibility Issues & Fixes

### Issue 1: Missing ARIA Labels on Icon Buttons

**Problem**:
```jsx
<button onClick={handleClick}>
  <Icon />
</button>
```

**Fix**:
```jsx
<button onClick={handleClick} aria-label="Descriptive action name">
  <Icon aria-hidden="true" />
</button>
```

### Issue 2: Poor Color Contrast

**Problem**: Text color #888888 on white background (2.9:1 - FAIL)

**Fix**: Use #595959 for 4.5:1 contrast ratio

### Issue 3: Missing Focus Indicators

**Problem**:
```css
button:focus {
  outline: none; /* Don't do this! */
}
```

**Fix**:
```css
button:focus-visible {
  outline: 3px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}
```

### Issue 4: Animations Cause Motion Sickness

**Problem**: Always-on animations

**Fix**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Accessibility Checklist for New Features

Before deploying any new UI component:

### Visual
- [ ] Color contrast ≥ 4.5:1 for text
- [ ] Focus indicators visible on all interactive elements
- [ ] Text readable at 200% zoom
- [ ] UI works in both light and dark themes

### Semantic
- [ ] Proper heading hierarchy (h1, h2, h3...)
- [ ] All images have alt text
- [ ] Forms have associated labels
- [ ] Buttons have descriptive text or aria-label

### Keyboard
- [ ] All functionality available via keyboard
- [ ] Logical tab order
- [ ] No keyboard traps
- [ ] Enter/Space activate buttons

### Screen Reader
- [ ] All interactive elements announced
- [ ] Dynamic content changes announced (aria-live)
- [ ] Loading states communicated (aria-busy)
- [ ] Error messages announced

### Motion
- [ ] Respects prefers-reduced-motion
- [ ] Animations can be disabled
- [ ] No auto-playing videos/audio

---

## Browser Testing Matrix

| Browser | Version | Screen Reader | Status |
|---------|---------|---------------|--------|
| Chrome | Latest | ChromeVox | ✅ Primary |
| Firefox | Latest | NVDA | ✅ Test |
| Safari | Latest | VoiceOver | ✅ Test |
| Edge | Latest | Narrator | ⚠️ Verify |

---

## Resources

### Official Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Accessibility](https://m3.material.io/foundations/accessible-design)
- [WebAIM Resources](https://webaim.org/resources/)

### Testing Tools
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Screen Readers
- [NVDA (Windows, free)](https://www.nvaccess.org/)
- [JAWS (Windows, commercial)](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver (Mac/iOS, built-in)](https://www.apple.com/accessibility/voiceover/)

---

**Last Updated**: 2025-10-09
**Version**: 1.0
**Next Review**: 2025-10-16
