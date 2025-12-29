# Testing Infrastructure Guide

This document provides a comprehensive guide to the testing infrastructure for the ShelfQuest application.

## Overview

The ShelfQuest application uses a multi-layered testing approach:

- **Unit Tests**: Testing individual components and functions in isolation
- **Integration Tests**: Testing interactions between components and services
- **End-to-End (E2E) Tests**: Testing complete user workflows
- **Security Tests**: Testing for vulnerabilities and security issues
- **Performance Tests**: Testing application performance and optimization

## Technology Stack

### Client Testing (React)
- **Framework**: Vitest (faster alternative to Jest)
- **Testing Library**: React Testing Library
- **Coverage**: Built-in Vitest coverage
- **E2E**: Playwright

### Server Testing (Express)
- **Framework**: Jest
- **API Testing**: Supertest
- **Mocking**: Jest mocks for Supabase and external services
- **Coverage**: Jest coverage

### AI Service Testing (FastAPI)
- **Framework**: pytest
- **Async Testing**: pytest-asyncio
- **Coverage**: pytest-cov
- **HTTP Testing**: httpx AsyncClient

## Project Structure

```
my-library-app-2/
├── client2/
│   ├── src/
│   │   ├── components/
│   │   │   └── **/*.test.jsx
│   │   ├── contexts/
│   │   │   └── **/*.test.jsx
│   │   ├── setupTests.js
│   │   └── test-utils.jsx
│   ├── tests/
│   │   └── e2e/
│   │       ├── auth.spec.js
│   │       ├── fixtures.js
│   │       ├── global-setup.js
│   │       └── global-teardown.js
│   ├── vitest.config.js
│   ├── vitest.workspace.js
│   ├── playwright.config.js
│   └── .env.test
├── server2/
│   ├── src/
│   │   ├── routes/
│   │   │   └── **/*.test.js
│   │   ├── setupTests.js
│   │   └── test-utils.js
│   ├── jest.config.js
│   └── .env.test
├── ai-service/
│   ├── tests/
│   │   └── test_main.py
│   ├── conftest.py
│   ├── pytest.ini
│   ├── requirements-test.txt
│   └── .env.test
└── .github/
    └── workflows/
        └── test.yml
```

## Running Tests

### Client Tests

```bash
cd client2

# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run E2E tests with browser UI
pnpm test:e2e:headed

# Run all tests (unit + E2E)
pnpm test:all
```

### Server Tests

```bash
cd server2

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests verbosely
pnpm test:verbose

# Run tests silently
pnpm test:silent
```

### AI Service Tests

```bash
cd ai-service

# Install test dependencies
pip install -r requirements-test.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=src

# Run specific test file
pytest tests/test_main.py

# Run tests matching pattern
pytest -k "test_summarize"

# Run tests with different markers
pytest -m "unit"
pytest -m "integration"
pytest -m "not slow"
```

## Test Categories and Patterns

### Unit Tests

Unit tests focus on testing individual components in isolation.

**Client Unit Test Example:**
```javascript
// src/components/Material3/MD3Button.test.jsx
import { describe, test, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders, cleanupTest } from '../../test-utils'
import MD3Button from './MD3Button'

describe('MD3Button Component', () => {
  beforeEach(() => {
    cleanupTest()
  })

  test('renders button with correct text', () => {
    renderWithProviders(<MD3Button>Click me</MD3Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  test('handles click events', () => {
    const handleClick = vi.fn()
    renderWithProviders(<MD3Button onClick={handleClick}>Click me</MD3Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

**Server Unit Test Example:**
```javascript
// src/routes/secureAuth.test.js
import request from 'supertest'
import { createTestApp, createTestUser, expectSuccessResponse } from '../test-utils.js'

describe('POST /auth/login', () => {
  test('should login with valid credentials', async () => {
    const app = createTestApp()
    const mockUser = createTestUser()

    // Mock Supabase response
    mockSupabaseSelect(mockUser)

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' })

    expectSuccessResponse(response)
    expect(response.body).toHaveProperty('token')
  })
})
```

### Integration Tests

Integration tests verify that multiple components work together correctly.

**Context Integration Test:**
```javascript
// src/contexts/AuthContext.test.jsx
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

describe('AuthContext Integration', () => {
  test('should handle complete login flow', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
    })

    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toBeTruthy()
  })
})
```

### End-to-End Tests

E2E tests simulate real user interactions across the entire application.

**Authentication E2E Test:**
```javascript
// tests/e2e/auth.spec.js
import { test, expect } from './fixtures.js'

test('should complete full registration and login flow', async ({ page }) => {
  // Register
  await page.goto('/register')
  await page.fill('[data-testid="email-input"]', 'newuser@example.com')
  await page.fill('[data-testid="password-input"]', 'SecurePass123!')
  await page.click('[data-testid="register-button"]')

  // Should redirect to dashboard
  await expect(page).toHaveURL('/dashboard')

  // Logout
  await page.click('[data-testid="logout-button"]')

  // Login again
  await page.goto('/login')
  await page.fill('[data-testid="email-input"]', 'newuser@example.com')
  await page.fill('[data-testid="password-input"]', 'SecurePass123!')
  await page.click('[data-testid="login-button"]')

  await expect(page).toHaveURL('/dashboard')
})
```

## Test Utilities and Helpers

### Client Test Utilities

The `test-utils.jsx` file provides:

- **Mock Context Providers**: Pre-configured providers for testing
- **Custom Render Functions**: Render components with necessary providers
- **Test Data Factories**: Generate consistent test data
- **Mock Functions**: Mock external dependencies

```javascript
// Example usage
import { renderWithAuth, createTestBook } from '../test-utils'

const testBook = createTestBook({ title: 'My Test Book' })
renderWithAuth(<BookCard book={testBook} />, { isAuthenticated: true })
```

### Server Test Utilities

The `test-utils.js` file provides:

- **Request Helpers**: Authenticated and unauthenticated request helpers
- **Mock Data Factories**: Generate test data for all entities
- **Assertion Helpers**: Common assertion patterns
- **Security Test Helpers**: SQL injection and XSS testing utilities

```javascript
// Example usage
import { makeAuthenticatedRequest, createTestBook } from '../test-utils.js'

const token = createTestToken()
const response = await makeAuthenticatedRequest(app, 'get', '/books', token)
```

### AI Service Test Utilities

The `conftest.py` file provides:

- **Fixture Definitions**: Reusable test fixtures
- **Mock Configurations**: Mock external AI services
- **Test Data**: Sample texts and expected responses

```python
# Example usage
def test_summarize_success(test_client, mock_gemini_client, sample_note_text):
    response = test_client.post('/summarize-note', json={'text': sample_note_text})
    assert response.status_code == 200
```

## Coverage Requirements

### Coverage Thresholds

- **Client**: 70% overall, 80% for Material3 components, 85% for contexts
- **Server**: 70% overall
- **AI Service**: 70% overall

### Coverage Reports

Coverage reports are generated in multiple formats:
- **HTML**: Interactive coverage report
- **LCOV**: For integration with IDEs and CI/CD
- **JSON**: For programmatic analysis
- **Terminal**: Quick overview during development

## Continuous Integration

### GitHub Actions Workflow

The CI/CD pipeline includes:

1. **Parallel Test Execution**: Client, server, and AI service tests run in parallel
2. **Cross-Service Integration**: E2E tests verify full-stack functionality
3. **Security Scanning**: Dependency vulnerability checks and code analysis
4. **Performance Testing**: Lighthouse CI for client performance
5. **Coverage Reporting**: Automatic coverage upload to Codecov

### Test Environment Setup

Each service has dedicated test environment configuration:
- Mock databases and external services
- Reduced security restrictions for testing
- Test-specific feature flags
- Isolated test data

## Security Testing

### Automated Security Tests

- **Dependency Scanning**: Trivy and npm/pnpm audit
- **Static Analysis**: ESLint security rules
- **Input Validation**: XSS and SQL injection testing
- **Authentication Testing**: JWT security and session management

### Manual Security Testing

Regular security reviews should include:
- Authentication bypass attempts
- Authorization boundary testing
- Input sanitization verification
- Rate limiting validation

## Performance Testing

### Client Performance

- **Lighthouse CI**: Automated performance auditing
- **Bundle Analysis**: Webpack bundle analyzer
- **Core Web Vitals**: LCP, FID, CLS monitoring
- **Loading Performance**: Time to interactive measurements

### Server Performance

- **Load Testing**: API endpoint stress testing
- **Database Performance**: Query optimization verification
- **Memory Usage**: Memory leak detection
- **Response Time**: API response time benchmarks

## Best Practices

### Writing Tests

1. **Descriptive Names**: Test names should clearly describe what is being tested
2. **AAA Pattern**: Arrange, Act, Assert structure
3. **Single Responsibility**: One assertion per test when possible
4. **Test Data**: Use factories for consistent test data
5. **Mocking**: Mock external dependencies, not internal logic

### Test Organization

1. **Colocated Tests**: Keep tests close to the code they test
2. **Logical Grouping**: Use describe blocks to group related tests
3. **Setup/Teardown**: Use beforeEach/afterEach for test isolation
4. **Shared Utilities**: Extract common patterns to utilities

### Performance Considerations

1. **Parallel Execution**: Run independent tests in parallel
2. **Test Isolation**: Ensure tests don't depend on each other
3. **Mock Heavy Operations**: Mock database calls and external APIs
4. **Selective Testing**: Use test filters for faster feedback loops

## Debugging Tests

### Client Tests

```bash
# Debug specific test
pnpm test:watch --reporter=verbose MyComponent.test.jsx

# Debug with browser devtools
pnpm test:watch --inspect-brk
```

### Server Tests

```bash
# Debug with Node inspector
pnpm test:verbose --inspect-brk

# Run single test file
pnpm test auth.test.js
```

### E2E Tests

```bash
# Debug with browser UI
pnpm test:e2e:debug

# Run specific test
pnpm test:e2e auth.spec.js

# Debug with headed mode
pnpm test:e2e:headed
```

## Troubleshooting

### Common Issues

1. **Test Timeouts**: Increase timeout for async operations
2. **Mock Issues**: Ensure mocks are properly reset between tests
3. **Environment Variables**: Verify test environment configuration
4. **Database State**: Ensure proper test data cleanup

### Performance Issues

1. **Slow Tests**: Profile and optimize heavy test operations
2. **Memory Leaks**: Use heap snapshots to identify leaks
3. **Coverage Collection**: Disable coverage for faster test runs during development

## Monitoring and Reporting

### Test Results

- **GitHub Actions**: Automated test result reporting
- **Codecov**: Coverage tracking and trends
- **Test Artifacts**: Screenshots, videos, and logs for debugging

### Metrics Tracking

- **Test Execution Time**: Track and optimize slow tests
- **Coverage Trends**: Monitor coverage changes over time
- **Flaky Test Detection**: Identify and fix unreliable tests

## Contributing

When adding new features:

1. **Write Tests First**: TDD approach when possible
2. **Maintain Coverage**: Ensure new code is adequately tested
3. **Update Documentation**: Keep test documentation current
4. **Review Test Quality**: Focus on test maintainability and clarity

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [pytest Documentation](https://docs.pytest.org/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)