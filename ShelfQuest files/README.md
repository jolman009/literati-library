# ShelfQuest Logo Package
## Complete Brand Identity & Implementation Guide

---

## 📦 Package Contents

This package contains everything you need to implement the ShelfQuest brand identity across all platforms.

### **Total Files Generated: 50+**

#### Vector Files (SVG) - 5 files
- `shelfquest_logo_master.svg` - Full color version
- `shelfquest_logo_monochrome.svg` - Single color (purple)
- `shelfquest_logo_white.svg` - White for dark backgrounds
- `shelfquest_logo_horizontal.svg` - Logo + wordmark side-by-side
- `shelfquest_logo_stacked.svg` - Logo + wordmark stacked

#### App Icons (PNG) - 11 files
- `icon_1024x1024.png` - Apple App Store
- `icon_512x512.png` - Google Play Store
- `icon_192x192.png` - PWA standard
- `icon_180x180.png` - Apple Touch Icon
- `icon_128x128.png` through `icon_16x16.png` - Various sizes

#### Monochrome Variations - 3 files
- `icon_monochrome_512x512.png`
- `icon_monochrome_256x256.png`
- `icon_monochrome_128x128.png`

#### White Variations - 3 files
- `icon_white_512x512.png`
- `icon_white_256x256.png`
- `icon_white_128x128.png`

#### Web Favicons - 4 files
- `favicon.ico` - Multi-size ICO file
- `favicon_32x32.png`
- `favicon_16x16.png`
- `apple-touch-icon.png`

#### PWA Icons - 8 files
- `pwa_icon_72x72.png` through `pwa_icon_512x512.png`

#### Android Adaptive - 1 file
- `icon_maskable_512x512.png`

#### Marketing Assets - 3 files
- `og_image_1200x630.png` - Open Graph
- `twitter_card_1200x675.png` - Twitter
- `social_square_1200x1200.png` - General social

#### Configuration Files - 2 files
- `manifest.json` - PWA manifest
- `logo_implementation_guide.html` - Interactive guide

---

## 🎨 Logo Concept: "The Quest Bookmark"

**Symbolism:**
- **Bookmark** = Reading & Library
- **Compass Rose** = Navigation & Quest
- **Achievement Star** = Gamification & Progress

**Design Principles:**
- Material Design 3 compliant
- Scalable from 16px to billboard size
- Works in monochrome and full color
- Distinctive and memorable
- Premium aesthetic

---

## 🚀 Quick Start Implementation

### 1. File Organization

```
your-project/
├── public/
│   ├── favicon.ico
│   ├── manifest.json
│   └── icons/
│       ├── *.svg (all SVG files)
│       └── *.png (all PNG files)
```

### 2. HTML Head Setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Favicons -->
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon_32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon_16x16.png">
    
    <!-- Apple Touch Icon -->
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json">
    
    <!-- Theme Color -->
    <meta name="theme-color" content="#5e0085">
    
    <!-- Open Graph -->
    <meta property="og:image" content="https://yourdomain.com/icons/og_image_1200x630.png">
    
    <!-- Twitter Card -->
    <meta name="twitter:image" content="https://yourdomain.com/icons/twitter_card_1200x675.png">
</head>
```

### 3. React Component

```jsx
import logo from './assets/logo/shelfquest_logo_master.svg';

export const AppLogo = ({ size = 40, variant = 'master' }) => {
  const logos = {
    master: logo,
    white: './assets/logo/shelfquest_logo_white.svg',
    monochrome: './assets/logo/shelfquest_logo_monochrome.svg'
  };
  
  return (
    <img 
      src={logos[variant]} 
      alt="ShelfQuest" 
      width={size} 
      height={size}
    />
  );
};
```

### 4. CSS Usage

```css
/* Using logo as background */
.logo-header {
  background-image: url('/icons/shelfquest_logo_master.svg');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  width: 200px;
  height: 50px;
}

/* Dark theme variant */
@media (prefers-color-scheme: dark) {
  .logo-header {
    background-image: url('/icons/shelfquest_logo_white.svg');
  }
}
```

---

## 📱 Platform-Specific Guidelines

### iOS / Apple

**Requirements:**
- App Store: `icon_1024x1024.png`
- Home Screen: `apple-touch-icon.png` (180x180)
- Must be square with no transparency
- Use full color version

**Meta Tags:**
```html
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="ShelfQuest">
```

### Android / Google Play

**Requirements:**
- Play Store: `icon_512x512.png`
- Adaptive Icon: `icon_maskable_512x512.png`
- Must have safe zone for adaptive icons

**Manifest Configuration:**
```json
{
  "icons": [
    {
      "src": "/icons/icon_512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon_maskable_512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### Progressive Web App (PWA)

**Requirements:**
- `manifest.json` configured
- Icons from 72x72 to 512x512
- Maskable icon for Android

**Testing:**
```bash
# Use Chrome DevTools
1. Open DevTools > Application > Manifest
2. Check "Icons" section
3. Verify all sizes load correctly
```

### Web Browsers

**Favicon Requirements:**
- `favicon.ico` - Legacy support
- `favicon_16x16.png` - Standard
- `favicon_32x32.png` - Retina displays

---

## 🎨 Color Palette & Usage

### Brand Colors (Material Design 3)

```css
:root {
  /* Primary Colors */
  --brand-primary: #5e0085;          /* Main purple */
  --brand-primary-light: #c952ff;    /* Light purple (dark theme) */
  --brand-primary-container: #e5b3ff; /* Backgrounds */
  
  /* Secondary Colors */
  --brand-secondary: #625d66;        /* Gray-purple */
  --brand-tertiary: #7d525f;         /* Rose-purple */
  
  /* Accent */
  --brand-gold: #FFD700;             /* Achievement stars */
  
  /* Surface Colors */
  --surface-light: #fffbfe;          /* Light background */
  --surface-dark: #1c1b1f;           /* Dark background */
}
```

### When to Use Each Version

**Full Color (`master.svg`):**
- Primary app icon
- Light backgrounds
- Standard usage
- Marketing materials

**Monochrome (`monochrome.svg`):**
- Print materials (black & white)
- Watermarks
- Letterhead
- Business cards

**White (`white.svg`):**
- Dark backgrounds
- Dark theme UI
- Hero sections with dark backgrounds
- Footer sections

**Horizontal (`horizontal.svg`):**
- Website header/navbar
- Email signatures
- Horizontal banners
- Wide format spaces

**Stacked (`stacked.svg`):**
- Square social profiles
- App store listings
- Vertical banners
- Mobile screens

---

## ✅ Testing Checklist

### Browser Testing
- [ ] Favicon appears in browser tab (Chrome, Firefox, Safari, Edge)
- [ ] SVG renders correctly at all sizes
- [ ] Colors match brand guidelines
- [ ] Works in light and dark themes

### Mobile Testing
- [ ] Add to home screen (iOS Safari)
- [ ] Add to home screen (Android Chrome)
- [ ] Icon appears correctly on home screen
- [ ] Splash screen uses correct icon
- [ ] PWA installs correctly

### Social Media Testing
- [ ] Open Graph preview (Facebook Sharing Debugger)
- [ ] Twitter Card preview (Twitter Card Validator)
- [ ] LinkedIn post preview
- [ ] Discord embed preview

### App Store Testing
- [ ] Upload 1024x1024 icon to App Store Connect
- [ ] Upload 512x512 icon to Google Play Console
- [ ] Preview in both stores
- [ ] Check for any scaling issues

---

## 📐 Usage Guidelines

### Minimum Sizes
- **Web/Digital:** 32x32px minimum
- **Print:** 0.5 inch minimum
- **App Icon:** 48x48px minimum (Material Design 3 touch target)

### Clear Space
- Maintain clear space equal to the height of the "S" in ShelfQuest
- No text or visual elements within clear space
- Minimum 20% padding on all sides

### Don'ts
- ❌ Don't distort or stretch the logo
- ❌ Don't change the colors (except approved variants)
- ❌ Don't add effects (drop shadow, glow, etc.)
- ❌ Don't rotate the logo
- ❌ Don't place on busy backgrounds without container
- ❌ Don't recreate or modify the logo

### Do's
- ✅ Use provided SVG files when possible
- ✅ Maintain aspect ratio when scaling
- ✅ Use appropriate variant for context
- ✅ Ensure sufficient contrast with background
- ✅ Use high-resolution versions for large formats

---

## 🔧 Technical Specifications

### File Formats

**SVG (Preferred):**
- Infinitely scalable
- Small file size
- Editable
- Perfect for web

**PNG:**
- Transparency support
- Universal compatibility
- Required for app stores
- Good for social media

**ICO:**
- Legacy browser support
- Multi-size container
- Required for older IE

### Optimization

All PNG files are optimized for web:
- Compressed without quality loss
- Transparent backgrounds where appropriate
- Correct color profile (sRGB)
- 72 DPI for web, 300 DPI for print available on request

---

## 📱 App Store Submission

### Apple App Store

**Icon Requirements:**
1. Size: 1024x1024 pixels
2. Format: PNG
3. Color space: sRGB or P3
4. No alpha channel (no transparency)
5. File: `icon_1024x1024.png`

**Submission Steps:**
1. Log into App Store Connect
2. Navigate to your app
3. Go to "App Information"
4. Upload `icon_1024x1024.png` as App Icon
5. Save changes

### Google Play Store

**Icon Requirements:**
1. Size: 512x512 pixels
2. Format: PNG
3. 32-bit PNG with alpha
4. File: `icon_512x512.png`

**Submission Steps:**
1. Log into Google Play Console
2. Navigate to your app
3. Go to "Store presence" > "Main store listing"
4. Upload `icon_512x512.png` as App Icon
5. Upload screenshots and other assets
6. Save changes

---

## 🎯 Marketing & Social Media

### Social Media Profile Images

**Recommended sizes:**
- Twitter: 400x400 (use `icon_512x512.png` resized)
- Facebook: 180x180 (use `icon_192x192.png`)
- Instagram: 320x320 (use `icon_512x512.png` resized)
- LinkedIn: 300x300 (use `icon_512x512.png` resized)

### Social Sharing

**Open Graph (Facebook, LinkedIn):**
```html
<meta property="og:image" content="https://yourdomain.com/icons/og_image_1200x630.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
```

**Twitter Card:**
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://yourdomain.com/icons/twitter_card_1200x675.png">
```

### Email Signatures

Use the horizontal logo at 200px width:
```html
<img src="https://yourdomain.com/icons/shelfquest_logo_horizontal.svg" 
     alt="ShelfQuest" 
     width="200" 
     height="50">
```

---

## 🆘 Troubleshooting

### Logo Not Appearing

**Check:**
1. File path is correct
2. File permissions allow reading
3. CORS headers if serving from CDN
4. Browser cache (try hard refresh)

### Blurry on Retina Displays

**Solution:**
- Use SVG format when possible
- For PNG, use 2x or 3x size
- Ensure proper viewport meta tag

### Wrong Colors

**Check:**
1. Using correct file variant
2. Color profile is sRGB
3. No CSS filters applied
4. Dark mode overrides working correctly

### PWA Icon Not Showing

**Check:**
1. manifest.json is correctly linked
2. All icon sizes specified
3. Files actually exist at specified paths
4. HTTPS (required for PWA)
5. Service worker registered

---

## 📞 Support & Resources

### Design Files
- All source SVGs included in this package
- Editable in Figma, Adobe Illustrator, or Inkscape
- Original design tokens from Material Design 3

### Documentation
- [Material Design 3 Guidelines](https://m3.material.io/)
- [PWA Icon Requirements](https://web.dev/add-manifest/)
- [App Store Assets](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Play Store Assets](https://developer.android.com/google-play/resources/icon-design-specifications)

### Questions?
For questions about logo usage or additional formats needed, refer to the implementation guide HTML file included in this package.

---

## 📄 License & Usage Rights

This logo package is created specifically for the ShelfQuest application. Usage should be limited to:

✅ Official ShelfQuest app and website
✅ Marketing materials for ShelfQuest
✅ Social media accounts representing ShelfQuest
✅ Press kits and media inquiries about ShelfQuest

❌ Do not use for unrelated projects
❌ Do not resell or redistribute
❌ Do not modify without permission

---

## 🎉 You're All Set!

Everything you need to implement the ShelfQuest brand is included in this package. Start with the quick start guide above, and refer to this README for detailed implementation instructions.

**Key Files to Start With:**
1. `shelfquest_logo_master.svg` - Your primary logo
2. `manifest.json` - PWA configuration
3. `favicon.ico` - Browser icon
4. `logo_implementation_guide.html` - Interactive guide

**Happy Building! 📚✨**
