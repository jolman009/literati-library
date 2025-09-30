# Material Design 3 Style Guide
## My Library App - Comprehensive Styling Standards

**Version:** 1.0
**Last Updated:** 2025-09-29
**Author:** Development Team

---

## Table of Contents
1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Spacing System](#spacing-system)
4. [Typography](#typography)
5. [Color System](#color-system)
6. [Layout Standards](#layout-standards)
7. [Component Patterns](#component-patterns)
8. [Page Structure](#page-structure)
9. [Responsive Design](#responsive-design)
10. [Code Examples](#code-examples)

---

## Overview

This style guide establishes consistent Material Design 3 standards across all pages in the My Library App. Following these guidelines ensures visual harmony, maintainability, and an excellent user experience.

### Core Philosophy
- **CSS-First Approach**: Use external CSS files with MD3 tokens, not inline styles
- **Consistency**: All pages follow identical spacing, typography, and layout patterns
- **Accessibility**: WCAG 2.1 AA compliant with proper contrast and focus indicators
- **Responsive**: Mobile-first design that adapts to all screen sizes

---

## Design Principles

### 1. Material Design 3 Core Concepts
- **Dynamic Color**: Use CSS custom properties for theming
- **Elevation**: Subtle shadows for hierarchy
- **Shape**: Consistent border-radius scale
- **Motion**: Smooth, purposeful transitions

### 2. Visual Hierarchy
```
Level 1: Page Headers (max-width: 1200px, centered)
Level 2: Section Containers (full-width with padding)
Level 3: Content Cards (constrained within sections)
Level 4: Card Content (internal spacing)
```

---

## Spacing System

### CSS Custom Properties
```css
:root {
  /* Spacing Scale - 8px base unit */
  --spacing-xs: 4px;    /* 0.5 units */
  --spacing-sm: 8px;    /* 1 unit */
  --spacing-md: 16px;   /* 2 units */
  --spacing-lg: 24px;   /* 3 units */
  --spacing-xl: 32px;   /* 4 units */
  --spacing-xxl: 48px;  /* 6 units */

  /* Border Radius Scale */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
}
```

### Spacing Usage Matrix

| Element | Top/Bottom | Left/Right | Use Case |
|---------|------------|------------|----------|
| Page Container | 0 | 24px | Main content wrapper |
| Section | 32px | 24px | Major page sections |
| Card | 24px | 20px | Internal card padding |
| Card Header | 0 0 16px 0 | 0 | Header within card |
| Button | 12px | 24px | Standard button padding |
| Chip | 6px | 12px | Small pill-style elements |

### Margin Between Elements
- **Between major sections**: `32px` (`margin-bottom: var(--spacing-xl)`)
- **Between cards**: `24px` (`gap: var(--spacing-lg)`)
- **Between form fields**: `16px` (`gap: var(--spacing-md)`)
- **Between inline elements**: `8px` (`gap: var(--spacing-sm)`)

---

## Typography

### Font Stack
```css
font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Type Scale
```css
:root {
  --text-xs: 0.75rem;    /* 12px - Captions, timestamps */
  --text-sm: 0.875rem;   /* 14px - Body small, labels */
  --text-base: 1rem;     /* 16px - Body text */
  --text-lg: 1.125rem;   /* 18px - Subheadings */
  --text-xl: 1.25rem;    /* 20px - Card titles */
  --text-2xl: 1.5rem;    /* 24px - Section headers */
  --text-3xl: 1.875rem;  /* 30px - Page headers */
}
```

### Typography Hierarchy

#### Page Headers (H1)
```css
.page-header h1 {
  font-size: var(--text-3xl);    /* 30px */
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--md-sys-color-on-surface);
}
```

#### Section Headers (H2)
```css
.section-header {
  font-size: var(--text-2xl);    /* 24px */
  font-weight: 600;
  line-height: 1.3;
  margin: 0 0 var(--spacing-md) 0;
  color: var(--md-sys-color-on-surface);
}
```

#### Card Titles (H3)
```css
.card-title {
  font-size: var(--text-xl);     /* 20px */
  font-weight: 600;
  line-height: 1.3;
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--md-sys-color-on-surface);
}
```

#### Body Text
```css
.body-text {
  font-size: var(--text-base);   /* 16px */
  font-weight: 400;
  line-height: 1.5;
  color: var(--md-sys-color-on-surface);
}
```

#### Secondary Text
```css
.secondary-text {
  font-size: var(--text-sm);     /* 14px */
  font-weight: 400;
  line-height: 1.5;
  color: var(--md-sys-color-on-surface-variant);
  opacity: 0.8;
}
```

---

## Color System

### Material Design 3 Color Tokens

#### Primary Colors
```css
:root {
  --md-sys-color-primary: 103, 80, 164;
  --md-sys-color-on-primary: 255, 255, 255;
  --md-sys-color-primary-container: 223, 230, 255;
  --md-sys-color-on-primary-container: 0, 30, 66;
}
```

#### Surface Colors
```css
:root {
  --md-sys-color-surface: 255, 255, 255;
  --md-sys-color-surface-container: 248, 248, 248;
  --md-sys-color-surface-container-low: 252, 252, 252;
  --md-sys-color-surface-container-high: 244, 244, 244;
  --md-sys-color-surface-container-highest: 240, 240, 240;
  --md-sys-color-on-surface: 28, 28, 28;
  --md-sys-color-on-surface-variant: 115, 115, 115;
}
```

#### Outline Colors
```css
:root {
  --md-sys-color-outline: 196, 196, 196;
  --md-sys-color-outline-variant: 225, 225, 225;
}
```

#### Semantic Colors
```css
:root {
  --md-sys-color-error: 220, 38, 38;
  --md-sys-color-success: 76, 175, 80;
  --md-sys-color-warning: 255, 152, 0;
  --md-sys-color-info: 33, 150, 243;
}
```

### Dark Theme
```css
[data-theme="dark"] {
  --md-sys-color-primary: 187, 207, 255;
  --md-sys-color-surface: 16, 16, 16;
  --md-sys-color-surface-container: 32, 32, 32;
  --md-sys-color-on-surface: 245, 245, 245;
  --md-sys-color-outline: 75, 75, 75;
}
```

### Color Usage Guidelines

#### Background Hierarchy
```css
/* Page background */
background: var(--md-sys-color-surface);

/* Section background (elevated) */
background: var(--md-sys-color-surface-container);

/* Card background (more elevated) */
background: var(--md-sys-color-surface-container-high);
```

#### Text on Backgrounds
```css
/* Primary text */
color: rgb(var(--md-sys-color-on-surface));

/* Secondary text */
color: rgb(var(--md-sys-color-on-surface-variant));

/* Text on colored background */
color: rgb(var(--md-sys-color-on-primary));
```

#### Border Colors
```css
/* Standard border */
border: 1px solid rgb(var(--md-sys-color-outline-variant));

/* Emphasized border */
border: 1px solid rgb(var(--md-sys-color-outline));

/* Focus border */
border: 2px solid rgb(var(--md-sys-color-primary));
```

---

## Layout Standards

### Page Container Pattern
**Every page MUST follow this structure:**

```css
.page-wrapper {
  background: var(--md-sys-color-surface);
  min-height: calc(100vh - 80px);
  position: relative;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg) var(--spacing-lg);
}
```

### Standard Page Layout

```
┌─────────────────────────────────────────────────┐
│                  App Header                     │ (Fixed)
├─────────────────────────────────────────────────┤
│              Page Background                    │
│  ┌───────────────────────────────────────────┐ │
│  │       Page Content (max-width: 1200px)    │ │
│  │  ┌─────────────────────────────────────┐  │ │
│  │  │    Page Header (padding: 32px)      │  │ │ <- Section 1
│  │  └─────────────────────────────────────┘  │ │
│  │                                            │ │
│  │  ┌─────────────────────────────────────┐  │ │
│  │  │    Section (margin-bottom: 32px)    │  │ │ <- Section 2
│  │  │    ┌─────────────────────────────┐  │  │ │
│  │  │    │  Card (gap: 24px)           │  │  │ │
│  │  │    └─────────────────────────────┘  │  │ │
│  │  └─────────────────────────────────────┘  │ │
│  │                                            │ │
│  │  ┌─────────────────────────────────────┐  │ │
│  │  │    Another Section                  │  │ │ <- Section 3
│  │  └─────────────────────────────────────────┘ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Header Pattern (CRITICAL)
**All page headers MUST use this exact structure:**

```jsx
<div className="page-header-section">
  <div className="page-header-content">
    <h1>Page Title</h1>
    <p>Page description or tagline</p>
  </div>
</div>
```

```css
/* CSS for consistent header */
.page-header-section {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-xl) var(--spacing-lg);
  background: var(--md-sys-color-surface-container);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.page-header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header-content h1 {
  font-size: var(--text-3xl);
  font-weight: 700;
  margin: 0 0 var(--spacing-sm) 0;
  color: rgb(var(--md-sys-color-on-surface));
}

.page-header-content p {
  font-size: var(--text-base);
  margin: 0;
  color: rgb(var(--md-sys-color-on-surface-variant));
  opacity: 0.8;
}
```

---

## Component Patterns

### Cards

#### Standard Card
```css
.md3-card {
  background: rgb(var(--md-sys-color-surface-container));
  border: 1px solid rgb(var(--md-sys-color-outline-variant));
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.md3-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

#### Elevated Card
```css
.md3-card-elevated {
  background: rgb(var(--md-sys-color-surface-container-high));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
```

### Buttons

```css
/* Filled Button */
.md3-button-filled {
  background: rgb(var(--md-sys-color-primary));
  color: rgb(var(--md-sys-color-on-primary));
  border: none;
  border-radius: var(--radius-xl);
  padding: 12px 24px;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Outlined Button */
.md3-button-outlined {
  background: transparent;
  color: rgb(var(--md-sys-color-primary));
  border: 1px solid rgb(var(--md-sys-color-outline));
  border-radius: var(--radius-xl);
  padding: 12px 24px;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Text Button */
.md3-button-text {
  background: transparent;
  color: rgb(var(--md-sys-color-primary));
  border: none;
  padding: 8px 16px;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
```

### Input Fields

```css
.md3-textfield {
  width: 100%;
  padding: 12px 16px;
  font-size: var(--text-base);
  color: rgb(var(--md-sys-color-on-surface));
  background: rgb(var(--md-sys-color-surface-container));
  border: 1px solid rgb(var(--md-sys-color-outline-variant));
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.md3-textfield:focus {
  outline: none;
  border-color: rgb(var(--md-sys-color-primary));
  box-shadow: 0 0 0 3px rgba(var(--md-sys-color-primary), 0.1);
}
```

### Chips

```css
.md3-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 6px 12px;
  background: rgb(var(--md-sys-color-surface-container));
  border: 1px solid rgb(var(--md-sys-color-outline-variant));
  border-radius: var(--radius-xl);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.md3-chip.selected {
  background: rgb(var(--md-sys-color-primary));
  color: rgb(var(--md-sys-color-on-primary));
  border-color: rgb(var(--md-sys-color-primary));
}
```

---

## Page Structure

### Dashboard Page Pattern
```jsx
<div className="dashboard-container">
  <div className="dashboard-content">
    {/* Welcome Section */}
    <section className="welcome-section">
      {/* Content */}
    </section>

    {/* Progress Section */}
    <section className="progress-section">
      <h2 className="section-header">📊 Your Progress</h2>
      {/* Stats grid */}
    </section>

    {/* Other sections... */}
  </div>
</div>
```

```css
.dashboard-container {
  background: var(--md-sys-color-surface);
  min-height: calc(100vh - 80px);
  margin-top: 56px;
  position: relative;
}

.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg) var(--spacing-lg);
}

.welcome-section {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #d1d5db 0%, #b8bcc2 50%, #d1d5db 100%);
  border: 1px solid #9ca3af;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.progress-section {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg,
    rgba(79, 70, 229, 0.08),
    rgba(5, 150, 105, 0.08)
  );
  border: 1px solid rgba(79, 70, 229, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.section-header {
  font-size: var(--text-2xl);
  font-weight: 600;
  margin: 0 0 var(--spacing-md) 0;
  color: rgb(var(--md-sys-color-on-surface));
}
```

### Library/Collections Page Pattern
```jsx
<div className="library-container">
  <div className="library-content">
    {/* Page Header - MUST follow standard */}
    <div className="page-header-section">
      <div className="page-header-content">
        <h1>📚 Collections</h1>
        <p>Organize your library with custom collections</p>
      </div>
    </div>

    {/* Search and Filter */}
    <section className="search-section">
      {/* Search bar */}
    </section>

    {/* Main Content Grid */}
    <section className="content-section">
      <div className="content-grid">
        {/* Cards */}
      </div>
    </section>
  </div>
</div>
```

```css
.library-container {
  background: var(--md-sys-color-surface);
  min-height: calc(100vh - 80px);
  position: relative;
}

.library-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg) var(--spacing-lg);
}

.search-section {
  margin-bottom: var(--spacing-xl);
}

.content-section {
  margin-bottom: var(--spacing-xl);
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg);
}
```

---

## Responsive Design

### Breakpoints
```css
/* Mobile First Approach */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}
```

### Responsive Patterns

#### Mobile (< 768px)
```css
@media (max-width: 768px) {
  .page-content,
  .dashboard-content,
  .library-content {
    padding: 0 var(--spacing-md) var(--spacing-lg);
  }

  .page-header-section {
    padding: var(--spacing-lg) var(--spacing-md);
  }

  .content-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
}
```

#### Tablet (768px - 1024px)
```css
@media (min-width: 768px) and (max-width: 1024px) {
  .content-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

---

## Code Examples

### ✅ CORRECT: Dashboard Page Structure
```jsx
import React from 'react';
import './dashboard-page.css';

const DashboardPage = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Welcome Section */}
        <section className="welcome-section">
          <h1>Welcome back!</h1>
          <p>Continue your reading journey</p>
        </section>

        {/* Progress Section */}
        <section className="progress-section">
          <h2 className="section-header">📊 Your Progress</h2>
          <div className="stats-grid">
            {/* Stat cards */}
          </div>
        </section>
      </div>
    </div>
  );
};
```

### ❌ INCORRECT: Mixing Inline Styles
```jsx
// DON'T DO THIS
<div style={{ background: '#fff', padding: '24px', marginBottom: '32px' }}>
  <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Title</h1>
</div>
```

### ✅ CORRECT: Using CSS Classes
```jsx
// DO THIS INSTEAD
<div className="section-container">
  <h1 className="section-header">Title</h1>
</div>
```

```css
/* In your CSS file */
.section-container {
  background: rgb(var(--md-sys-color-surface));
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.section-header {
  font-size: var(--text-2xl);
  font-weight: 600;
}
```

### ✅ CORRECT: Collections Header (Fixed)
```jsx
<div className="collections-header-section">
  <div className="collections-header-content">
    <h1>📚 Collections</h1>
    <p>Organize your library with custom collections</p>

    {/* Search controls */}
    <div className="collections-search-controls">
      <MD3TextField placeholder="Search collections..." />
      <MD3Button>New Collection</MD3Button>
    </div>
  </div>
</div>
```

```css
/* In EnhancedCollectionsPage.css */
.collections-header-section {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-xl) var(--spacing-lg);
  background: var(--md-sys-color-surface-container);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.collections-header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.collections-header-content h1 {
  font-size: var(--text-3xl);
  font-weight: 700;
  margin: 0 0 var(--spacing-sm) 0;
  color: rgb(var(--md-sys-color-on-surface));
}
```

---

## Checklist for New Pages

When creating or updating a page, verify:

- [ ] Page wrapper follows standard container pattern
- [ ] Content constrained to max-width: 1200px
- [ ] Header uses `.page-header-section` + `.page-header-content` pattern
- [ ] All spacing uses CSS custom properties (--spacing-*)
- [ ] All colors use MD3 tokens (var(--md-sys-color-*))
- [ ] Typography uses type scale variables (--text-*)
- [ ] NO inline styles (use CSS classes)
- [ ] Cards use consistent padding and border-radius
- [ ] Responsive breakpoints tested (mobile, tablet, desktop)
- [ ] Dark theme tested and working
- [ ] Focus indicators visible and accessible

---

## Migration Checklist

For existing pages that need updates:

1. **Audit Current Styling**
   - Identify all inline styles
   - List inconsistent spacing/colors
   - Note missing MD3 tokens

2. **Create CSS File**
   - Follow naming: `[PageName].css`
   - Import MD3 variables
   - Define page-specific classes

3. **Replace Inline Styles**
   - Convert `style={{}}` to `className=""`
   - Use MD3 color tokens
   - Apply spacing scale

4. **Test Responsiveness**
   - Mobile view (< 768px)
   - Tablet view (768px - 1024px)
   - Desktop view (> 1024px)

5. **Verify Accessibility**
   - Keyboard navigation
   - Focus indicators
   - Color contrast (4.5:1 minimum)

---

## Quick Reference

### Most Common Patterns

**Page Wrapper:**
```css
max-width: 1200px;
margin: 0 auto;
padding: 0 var(--spacing-lg) var(--spacing-lg);
```

**Section Spacing:**
```css
margin-bottom: var(--spacing-xl);
```

**Card Padding:**
```css
padding: var(--spacing-lg);
```

**Text Color:**
```css
color: rgb(var(--md-sys-color-on-surface));
```

**Border:**
```css
border: 1px solid rgb(var(--md-sys-color-outline-variant));
```

---

## Resources

- [Material Design 3 Guidelines](https://m3.material.io/)
- [MD3 Color System](https://m3.material.io/styles/color/overview)
- [MD3 Typography](https://m3.material.io/styles/typography/overview)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Changelog

**v1.0 (2025-09-29)**
- Initial style guide created
- Established spacing, typography, and color standards
- Defined page structure patterns
- Created code examples and migration checklist

---

**For questions or suggestions, contact the development team.**