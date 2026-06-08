import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Auth test-id contract guard.
 *
 * WHY THIS EXISTS
 * ---------------
 * The Playwright E2E auth suite (tests/e2e/auth.spec.js) drives the app through
 * `data-testid` hooks and a handful of routes. That suite runs in a NON-BLOCKING
 * CI job (it needs a live database), so when the login/signup pages were rebuilt
 * as "V2" components, several test IDs and a route silently disappeared without
 * turning anything red — and the breakage was only noticed much later.
 *
 * This test pins the *contract* between the components and the E2E suite, and it
 * runs in the BLOCKING unit-test job (vitest). If a future rewrite drops one of
 * these hooks, this fails immediately on the PR with a precise message, instead
 * of leaking into a non-blocking E2E run nobody watches.
 *
 * It is intentionally a cheap source-level check (no React rendering, no provider
 * mocks) so it stays green for refactors that change internals but keep the
 * contract — and red only when the contract itself is broken.
 *
 * If you intentionally rename a hook, update BOTH this file and
 * tests/e2e/auth.spec.js in the same change.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..', '..'); // src/__tests__ -> client2

const read = (relativePath) => {
  const abs = path.resolve(clientRoot, relativePath);
  return readFileSync(abs, 'utf8');
};

const testId = (id) => `data-testid="${id}"`;

// file -> the literal source fragments that MUST be present
const CONTRACT = {
  'src/pages/LoginV2.jsx': [
    testId('login-form'),
    testId('email-input'),
    testId('password-input'),
    testId('login-button'),
    testId('login-error'),
    testId('rate-limit-error'),
    testId('forgot-password-link'),
  ],
  'src/pages/SignUpV2.jsx': [
    testId('register-form'),
    testId('name-input'),
    testId('email-input'),
    testId('password-input'),
    testId('confirm-password-input'),
    testId('register-button'),
    testId('name-error'),
    testId('email-error'),
    testId('password-error'),
    testId('tos-checkbox'),
  ],
  'src/pages/NewLandingPage.jsx': [
    testId('landing-hero'),
    testId('get-started-button'),
    testId('login-link'),
    testId('register-link'),
    // The register CTA must land on /register (the route auth.spec.js asserts).
    "navigate('/register')",
  ],
  'src/pages/RequestPasswordReset.jsx': [
    testId('email-input'),
    testId('reset-password-button'),
    testId('reset-success'),
  ],
  'src/components/navigation/PremiumHeader.jsx': [
    testId('user-menu'),
    testId('logout-button'),
  ],
  'src/pages/DashboardPage.jsx': [
    testId('welcome-message'),
  ],
  'src/App.jsx': [
    'path="/login"',
    'path="/register"',
    'path="/forgot-password"',
  ],
};

describe('auth E2E test-id contract', () => {
  for (const [file, fragments] of Object.entries(CONTRACT)) {
    describe(file, () => {
      const source = read(file);
      for (const fragment of fragments) {
        it(`contains \`${fragment}\``, () => {
          expect(
            source,
            `Missing required E2E hook \`${fragment}\` in ${file}. ` +
              `If this was renamed on purpose, update tests/e2e/auth.spec.js and this contract together.`
          ).toContain(fragment);
        });
      }
    });
  }

  it('forgot-password page reports success with text the E2E suite matches (/reset link sent/i)', () => {
    const source = read('src/pages/RequestPasswordReset.jsx');
    expect(/reset link sent/i.test(source)).toBe(true);
  });
});
