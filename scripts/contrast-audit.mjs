/**
 * WCAG 2.1 AA Contrast Ratio Audit for ShelfQuest Themes
 *
 * Checks all 6 themes (light + dark) for:
 * - Primary on primary-container (and reverse)
 * - On-surface on surface variants
 * - On-background on background
 * - Error colors
 * - Outline on surface
 *
 * WCAG AA requires:
 * - 4.5:1 for normal text
 * - 3:1 for large text (18px+ or 14px+ bold)
 */

// Parse hex color to RGB
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Calculate relative luminance per WCAG 2.1
function luminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio
function contrastRatio(hex1, hex2) {
  const l1 = luminance(hexToRgb(hex1));
  const l2 = luminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// All 6 themes × 2 modes = 12 variants
const themes = {
  'classic-light': {
    primary: '#0D74A0', onPrimary: '#ffffff',
    primaryContainer: '#d4e9f7', onPrimaryContainer: '#001f2a',
    secondary: '#077d9a', onSecondary: '#ffffff',
    background: '#fcfcff', onBackground: '#1a1c1e',
    surface: '#fcfcff', onSurface: '#1a1c1e',
    surfaceVariant: '#dde3ea', onSurfaceVariant: '#41484d',
    surfaceContainerLow: '#f6f9fc',
    surfaceContainerHigh: '#eaeef1',
    error: '#ba1a1a', onError: '#ffffff',
    errorContainer: '#ffdad6', onErrorContainer: '#410002',
    outline: '#666d73', outlineVariant: '#c1c7ce',
  },
  'classic-dark': {
    primary: '#9cd0ed', onPrimary: '#003547',
    primaryContainer: '#004d66', onPrimaryContainer: '#d4e9f7',
    secondary: '#67e8f9', onSecondary: '#083344',
    background: '#1a1c1e', onBackground: '#e2e2e5',
    surface: '#1a1c1e', onSurface: '#e2e2e5',
    surfaceVariant: '#41484d', onSurfaceVariant: '#c1c7ce',
    surfaceContainerLow: '#1a1c1e',
    surfaceContainerHigh: '#282a2c',
    error: '#ffb4ab', onError: '#690005',
    errorContainer: '#93000a', onErrorContainer: '#ffdad6',
    outline: '#8b9198', outlineVariant: '#41484d',
  },
  'warm-sepia-light': {
    primary: '#8b6914', onPrimary: '#ffffff',
    primaryContainer: '#ffedb8', onPrimaryContainer: '#2b1f00',
    secondary: '#9d5d1c', onSecondary: '#ffffff',
    background: '#fffbf5', onBackground: '#1f1b13',
    surface: '#fffbf5', onSurface: '#1f1b13',
    surfaceVariant: '#ede1cf', onSurfaceVariant: '#4c4639',
    surfaceContainerLow: '#fef5ed',
    surfaceContainerHigh: '#f2e9e1',
    error: '#ba1a1a', onError: '#ffffff',
    errorContainer: '#ffdad6', onErrorContainer: '#410002',
    outline: '#6e6758', outlineVariant: '#d0c5b4',
  },
  'warm-sepia-dark': {
    primary: '#f3d184', onPrimary: '#482f00',
    primaryContainer: '#664800', onPrimaryContainer: '#ffedb8',
    secondary: '#f8bc93', onSecondary: '#502400',
    background: '#1f1b13', onBackground: '#ebe1d2',
    surface: '#1f1b13', onSurface: '#ebe1d2',
    surfaceVariant: '#4c4639', onSurfaceVariant: '#d0c5b4',
    surfaceContainerLow: '#1f1b13',
    surfaceContainerHigh: '#2e2921',
    error: '#ffb4ab', onError: '#690005',
    errorContainer: '#93000a', onErrorContainer: '#ffdad6',
    outline: '#999080', outlineVariant: '#4c4639',
  },
  'ocean-blue-light': {
    primary: '#006497', onPrimary: '#ffffff',
    primaryContainer: '#cae6ff', onPrimaryContainer: '#001e31',
    secondary: '#4f616e', onSecondary: '#ffffff',
    background: '#f6fafe', onBackground: '#181c1f',
    surface: '#f6fafe', onSurface: '#181c1f',
    surfaceVariant: '#dde3ea', onSurfaceVariant: '#41484d',
    surfaceContainerLow: '#f0f4f8',
    surfaceContainerHigh: '#e4e9ed',
    error: '#ba1a1a', onError: '#ffffff',
    errorContainer: '#ffdad6', onErrorContainer: '#410002',
    outline: '#666d73', outlineVariant: '#c1c7ce',
  },
  'ocean-blue-dark': {
    primary: '#8dceff', onPrimary: '#003351',
    primaryContainer: '#004b73', onPrimaryContainer: '#cae6ff',
    secondary: '#b6c9d9', onSecondary: '#21323e',
    background: '#181c1f', onBackground: '#e0e3e6',
    surface: '#181c1f', onSurface: '#e0e3e6',
    surfaceVariant: '#41484d', onSurfaceVariant: '#c1c7ce',
    surfaceContainerLow: '#181c1f',
    surfaceContainerHigh: '#262a2d',
    error: '#ffb4ab', onError: '#690005',
    errorContainer: '#93000a', onErrorContainer: '#ffdad6',
    outline: '#8b9198', outlineVariant: '#41484d',
  },
  'forest-green-light': {
    primary: '#2d6b3f', onPrimary: '#ffffff',
    primaryContainer: '#b4f1ba', onPrimaryContainer: '#00210a',
    secondary: '#52634f', onSecondary: '#ffffff',
    background: '#f7fbf4', onBackground: '#191d18',
    surface: '#f7fbf4', onSurface: '#191d18',
    surfaceVariant: '#dee5d9', onSurfaceVariant: '#424940',
    surfaceContainerLow: '#f1f5ec',
    surfaceContainerHigh: '#e5e9e1',
    error: '#ba1a1a', onError: '#ffffff',
    errorContainer: '#ffdad6', onErrorContainer: '#410002',
    outline: '#676e65', outlineVariant: '#c2c9bd',
  },
  'forest-green-dark': {
    primary: '#99d4a0', onPrimary: '#003917',
    primaryContainer: '#145228', onPrimaryContainer: '#b4f1ba',
    secondary: '#b9ccb4', onSecondary: '#253424',
    background: '#191d18', onBackground: '#e1e4dc',
    surface: '#191d18', onSurface: '#e1e4dc',
    surfaceVariant: '#424940', onSurfaceVariant: '#c2c9bd',
    surfaceContainerLow: '#191d18',
    surfaceContainerHigh: '#272b26',
    error: '#ffb4ab', onError: '#690005',
    errorContainer: '#93000a', onErrorContainer: '#ffdad6',
    outline: '#8c9389', outlineVariant: '#424940',
  },
  'royal-purple-light': {
    primary: '#6e3ab4', onPrimary: '#ffffff',
    primaryContainer: '#ebddff', onPrimaryContainer: '#250059',
    secondary: '#645a70', onSecondary: '#ffffff',
    background: '#fef7ff', onBackground: '#1d1b1e',
    surface: '#fef7ff', onSurface: '#1d1b1e',
    surfaceVariant: '#e7e0eb', onSurfaceVariant: '#49454e',
    surfaceContainerLow: '#f8f1fa',
    surfaceContainerHigh: '#ece5ee',
    error: '#ba1a1a', onError: '#ffffff',
    errorContainer: '#ffdad6', onErrorContainer: '#410002',
    outline: '#6f6a74', outlineVariant: '#cac4cf',
  },
  'royal-purple-dark': {
    primary: '#d3bbff', onPrimary: '#3e0082',
    primaryContainer: '#561b9b', onPrimaryContainer: '#ebddff',
    secondary: '#cec2da', onSecondary: '#342d40',
    background: '#1d1b1e', onBackground: '#e6e1e6',
    surface: '#1d1b1e', onSurface: '#e6e1e6',
    surfaceVariant: '#49454e', onSurfaceVariant: '#cac4cf',
    surfaceContainerLow: '#1d1b1e',
    surfaceContainerHigh: '#2b292c',
    error: '#ffb4ab', onError: '#690005',
    errorContainer: '#93000a', onErrorContainer: '#ffdad6',
    outline: '#948f99', outlineVariant: '#49454e',
  },
  'legendary-gold-light': {
    primary: '#996300', onPrimary: '#ffffff',
    primaryContainer: '#ffddb5', onPrimaryContainer: '#321e00',
    secondary: '#735a3f', onSecondary: '#ffffff',
    background: '#fffbf7', onBackground: '#1f1b16',
    surface: '#fffbf7', onSurface: '#1f1b16',
    surfaceVariant: '#ede1d0', onSurfaceVariant: '#4d4639',
    surfaceContainerLow: '#fef5ed',
    surfaceContainerHigh: '#f2e9e1',
    error: '#ba1a1a', onError: '#ffffff',
    errorContainer: '#ffdad6', onErrorContainer: '#410002',
    outline: '#74695b', outlineVariant: '#d0c5b4',
  },
  'legendary-gold-dark': {
    primary: '#ffba4d', onPrimary: '#523400',
    primaryContainer: '#744900', onPrimaryContainer: '#ffddb5',
    secondary: '#e2c19e', onSecondary: '#422c17',
    background: '#1f1b16', onBackground: '#ebe1d9',
    surface: '#1f1b16', onSurface: '#ebe1d9',
    surfaceVariant: '#4d4639', onSurfaceVariant: '#d0c5b4',
    surfaceContainerLow: '#1f1b16',
    surfaceContainerHigh: '#2e2a24',
    error: '#ffb4ab', onError: '#690005',
    errorContainer: '#93000a', onErrorContainer: '#ffdad6',
    outline: '#999080', outlineVariant: '#4d4639',
  },
};

// Critical color pairs to check
const pairs = [
  ['onPrimary', 'primary', 'Text on primary button'],
  ['onPrimaryContainer', 'primaryContainer', 'Text on primary container'],
  ['primary', 'surface', 'Primary text on surface'],
  ['primary', 'surfaceContainerLow', 'Primary text on surface-container-low'],
  ['primary', 'surfaceContainerHigh', 'Primary text on surface-container-high'],
  ['onSecondary', 'secondary', 'Text on secondary'],
  ['onSurface', 'surface', 'Body text on surface'],
  ['onSurface', 'surfaceContainerHigh', 'Body text on surface-container-high'],
  ['onSurfaceVariant', 'surface', 'Muted text on surface'],
  ['onSurfaceVariant', 'surfaceVariant', 'Muted text on surface-variant'],
  ['onBackground', 'background', 'Body text on background'],
  ['onError', 'error', 'Text on error'],
  ['onErrorContainer', 'errorContainer', 'Text on error container'],
  ['outline', 'surface', 'Outline on surface (borders/icons)'],
];

const AA_NORMAL = 4.5;
const AA_LARGE = 3.0;

let totalChecks = 0;
let failures = 0;
let warnings = 0;

console.log('=== ShelfQuest WCAG 2.1 AA Contrast Audit ===\n');

for (const [themeName, colors] of Object.entries(themes)) {
  const issues = [];

  for (const [fgKey, bgKey, label] of pairs) {
    const fg = colors[fgKey];
    const bg = colors[bgKey];
    if (!fg || !bg) continue;

    const ratio = contrastRatio(fg, bg);
    totalChecks++;

    if (ratio < AA_LARGE) {
      issues.push({ label, fg, bg, fgKey, bgKey, ratio, level: 'FAIL' });
      failures++;
    } else if (ratio < AA_NORMAL) {
      issues.push({ label, fg, bg, fgKey, bgKey, ratio, level: 'WARN' });
      warnings++;
    }
  }

  if (issues.length > 0) {
    console.log(`--- ${themeName} ---`);
    for (const issue of issues) {
      const tag = issue.level === 'FAIL' ? 'FAIL' : 'WARN';
      console.log(
        `  [${tag}] ${issue.ratio.toFixed(2)}:1  ${issue.label}  (${issue.fgKey} ${issue.fg} on ${issue.bgKey} ${issue.bg})`
      );
    }
    console.log('');
  }
}

console.log('=== Summary ===');
console.log(`Total checks: ${totalChecks}`);
console.log(`Failures (<3:1): ${failures}`);
console.log(`Warnings (3:1-4.5:1, OK for large text only): ${warnings}`);
console.log(`Passes (>=4.5:1): ${totalChecks - failures - warnings}`);

if (failures > 0) {
  console.log('\nFAIL items need immediate fixes — text is unreadable.');
}
if (warnings > 0) {
  console.log('\nWARN items pass for large/bold text but fail for normal body text.');
}
if (failures === 0 && warnings === 0) {
  console.log('\nAll checks pass WCAG 2.1 AA for normal text!');
}
