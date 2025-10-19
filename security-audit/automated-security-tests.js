#!/usr/bin/env node

/**
 * Automated Security Testing Suite for ShelfQuest
 * Comprehensive security tests covering authentication, authorization, and data validation
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  vulnerabilities: [],
  timestamp: new Date().toISOString()
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

/**
 * Test utilities
 */
class SecurityTester {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      timeout: 10000,
      validateStatus: () => true // Don't throw on any status code
    });
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logTest(testName, status, details = '') {
    const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
    this.log(`[${status}] ${testName}`, statusColor);
    if (details) {
      this.log(`    ${details}`, 'blue');
    }

    if (status === 'PASS') testResults.passed++;
    else if (status === 'FAIL') testResults.failed++;
    else testResults.skipped++;
  }

  addVulnerability(severity, description, endpoint, payload = null) {
    testResults.vulnerabilities.push({
      severity,
      description,
      endpoint,
      payload,
      timestamp: new Date().toISOString()
    });
  }

  async testConnection() {
    this.log('\n🔗 Testing Server Connection...', 'bold');
    try {
      const response = await this.client.get('/health');
      if (response.status === 200) {
        this.logTest('Server Connection', 'PASS', 'Server is accessible');
        return true;
      } else {
        this.logTest('Server Connection', 'FAIL', `Unexpected status: ${response.status}`);
        return false;
      }
    } catch (error) {
      this.logTest('Server Connection', 'FAIL', `Connection failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Authentication Security Tests
   */
  async testAuthenticationSecurity() {
    this.log('\n🔐 Testing Authentication Security...', 'bold');

    // Test 1: SQL Injection in Login
    await this.testSQLInjectionLogin();

    // Test 2: Weak Password Acceptance
    await this.testWeakPasswordAcceptance();

    // Test 3: JWT Token Validation
    await this.testJWTTokenValidation();

    // Test 4: Brute Force Protection
    await this.testBruteForceProtection();

    // Test 5: Session Management
    await this.testSessionManagement();
  }

  async testSQLInjectionLogin() {
    const sqlPayloads = [
      "admin'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; SELECT * FROM users; --",
      "admin'/**/OR/**/1=1#"
    ];

    let vulnerable = false;
    for (const payload of sqlPayloads) {
      try {
        const response = await this.client.post('/auth/login', {
          email: payload,
          password: 'anypassword'
        });

        // Check if injection was successful (unexpected success or error patterns)
        if (response.status === 200 && response.data.token) {
          this.addVulnerability('CRITICAL', 'SQL Injection in login endpoint', '/auth/login', payload);
          vulnerable = true;
        }
      } catch (error) {
        // This is expected for invalid credentials
      }
    }

    this.logTest('SQL Injection Protection (Login)', vulnerable ? 'FAIL' : 'PASS',
      vulnerable ? 'Vulnerable to SQL injection' : 'Protected against SQL injection');
  }

  async testWeakPasswordAcceptance() {
    const weakPasswords = ['123', 'password', 'abc', '111111', 'test'];

    for (const password of weakPasswords) {
      try {
        const response = await this.client.post('/auth/register', {
          email: `test${Date.now()}@example.com`,
          password: password,
          name: 'Test User'
        });

        if (response.status === 201) {
          this.addVulnerability('MEDIUM', 'Weak password accepted', '/auth/register', password);
          this.logTest('Weak Password Rejection', 'FAIL', `Weak password "${password}" was accepted`);
          return;
        }
      } catch (error) {
        // Expected for weak passwords
      }
    }

    this.logTest('Weak Password Rejection', 'PASS', 'Weak passwords properly rejected');
  }

  async testJWTTokenValidation() {
    const invalidTokens = [
      'invalid.jwt.token',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid',
      '',
      'Bearer fake-token',
      'null',
      'undefined'
    ];

    let vulnerable = false;
    for (const token of invalidTokens) {
      try {
        const response = await this.client.get('/books', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200) {
          this.addVulnerability('HIGH', 'Invalid JWT token accepted', '/books', token);
          vulnerable = true;
        }
      } catch (error) {
        // Expected for invalid tokens
      }
    }

    this.logTest('JWT Token Validation', vulnerable ? 'FAIL' : 'PASS',
      vulnerable ? 'Invalid tokens were accepted' : 'Invalid tokens properly rejected');
  }

  async testBruteForceProtection() {
    const attempts = [];
    const maxAttempts = 10;

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const start = Date.now();
        const response = await this.client.post('/auth/login', {
          email: 'test@example.com',
          password: 'wrongpassword'
        });
        const duration = Date.now() - start;

        attempts.push({ status: response.status, duration });

        // Small delay between attempts
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        attempts.push({ error: error.message });
      }
    }

    // Check if there's rate limiting (increasing delays or blocking)
    const avgDuration = attempts.reduce((sum, attempt) => sum + (attempt.duration || 0), 0) / attempts.length;
    const lastAttempts = attempts.slice(-3);
    const avgLastDuration = lastAttempts.reduce((sum, attempt) => sum + (attempt.duration || 0), 0) / lastAttempts.length;

    if (avgLastDuration > avgDuration * 2 || attempts.some(a => a.status === 429)) {
      this.logTest('Brute Force Protection', 'PASS', 'Rate limiting detected');
    } else {
      this.logTest('Brute Force Protection', 'FAIL', 'No rate limiting detected');
      this.addVulnerability('MEDIUM', 'No brute force protection detected', '/auth/login');
    }
  }

  async testSessionManagement() {
    // Test if logout properly invalidates tokens
    try {
      // First, try to get a valid token (this might fail if no test user exists)
      const loginResponse = await this.client.post('/auth/login', {
        email: 'test@example.com',
        password: 'validpassword'
      });

      if (loginResponse.status === 200 && loginResponse.data.token) {
        const token = loginResponse.data.token;

        // Test access with token
        const accessResponse = await this.client.get('/books', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Test logout
        await this.client.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Test access after logout
        const postLogoutResponse = await this.client.get('/books', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (postLogoutResponse.status === 401) {
          this.logTest('Session Invalidation', 'PASS', 'Token properly invalidated after logout');
        } else {
          this.logTest('Session Invalidation', 'FAIL', 'Token still valid after logout');
          this.addVulnerability('MEDIUM', 'Session not properly invalidated', '/auth/logout');
        }
      } else {
        this.logTest('Session Invalidation', 'SKIP', 'Could not obtain valid token for testing');
      }
    } catch (error) {
      this.logTest('Session Invalidation', 'SKIP', 'Authentication test setup failed');
    }
  }

  /**
   * Input Validation Tests
   */
  async testInputValidation() {
    this.log('\n🛡️ Testing Input Validation...', 'bold');

    await this.testXSSPrevention();
    await this.testFileUploadSecurity();
    await this.testParameterPollution();
    await this.testDataTypeValidation();
  }

  async testXSSPrevention() {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src=x onerror=alert("XSS")>',
      '{{constructor.constructor("alert(\\"XSS\\")")()}}',
      '<svg onload=alert("XSS")>',
      '"><iframe src=javascript:alert("XSS")></iframe>'
    ];

    let vulnerable = false;
    for (const payload of xssPayloads) {
      try {
        // Test XSS in note creation
        const response = await this.client.post('/notes', {
          bookId: 1,
          content: payload,
          type: 'note'
        });

        // Check if payload is reflected without sanitization
        if (response.data && JSON.stringify(response.data).includes(payload)) {
          this.addVulnerability('HIGH', 'XSS vulnerability in notes', '/notes', payload);
          vulnerable = true;
        }
      } catch (error) {
        // Continue with other payloads
      }
    }

    this.logTest('XSS Prevention', vulnerable ? 'FAIL' : 'PASS',
      vulnerable ? 'XSS payloads not properly sanitized' : 'XSS payloads properly sanitized');
  }

  async testFileUploadSecurity() {
    // Test malicious file upload
    const maliciousFiles = [
      { name: 'script.php', content: '<?php system($_GET["cmd"]); ?>' },
      { name: 'test.exe', content: 'MZ\x90\x00\x03\x00\x00\x00' }, // PE header
      { name: '../../../etc/passwd', content: 'path traversal test' },
      { name: 'huge.pdf', content: 'A'.repeat(100 * 1024 * 1024) } // 100MB file
    ];

    let vulnerable = false;
    for (const file of maliciousFiles) {
      try {
        const formData = new FormData();
        formData.append('file', new Blob([file.content]), file.name);

        const response = await this.client.post('/books/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.status === 200) {
          this.addVulnerability('HIGH', 'Malicious file upload accepted', '/books/upload', file.name);
          vulnerable = true;
        }
      } catch (error) {
        // Expected for malicious files
      }
    }

    this.logTest('File Upload Security', vulnerable ? 'FAIL' : 'PASS',
      vulnerable ? 'Malicious files were accepted' : 'Malicious files properly rejected');
  }

  async testParameterPollution() {
    try {
      // Test HTTP Parameter Pollution
      const response = await this.client.get('/books?id=1&id=2&id=999');

      // Check if the server handles multiple parameters correctly
      if (response.status === 200) {
        this.logTest('Parameter Pollution Protection', 'PASS', 'Multiple parameters handled correctly');
      } else {
        this.logTest('Parameter Pollution Protection', 'SKIP', 'Endpoint not accessible for testing');
      }
    } catch (error) {
      this.logTest('Parameter Pollution Protection', 'SKIP', 'Could not test parameter pollution');
    }
  }

  async testDataTypeValidation() {
    const invalidInputs = [
      { field: 'email', value: 'not-an-email' },
      { field: 'id', value: 'string-instead-of-number' },
      { field: 'date', value: 'invalid-date-format' },
      { field: 'boolean', value: 'not-a-boolean' }
    ];

    let properValidation = 0;
    for (const input of invalidInputs) {
      try {
        const response = await this.client.post('/books', {
          [input.field]: input.value
        });

        if (response.status >= 400) {
          properValidation++;
        }
      } catch (error) {
        properValidation++;
      }
    }

    const validationRatio = properValidation / invalidInputs.length;
    this.logTest('Data Type Validation', validationRatio > 0.5 ? 'PASS' : 'FAIL',
      `${Math.round(validationRatio * 100)}% of invalid inputs properly rejected`);
  }

  /**
   * API Security Tests
   */
  async testAPISecurity() {
    this.log('\n🌐 Testing API Security...', 'bold');

    await this.testHTTPSRedirection();
    await this.testSecurityHeaders();
    await this.testCORSConfiguration();
    await this.testRateLimiting();
  }

  async testHTTPSRedirection() {
    try {
      const httpUrl = BASE_URL.replace('https://', 'http://');
      const response = await axios.get(httpUrl, {
        maxRedirects: 0,
        validateStatus: () => true
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.location;
        if (location && location.startsWith('https://')) {
          this.logTest('HTTPS Redirection', 'PASS', 'HTTP requests properly redirected to HTTPS');
        } else {
          this.logTest('HTTPS Redirection', 'FAIL', 'HTTP redirection not to HTTPS');
        }
      } else {
        this.logTest('HTTPS Redirection', 'FAIL', 'No HTTPS redirection detected');
        this.addVulnerability('MEDIUM', 'Missing HTTPS redirection', httpUrl);
      }
    } catch (error) {
      this.logTest('HTTPS Redirection', 'SKIP', 'Could not test HTTPS redirection');
    }
  }

  async testSecurityHeaders() {
    try {
      const response = await this.client.get('/health');
      const headers = response.headers;

      const securityHeaders = [
        'strict-transport-security',
        'content-security-policy',
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection'
      ];

      let missingHeaders = [];
      for (const header of securityHeaders) {
        if (!headers[header]) {
          missingHeaders.push(header);
        }
      }

      if (missingHeaders.length === 0) {
        this.logTest('Security Headers', 'PASS', 'All essential security headers present');
      } else {
        this.logTest('Security Headers', 'FAIL', `Missing headers: ${missingHeaders.join(', ')}`);
        this.addVulnerability('MEDIUM', 'Missing security headers', '/health', missingHeaders);
      }
    } catch (error) {
      this.logTest('Security Headers', 'SKIP', 'Could not test security headers');
    }
  }

  async testCORSConfiguration() {
    try {
      const response = await this.client.options('/health', {
        headers: {
          'Origin': 'https://malicious-site.com',
          'Access-Control-Request-Method': 'POST'
        }
      });

      const corsOrigin = response.headers['access-control-allow-origin'];

      if (corsOrigin === '*') {
        this.logTest('CORS Configuration', 'FAIL', 'Wildcard CORS origin detected');
        this.addVulnerability('MEDIUM', 'Overly permissive CORS policy', '/health');
      } else if (corsOrigin) {
        this.logTest('CORS Configuration', 'PASS', 'CORS properly configured');
      } else {
        this.logTest('CORS Configuration', 'PASS', 'CORS not allowing unauthorized origins');
      }
    } catch (error) {
      this.logTest('CORS Configuration', 'SKIP', 'Could not test CORS configuration');
    }
  }

  async testRateLimiting() {
    const requests = [];
    const startTime = Date.now();

    // Send rapid requests
    for (let i = 0; i < 20; i++) {
      requests.push(this.client.get('/health'));
    }

    try {
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      if (rateLimited) {
        this.logTest('Rate Limiting', 'PASS', 'Rate limiting detected');
      } else {
        this.logTest('Rate Limiting', 'WARN', 'No rate limiting detected');
        // Note: This might be intentional for health endpoints
      }
    } catch (error) {
      this.logTest('Rate Limiting', 'SKIP', 'Could not test rate limiting');
    }
  }

  /**
   * Generate security report
   */
  generateReport() {
    this.log('\n📊 Security Audit Report', 'bold');
    this.log('='.repeat(50), 'blue');

    const total = testResults.passed + testResults.failed + testResults.skipped;
    const passRate = ((testResults.passed / total) * 100).toFixed(1);

    this.log(`Total Tests: ${total}`, 'blue');
    this.log(`Passed: ${testResults.passed}`, 'green');
    this.log(`Failed: ${testResults.failed}`, 'red');
    this.log(`Skipped: ${testResults.skipped}`, 'yellow');
    this.log(`Pass Rate: ${passRate}%`, passRate > 80 ? 'green' : 'red');

    if (testResults.vulnerabilities.length > 0) {
      this.log('\n🚨 Vulnerabilities Found:', 'red');
      testResults.vulnerabilities.forEach((vuln, index) => {
        this.log(`${index + 1}. [${vuln.severity}] ${vuln.description}`, 'red');
        this.log(`   Endpoint: ${vuln.endpoint}`, 'blue');
        if (vuln.payload) {
          this.log(`   Payload: ${JSON.stringify(vuln.payload)}`, 'blue');
        }
      });
    } else {
      this.log('\n✅ No vulnerabilities found!', 'green');
    }

    // Save report to file
    const reportPath = path.join(__dirname, `security-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    this.log(`\n📄 Report saved to: ${reportPath}`, 'blue');

    return testResults;
  }

  /**
   * Run all security tests
   */
  async runAllTests() {
    this.log('🔒 Starting Comprehensive Security Audit...', 'bold');
    this.log('=' .repeat(50), 'blue');

    const connected = await this.testConnection();
    if (!connected) {
      this.log('\n❌ Cannot connect to server. Please ensure the server is running.', 'red');
      return false;
    }

    await this.testAuthenticationSecurity();
    await this.testInputValidation();
    await this.testAPISecurity();

    return this.generateReport();
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new SecurityTester();
  tester.runAllTests().then((results) => {
    const exitCode = results.vulnerabilities.filter(v => v.severity === 'CRITICAL').length > 0 ? 1 : 0;
    process.exit(exitCode);
  }).catch((error) => {
    console.error('Security testing failed:', error);
    process.exit(1);
  });
}

export default SecurityTester;