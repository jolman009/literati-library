import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect } from 'vitest';

// Import directly to bypass barrel-export mock in setupTests
import MD3TextField from '../MD3TextField';
import TextField from '../TextField';

/**
 * Helper: assert zero axe-core violations.
 * Logs violation details on failure for easy debugging.
 */
function expectNoViolations(results) {
  const violations = results.violations || [];
  if (violations.length > 0) {
    const msgs = violations.map(
      (v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`
    );
    throw new Error(`Expected no a11y violations but found ${violations.length}:\n${msgs.join('\n')}`);
  }
}

describe('MD3TextField a11y', () => {
  it('has no axe violations in normal state', async () => {
    const { container } = render(
      <MD3TextField label="Email" value="" onChange={() => {}} />
    );
    const results = await axe(container);
    expectNoViolations(results);
  });

  it('has no axe violations in error state', async () => {
    const { container } = render(
      <MD3TextField
        label="Email"
        value="bad"
        error
        errorText="Invalid email address"
        onChange={() => {}}
      />
    );
    const results = await axe(container);
    expectNoViolations(results);
  });

  it('has no axe violations with supporting text', async () => {
    const { container } = render(
      <MD3TextField
        label="Username"
        value=""
        supportingText="Must be unique"
        onChange={() => {}}
      />
    );
    const results = await axe(container);
    expectNoViolations(results);
  });

  it('associates label with input via htmlFor/id', () => {
    const { container } = render(
      <MD3TextField label="Name" value="" onChange={() => {}} />
    );
    const input = container.querySelector('input');
    const label = container.querySelector('label');
    expect(input).toBeTruthy();
    expect(label).toBeTruthy();
    expect(label.getAttribute('for')).toBe(input.getAttribute('id'));
  });

  it('sets aria-invalid and aria-describedby in error state', () => {
    const { container } = render(
      <MD3TextField
        label="Email"
        value=""
        error
        errorText="Required field"
        onChange={() => {}}
      />
    );
    const input = container.querySelector('input');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.hasAttribute('aria-describedby')).toBe(true);

    const describedById = input.getAttribute('aria-describedby');
    const errorDiv = container.querySelector(`#${CSS.escape(describedById)}`);
    expect(errorDiv).toBeTruthy();
    expect(errorDiv.getAttribute('role')).toBe('alert');
    expect(errorDiv.textContent).toBe('Required field');
  });
});

describe('TextField a11y', () => {
  it('has no axe violations in normal state', async () => {
    const { container } = render(
      <TextField label="Password" type="password" value="" onChange={() => {}} />
    );
    const results = await axe(container);
    expectNoViolations(results);
  });

  it('has no axe violations in error state', async () => {
    const { container } = render(
      <TextField
        label="Email"
        value=""
        error
        helperText="This field is required"
        onChange={() => {}}
      />
    );
    const results = await axe(container);
    expectNoViolations(results);
  });

  it('associates label with input via htmlFor/id', () => {
    const { container } = render(
      <TextField label="Email" value="" onChange={() => {}} />
    );
    const input = container.querySelector('input');
    const label = container.querySelector('label');
    expect(input).toBeTruthy();
    expect(label).toBeTruthy();
    expect(label.getAttribute('for')).toBe(input.getAttribute('id'));
  });
});

describe('Basic form a11y', () => {
  it('renders an accessible form with labeled fields', async () => {
    const { container } = render(
      <form aria-label="Login form">
        <MD3TextField label="Email" type="email" value="" onChange={() => {}} />
        <MD3TextField label="Password" type="password" value="" onChange={() => {}} />
        <button type="submit">Sign In</button>
      </form>
    );
    const results = await axe(container);
    expectNoViolations(results);
  });
});
