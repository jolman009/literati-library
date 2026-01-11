/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // Allow CSS custom properties (CSS variables)
    'custom-property-empty-line-before': null,

    // Allow vendor prefixes (handled by autoprefixer)
    'property-no-vendor-prefix': null,
    'value-no-vendor-prefix': null,
    'selector-no-vendor-prefix': null,

    // Be lenient with selector naming for component libraries
    'selector-class-pattern': null,
    'selector-id-pattern': null,
    'keyframes-name-pattern': null,
    'custom-property-pattern': null,

    // Allow empty blocks (sometimes used for placeholder styles)
    'block-no-empty': null,

    // Allow duplicate selectors (common in component CSS)
    'no-duplicate-selectors': null,

    // Allow unknown at-rules (for CSS-in-JS, Tailwind, etc.)
    'at-rule-no-unknown': [true, {
      ignoreAtRules: ['tailwind', 'apply', 'variants', 'responsive', 'screen', 'layer']
    }],

    // Allow unknown pseudo-classes (for browser-specific ones)
    'selector-pseudo-class-no-unknown': [true, {
      ignorePseudoClasses: ['global', 'local', 'deep']
    }],

    // Formatting rules - be lenient
    'declaration-empty-line-before': null,
    'rule-empty-line-before': null,
    'comment-empty-line-before': null,

    // Allow important (sometimes necessary for overrides)
    'declaration-no-important': null,

    // Font family should have generic fallback
    'font-family-no-missing-generic-family-keyword': null,

    // Allow color functions with legacy syntax
    'color-function-notation': null,
    'alpha-value-notation': null,

    // Allow shorthand overrides
    'declaration-block-no-shorthand-property-overrides': null,

    // Length units - be lenient
    'length-zero-no-unit': null,

    // Allow calc with operator spacing variations
    'function-calc-no-unspaced-operator': null,

    // Allow legacy color notations (rgba, hsla)
    'color-function-notation': null,
    'import-notation': null,

    // Allow rgba/hsla aliases
    'color-function-alias-notation': null,

    // Allow traditional media query syntax
    'media-feature-range-notation': null,

    // Allow hsl/hwb without modern notation
    'hue-degree-notation': null,

    // Allow number instead of named values (like font-weight: 700)
    'font-weight-notation': null,

    // Allow any number format
    'number-max-precision': null,

    // Allow descending specificity (common in component CSS with theme variants)
    'no-descending-specificity': null,

    // Allow both hex lengths (#fff and #ffffff)
    'color-hex-length': null,

    // Allow redundant shorthand values (e.g., 0 0 4px 0)
    'shorthand-property-no-redundant-values': null,

    // Allow redundant longhand properties
    'declaration-block-no-redundant-longhand-properties': null,

    // Allow multiple declarations on single line
    'declaration-block-single-line-max-declarations': null,

    // Allow duplicate properties (sometimes used for fallbacks)
    'declaration-block-no-duplicate-properties': null,

    // Allow keyframe selectors in any notation (from/to or 0%/100%)
    'keyframe-selector-notation': null,

    // Allow currentColor case variations
    'value-keyword-case': null,

    // Allow unknown media feature values (for experimental features)
    'media-feature-name-value-no-unknown': null,

    // Allow simple :not() notation
    'selector-not-notation': null,

    // Allow deprecated properties for browser compatibility (clip, word-wrap, etc.)
    'property-no-deprecated': null,

    // Allow deprecated property values (break-word for word-break, etc.)
    'declaration-property-value-keyword-no-deprecated': null,
  },
  ignoreFiles: [
    'node_modules/**',
    'dist/**',
    'build/**',
    '**/*.min.css'
  ]
};
