// ===============================================
// MATERIAL 3 DESIGN TOKENS FOR PERSONAL LIBRARY
// ===============================================
// Place this in: src/design-tokens/material3.js

// Core Color Palette - Based on Material 3 Dynamic Color
export const coreColors = {
  // Primary Palette (Book-themed blues)
  primary: {
    0: '#000000',
    10: '#001848',
    20: '#002f66',
    25: '#003a7a',
    30: '#00458f',
    35: '#0050a4',
    40: '#005cba',
    50: '#2474e5',
    60: '#4f8dff',
    70: '#7aa7ff',
    80: '#a5c2ff',
    90: '#d1ddff',
    95: '#e8eeff',
    98: '#f8f9ff',
    99: '#fdfcff',
    100: '#ffffff'
  },
  
  // Secondary Palette (Reading-themed greens)
  secondary: {
    0: '#000000',
    10: '#0d1f12',
    20: '#223526',
    25: '#2d4030',
    30: '#384c3b',
    35: '#445847',
    40: '#506453',
    50: '#697d6c',
    60: '#839786',
    70: '#9eb2a1',
    80: '#b9cebc',
    90: '#d5ead8',
    95: '#e3f8e6',
    98: '#f0fff2',
    99: '#f7fff8',
    100: '#ffffff'
  },
  
  // Tertiary Palette (Accent oranges for warmth)
  tertiary: {
    0: '#000000',
    10: '#2d1600',
    20: '#4a2800',
    25: '#573000',
    30: '#653900',
    35: '#734200',
    40: '#814c00',
    50: '#9f6100',
    60: '#c07700',
    70: '#e28e00',
    80: '#ffb95a',
    90: '#ffddb3',
    95: '#ffeedb',
    98: '#fff8f2',
    99: '#fffbff',
    100: '#ffffff'
  },
  
  // Neutral Palette
  neutral: {
    0: '#000000',
    4: '#0f0f11',
    6: '#141416',
    10: '#1a1a1c',
    12: '#1e1e20',
    17: '#272729',
    20: '#2f2f31',
    22: '#333335',
    24: '#373739',
    25: '#3a3a3c',
    30: '#46464a',
    35: '#525256',
    40: '#5e5e62',
    50: '#77777a',
    60: '#919094',
    70: '#ababaf',
    80: '#c7c6ca',
    87: '#dddde1',
    90: '#e3e2e6',
    92: '#e9e8ec',
    94: '#efefef',
    95: '#f2f1f5',
    96: '#f5f4f8',
    98: '#faf9fd',
    99: '#fdfcff',
    100: '#ffffff'
  },
  
  // Neutral Variant Palette
  neutralVariant: {
    0: '#000000',
    10: '#16161d',
    20: '#2b2b32',
    25: '#36363d',
    30: '#414148',
    35: '#4d4d54',
    40: '#595960',
    50: '#727279',
    60: '#8c8c93',
    70: '#a6a6ad',
    80: '#c2c1c9',
    90: '#dedde5',
    95: '#eceaf3',
    98: '#f9f7ff',
    99: '#fdfcff',
    100: '#ffffff'
  },
  
  // Error Palette
  error: {
    0: '#000000',
    10: '#410e0b',
    20: '#601410',
    25: '#6f1913',
    30: '#7e1f16',
    35: '#8d251a',
    40: '#9c2b1e',
    50: '#bb3b2a',
    60: '#dc4d38',
    70: '#ff6750',
    80: '#ff897d',
    90: '#ffdad6',
    95: '#ffedea',
    98: '#fff8f7',
    99: '#fffbff',
    100: '#ffffff'
  }
};

// ===============================================
// SEMANTIC COLOR TOKENS
// ===============================================

export const lightThemeColors = {
  // Primary
  primary: coreColors.primary[40],
  onPrimary: coreColors.primary[100],
  primaryContainer: coreColors.primary[90],
  onPrimaryContainer: coreColors.primary[10],
  
  // Secondary
  secondary: coreColors.secondary[40],
  onSecondary: coreColors.secondary[100],
  secondaryContainer: coreColors.secondary[90],
  onSecondaryContainer: coreColors.secondary[10],
  
  // Tertiary
  tertiary: coreColors.tertiary[40],
  onTertiary: coreColors.tertiary[100],
  tertiaryContainer: coreColors.tertiary[90],
  onTertiaryContainer: coreColors.tertiary[10],
  
  // Error
  error: coreColors.error[40],
  onError: coreColors.error[100],
  errorContainer: coreColors.error[90],
  onErrorContainer: coreColors.error[10],
  
  // Background
  background: coreColors.neutral[99],
  onBackground: coreColors.neutral[10],
  
  // Surface
  surface: coreColors.neutral[99],
  onSurface: coreColors.neutral[10],
  surfaceVariant: coreColors.neutralVariant[90],
  onSurfaceVariant: coreColors.neutralVariant[30],
  
  // Surface Containers
  surfaceDim: coreColors.neutral[80], // Using 80 instead of non-existent 87
  surfaceBright: coreColors.neutral[98],
  surfaceContainerLowest: coreColors.neutral[100],
  surfaceContainerLow: coreColors.neutral[96],
  surfaceContainer: coreColors.neutral[94],
  surfaceContainerHigh: coreColors.neutral[92],
  surfaceContainerHighest: coreColors.neutral[90],
  
  // Outline
  outline: coreColors.neutralVariant[50],
  outlineVariant: coreColors.neutralVariant[80],
  
  // Others
  shadow: coreColors.neutral[0],
  scrim: coreColors.neutral[0],
  inverseSurface: coreColors.neutral[20],
  inverseOnSurface: coreColors.neutral[95],
  inversePrimary: coreColors.primary[80]
};

export const darkThemeColors = {
  // Primary
  primary: coreColors.primary[80],
  onPrimary: coreColors.primary[20],
  primaryContainer: coreColors.primary[30],
  onPrimaryContainer: coreColors.primary[90],
  
  // Secondary
  secondary: coreColors.secondary[80],
  onSecondary: coreColors.secondary[20],
  secondaryContainer: coreColors.secondary[30],
  onSecondaryContainer: coreColors.secondary[90],
  
  // Tertiary
  tertiary: coreColors.tertiary[80],
  onTertiary: coreColors.tertiary[20],
  tertiaryContainer: coreColors.tertiary[30],
  onTertiaryContainer: coreColors.tertiary[90],
  
  // Error
  error: coreColors.error[80],
  onError: coreColors.error[20],
  errorContainer: coreColors.error[30],
  onErrorContainer: coreColors.error[90],
  
  // Background
  background: coreColors.neutral[10],
  onBackground: coreColors.neutral[90],
  
  // Surface
  surface: coreColors.neutral[10],
  onSurface: coreColors.neutral[90],
  surfaceVariant: coreColors.neutralVariant[30],
  onSurfaceVariant: coreColors.neutralVariant[80],
  
  // Surface Containers
  surfaceDim: coreColors.neutral[6],
  surfaceBright: coreColors.neutral[24],
  surfaceContainerLowest: coreColors.neutral[4],
  surfaceContainerLow: coreColors.neutral[10],
  surfaceContainer: coreColors.neutral[12],
  surfaceContainerHigh: coreColors.neutral[17],
  surfaceContainerHighest: coreColors.neutral[22],
  
  // Outline
  outline: coreColors.neutralVariant[60],
  outlineVariant: coreColors.neutralVariant[30],
  
  // Others
  shadow: coreColors.neutral[0],
  scrim: coreColors.neutral[0],
  inverseSurface: coreColors.neutral[90],
  inverseOnSurface: coreColors.neutral[20],
  inversePrimary: coreColors.primary[40]
};

// ===============================================
// TYPOGRAPHY TOKENS
// ===============================================

export const typography = {
  // Display (Large headings - App title, section headers)
  displayLarge: {
    fontFamily: '"Google Sans", "Inter", system-ui, sans-serif',
    fontSize: '3.5rem', // 56px
    fontWeight: '400',
    lineHeight: '4rem', // 64px
    letterSpacing: '-0.25px'
  },
  displayMedium: {
    fontFamily: '"Google Sans", "Inter", system-ui, sans-serif',
    fontSize: '2.8125rem', // 45px
    fontWeight: '400',
    lineHeight: '3.25rem', // 52px
    letterSpacing: '0'
  },
  displaySmall: {
    fontFamily: '"Google Sans", "Inter", system-ui, sans-serif',
    fontSize: '2.25rem', // 36px
    fontWeight: '400',
    lineHeight: '2.75rem', // 44px
    letterSpacing: '0'
  },
  
  // Headline (Medium headings - Book titles, card headers)
  headlineLarge: {
    fontFamily: '"Google Sans", "Inter", system-ui, sans-serif',
    fontSize: '2rem', // 32px
    fontWeight: '400',
    lineHeight: '2.5rem', // 40px
    letterSpacing: '0'
  },
  headlineMedium: {
    fontFamily: '"Google Sans", "Inter", system-ui, sans-serif',
    fontSize: '1.75rem', // 28px
    fontWeight: '400',
    lineHeight: '2.25rem', // 36px
    letterSpacing: '0'
  },
  headlineSmall: {
    fontFamily: '"Google Sans", "Inter", system-ui, sans-serif',
    fontSize: '1.5rem', // 24px
    fontWeight: '400',
    lineHeight: '2rem', // 32px
    letterSpacing: '0'
  },
  
  // Title (Smaller headings - Author names, section titles)
  titleLarge: {
    fontFamily: '"Google Sans", "Inter", system-ui, sans-serif',
    fontSize: '1.375rem', // 22px
    fontWeight: '400',
    lineHeight: '1.75rem', // 28px
    letterSpacing: '0'
  },
  titleMedium: {
    fontFamily: '"Google Sans", "Inter", system-ui, sans-serif',
    fontSize: '1rem', // 16px
    fontWeight: '500',
    lineHeight: '1.5rem', // 24px
    letterSpacing: '0.15px'
  },
  titleSmall: {
    fontFamily: '"Google Sans", "Inter", system-ui, sans-serif',
    fontSize: '0.875rem', // 14px
    fontWeight: '500',
    lineHeight: '1.25rem', // 20px
    letterSpacing: '0.1px'
  },
  
  // Label (Button text, navigation)
  labelLarge: {
    fontFamily: '"Google Sans", "Inter", system-ui, sans-serif',
    fontSize: '0.875rem', // 14px
    fontWeight: '500',
    lineHeight: '1.25rem', // 20px
    letterSpacing: '0.1px'
  },
  labelMedium: {
    fontFamily: '"Google Sans", "Inter", system-ui, sans-serif',
    fontSize: '0.75rem', // 12px
    fontWeight: '500',
    lineHeight: '1rem', // 16px
    letterSpacing: '0.5px'
  },
  labelSmall: {
    fontFamily: '"Google Sans", "Inter", system-ui, sans-serif',
    fontSize: '0.6875rem', // 11px
    fontWeight: '500',
    lineHeight: '1rem', // 16px
    letterSpacing: '0.5px'
  },
  
  // Body (Reading content, descriptions)
  bodyLarge: {
    fontFamily: '"Inter", system-ui, sans-serif',
    fontSize: '1rem', // 16px
    fontWeight: '400',
    lineHeight: '1.5rem', // 24px
    letterSpacing: '0.5px'
  },
  bodyMedium: {
    fontFamily: '"Inter", system-ui, sans-serif',
    fontSize: '0.875rem', // 14px
    fontWeight: '400',
    lineHeight: '1.25rem', // 20px
    letterSpacing: '0.25px'
  },
  bodySmall: {
    fontFamily: '"Inter", system-ui, sans-serif',
    fontSize: '0.75rem', // 12px
    fontWeight: '400',
    lineHeight: '1rem', // 16px
    letterSpacing: '0.4px'
  }
};

// ===============================================
// ELEVATION TOKENS
// ===============================================

export const elevation = {
  // Level 0 (No elevation)
  level0: {
    boxShadow: 'none'
  },
  
  // Level 1 (Subtle elevation - cards at rest)
  level1: {
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)'
  },
  
  // Level 2 (Medium elevation - hovered cards)
  level2: {
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)'
  },
  
  // Level 3 (High elevation - focused/active elements)
  level3: {
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)'
  },
  
  // Level 4 (Higher elevation - menus, dialogs)
  level4: {
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)'
  },
  
  // Level 5 (Highest elevation - modals, floating elements)
  level5: {
    boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)'
  }
};

// ===============================================
// SHAPE TOKENS
// ===============================================

export const shape = {
  // Corner Radius
  cornerNone: '0px',
  cornerExtraSmall: '4px',    // Small chips, badges
  cornerSmall: '8px',         // Buttons, small cards
  cornerMedium: '12px',       // Standard cards, inputs
  cornerLarge: '16px',        // Large cards, sheets
  cornerExtraLarge: '24px',   // Hero cards, prominent surfaces
  cornerFull: '9999px',       // Pills, circular elements
  
  // Container Shapes for different components
  button: {
    borderRadius: '20px'      // Fully rounded buttons
  },
  card: {
    borderRadius: '12px'      // Standard card corners
  },
  heroCard: {
    borderRadius: '24px'      // Prominent cards
  },
  chip: {
    borderRadius: '8px'       // Status chips
  },
  fab: {
    borderRadius: '16px'      // Floating action button
  }
};

// ===============================================
// MOTION TOKENS
// ===============================================

export const motion = {
  // Duration
  duration: {
    short1: '50ms',           // Very quick state changes
    short2: '100ms',          // Quick state changes
    short3: '150ms',          // Standard hover states
    short4: '200ms',          // Button interactions
    medium1: '250ms',         // Standard transitions
    medium2: '300ms',         // Card animations
    medium3: '350ms',         // Page transitions
    medium4: '400ms',         // Complex animations
    long1: '450ms',           // Large content changes
    long2: '500ms',           // Complex state changes
    long3: '550ms',           // Page loads
    long4: '600ms',           // Heavy animations
    extraLong1: '700ms',      // Special effects
    extraLong2: '800ms',      // Complex transitions
    extraLong3: '900ms',      // Very complex animations
    extraLong4: '1000ms'      // Loading states
  },
  
  // Easing
  easing: {
    // Standard easing curves
    linear: 'cubic-bezier(0, 0, 1, 1)',
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    standardAccelerate: 'cubic-bezier(0.3, 0, 1, 1)',
    standardDecelerate: 'cubic-bezier(0, 0, 0, 1)',
    emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
    emphasizedAccelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
    emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    
    // Legacy naming for easier adoption
    ease: 'cubic-bezier(0.2, 0, 0, 1)',
    easeIn: 'cubic-bezier(0.3, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0, 1)',
    easeInOut: 'cubic-bezier(0.2, 0, 0, 1)'
  }
};

// ===============================================
// SPACING TOKENS
// ===============================================

export const spacing = {
  0: '0px',
  1: '4px',     // Tight spacing
  2: '8px',     // Small spacing
  3: '12px',    // Medium small spacing
  4: '16px',    // Standard spacing
  5: '20px',    // Medium spacing
  6: '24px',    // Large spacing
  7: '28px',    // Extra large spacing
  8: '32px',    // XXL spacing
  9: '36px',    // XXXL spacing
  10: '40px',   // Major spacing
  11: '44px',   // Hero spacing
  12: '48px',   // Section spacing
  14: '56px',   // Large section spacing
  16: '64px',   // Extra large section spacing
  20: '80px',   // Hero section spacing
  24: '96px',   // Page spacing
  28: '112px',  // Major page spacing
  32: '128px',  // Hero page spacing
  36: '144px',  // Extra hero spacing
  40: '160px',  // Maximum spacing
  44: '176px',  // Extended spacing
  48: '192px',  // Extreme spacing
  52: '208px',  // Ultimate spacing
  56: '224px',  // Final spacing
  60: '240px',  // Absolute spacing
  64: '256px'   // Maximum spacing
};

// ===============================================
// COMPONENT-SPECIFIC TOKENS
// ===============================================

export const components = {
  // Book Cards
  bookCard: {
    width: '320px',
    height: '480px',
    borderRadius: shape.cornerExtraLarge,
    elevation: elevation.level1,
    hoverElevation: elevation.level2,
    activeElevation: elevation.level3
  },
  
  // Navigation
  navigation: {
    height: '64px',
    borderRadius: shape.cornerNone,
    elevation: elevation.level0
  },
  
  // Floating Action Button
  fab: {
    width: '56px',
    height: '56px',
    borderRadius: shape.cornerLarge,
    elevation: elevation.level3,
    hoverElevation: elevation.level4
  },
  
  // Reading Progress
  progressBar: {
    height: '4px',
    borderRadius: shape.cornerFull,
    trackColor: lightThemeColors.surfaceVariant,
    fillColor: lightThemeColors.primary
  },
  
  // Status Chips
  statusChip: {
    height: '32px',
    borderRadius: shape.cornerSmall,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2]
  }
};

// ===============================================
// USAGE HELPERS
// ===============================================

// Helper function to create CSS custom properties
export const createCSSCustomProperties = (isDark = false) => {
  console.log('🔧 createCSSCustomProperties: isDark =', isDark);
  const colors = isDark ? darkThemeColors : lightThemeColors;
  
  console.log('🔧 createCSSCustomProperties: Using colors:', {
    primary: colors.primary,
    surface: colors.surface,
    onSurface: colors.onSurface,
    background: colors.background
  });
  
  const properties = {};
  
  // Helper function to convert hex to RGB triplet
  const hexToRgb = (hex) => {
    // Handle null/undefined values
    if (!hex) {
      console.error('🔧 hexToRgb: Invalid hex value:', hex);
      return '0, 0, 0';
    }
    
    // Ensure hex is a string
    const hexString = String(hex);
    
    // Remove # if present and validate format
    const cleanHex = hexString.replace('#', '');
    
    // Check if it's a valid 6-character hex
    if (!/^[a-f0-9]{6}$/i.test(cleanHex)) {
      console.error('🔧 hexToRgb: Invalid hex format:', hex);
      return '0, 0, 0';
    }
    
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
    if (result) {
      const rgb = `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
      console.log(`🔧 hexToRgb: ${hex} -> ${rgb}`);
      return rgb;
    }
    
    console.error('🔧 hexToRgb: Failed to parse hex:', hex);
    return '0, 0, 0';
  };
  
  // Add color properties as RGB triplets
  Object.entries(colors).forEach(([key, value]) => {
    const cssKey = `--md-sys-color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    const rgbValue = hexToRgb(value);
    properties[cssKey] = rgbValue;
    
    // Log a few key properties for debugging
    if (['primary', 'surface', 'onSurface', 'background'].includes(key)) {
      console.log(`🔧 ${cssKey}: ${value} -> ${rgbValue}`);
    }
  });
  
  // Add typography properties
  Object.entries(typography).forEach(([key, styles]) => {
    Object.entries(styles).forEach(([styleKey, styleValue]) => {
      properties[`--md-sys-typescale-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}-${styleKey.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = styleValue;
    });
  });
  
  // Add spacing properties
  Object.entries(spacing).forEach(([key, value]) => {
    properties[`--md-sys-spacing-${key}`] = value;
  });
  
  return properties;
};

// Helper function to get semantic color for JavaScript usage
export const getSemanticColor = (colorName, theme = 'light') => {
  const colors = theme === 'light' ? lightThemeColors : darkThemeColors;
  return colors[colorName] || colors.primary;
};

// Helper function to get elevation shadow
export const getElevation = (level) => {
  return elevation[`level${level}`] || elevation.level0;
};

// Export everything as default for easy importing
export default {
  coreColors,
  lightThemeColors,
  darkThemeColors,
  typography,
  elevation,
  shape,
  motion,
  spacing,
  components,
  createCSSCustomProperties,
  getSemanticColor,
  getElevation
};