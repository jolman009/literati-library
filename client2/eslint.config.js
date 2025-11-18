import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default [
  // Ignore build output and dependencies
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      '*.config.js',
      'vite.config.js'
    ]
  },

  // Base JS config
  js.configs.recommended,

  // React and JSX configuration
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react: react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        WebAssembly: 'readonly'
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Accessibility rules
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',

      // General rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
    }
  },

  // Test files - more lenient rules
  {
    files: ['**/*.test.{js,jsx}', '**/__tests__/**/*.{js,jsx}', '**/tests/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        it: 'readonly'
      }
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off'
    }
  },

  // Worker files and minified files - disable most rules
  {
    files: ['public/**/*.worker.*.js', 'public/**/*.worker.*.mjs', '**/*.min.js', '**/*.min.mjs'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.worker,
        WebAssembly: 'readonly',
        importScripts: 'readonly',
        self: 'readonly'
      }
    },
    rules: {
      // Disable all rules for minified and worker files
      // These are third-party libraries and should not be linted
      'no-console': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-case-declarations': 'off',
      'no-prototype-builtins': 'off',
      'no-empty': 'off',
      'no-control-regex': 'off',
      'getter-return': 'off',
      'no-redeclare': 'off',
      'no-fallthrough': 'off',
      'no-cond-assign': 'off'
    }
  }
];
