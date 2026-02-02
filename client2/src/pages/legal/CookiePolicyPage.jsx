import React, { useMemo, useCallback } from 'react';
import { MD3Card } from '../../components/Material3';
import LegalPageLayout from './LegalPageLayout';
import './LegalPages.css';

const COOKIE_POLICY_VERSION = '1.0.0';
const LAST_UPDATED = new Date('2025-06-01');
const CONTACT_EMAIL = 'info@shelfquest.org';

const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

const CookiePolicyPage = () => {
  const lastUpdatedFormatted = useMemo(() => formatDate(LAST_UPDATED), []);

  const sections = useMemo(() => [
    {
      id: 'what-are-cookies',
      title: 'What Are Cookies?',
      content: (
        <>
          <p className="md-body-medium">
            Cookies are small text files placed on your device by a website or application. They allow the service to recognise your browser and remember certain information between visits.
          </p>
          <p className="md-body-medium">
            ShelfQuest also uses <strong>localStorage</strong>, a browser storage mechanism that works similarly to cookies but stays entirely on your device and is never sent to our servers automatically.
          </p>
        </>
      )
    },
    {
      id: 'cookies-we-use',
      title: 'Cookies We Use',
      content: (
        <>
          <p className="md-body-medium">
            ShelfQuest sets a minimal number of cookies, all of which serve essential authentication and security purposes.
          </p>

          <h3 className="md-title-large">Authentication Cookies (Essential)</h3>
          <p className="md-body-medium">
            These HttpOnly cookies are set by our server when you log in. They cannot be read by JavaScript and are transmitted only over secure connections in production.
          </p>
          <table className="legal-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Purpose</th>
                <th>Duration</th>
                <th>Scope</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>accessToken</code></td>
                <td>Authenticates your API requests so the server knows who you are</td>
                <td>15 minutes (production) / 24 hours (development)</td>
                <td>All pages (<code>/</code>)</td>
              </tr>
              <tr>
                <td><code>refreshToken</code></td>
                <td>Obtains a new access token when the current one expires, keeping you signed in</td>
                <td>7 days</td>
                <td>Auth endpoints only (<code>/auth</code>)</td>
              </tr>
            </tbody>
          </table>
          <div className="legal-highlight">
            <p className="md-body-medium">
              Both cookies are <strong>HttpOnly</strong> and <strong>Secure</strong> (in production), meaning they cannot be accessed by client-side scripts and are only transmitted over HTTPS. This protects against cross-site scripting (XSS) and man-in-the-middle attacks.
            </p>
          </div>
        </>
      )
    },
    {
      id: 'local-storage',
      title: 'Local Storage',
      content: (
        <>
          <p className="md-body-medium">
            In addition to cookies, ShelfQuest stores the following data in your browser's localStorage. This data never leaves your device unless you take an explicit action.
          </p>
          <table className="legal-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Purpose</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>shelfquest-cookie-consent</code></td>
                <td>Records your cookie preferences (essential, analytics, marketing) and the date you gave consent</td>
                <td>Essential</td>
              </tr>
              <tr>
                <td><code>shelfquest_child_mode</code></td>
                <td>Indicates whether child-safety mode is active (disables analytics and marketing)</td>
                <td>Essential</td>
              </tr>
              <tr>
                <td>Theme and UI preferences</td>
                <td>Remembers your chosen colour theme, dark/light mode, and layout settings</td>
                <td>Essential</td>
              </tr>
            </tbody>
          </table>
        </>
      )
    },
    {
      id: 'third-party-cookies',
      title: 'Third-Party and Analytics Cookies',
      content: (
        <>
          <h3 className="md-title-large">Google Analytics</h3>
          <p className="md-body-medium">
            If you have opted in to <strong>analytics cookies</strong> through our consent banner, ShelfQuest may load Google Analytics to help us understand how users interact with the app (e.g., which pages are visited most). Google Analytics sets its own cookies.
          </p>
          <ul className="legal-list">
            <li>Analytics cookies are <strong>only loaded after you give explicit consent</strong>.</li>
            <li>If <strong>child mode</strong> is enabled, analytics are completely disabled regardless of your consent setting.</li>
            <li>You can withdraw consent at any time (see <em>Managing Your Preferences</em> below).</li>
          </ul>

          <h3 className="md-title-large">Marketing</h3>
          <p className="md-body-medium">
            Our consent banner includes a marketing category. ShelfQuest does not currently set any marketing or advertising cookies. This category exists for future transparency should we introduce personalised content features. If you have not opted in, no marketing tracking will ever occur.
          </p>
        </>
      )
    },
    {
      id: 'cookie-categories',
      title: 'Cookie Categories Summary',
      content: (
        <>
          <table className="legal-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Required?</th>
                <th>What It Covers</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Essential</strong></td>
                <td>Yes &mdash; cannot be disabled</td>
                <td>Authentication cookies, consent record, child-mode flag, UI preferences</td>
              </tr>
              <tr>
                <td><strong>Analytics</strong></td>
                <td>No &mdash; opt-in</td>
                <td>Google Analytics (usage patterns, page views). Disabled in child mode.</td>
              </tr>
              <tr>
                <td><strong>Marketing</strong></td>
                <td>No &mdash; opt-in</td>
                <td>Reserved for future use. No marketing cookies are set today.</td>
              </tr>
            </tbody>
          </table>
        </>
      )
    },
    {
      id: 'managing-preferences',
      title: 'Managing Your Preferences',
      content: (
        <>
          <h3 className="md-title-large">In-App Consent Banner</h3>
          <p className="md-body-medium">
            When you first visit ShelfQuest, a cookie consent banner appears. You can accept all cookies, reject optional ones, or customise your choices. Your preferences are saved in localStorage and respected on subsequent visits.
          </p>

          <h3 className="md-title-large">Changing Your Mind</h3>
          <p className="md-body-medium">
            To update your cookie preferences at any time:
          </p>
          <ol className="legal-list">
            <li>Clear the <code>shelfquest-cookie-consent</code> entry from your browser's localStorage (via Developer Tools &rarr; Application &rarr; Local Storage).</li>
            <li>Reload the page &mdash; the consent banner will reappear.</li>
          </ol>

          <h3 className="md-title-large">Browser Controls</h3>
          <p className="md-body-medium">
            Most browsers allow you to block or delete cookies through their settings. Note that blocking essential cookies will prevent you from signing in to ShelfQuest. Refer to your browser's help documentation for instructions:
          </p>
          <ul className="legal-list">
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">Apple Safari</a></li>
            <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
          </ul>
        </>
      )
    },
    {
      id: 'data-security',
      title: 'Cookie Security Measures',
      content: (
        <>
          <p className="md-body-medium">We apply the following protections to all cookies we set:</p>
          <ul className="legal-list">
            <li><strong>HttpOnly:</strong> Authentication cookies cannot be read by JavaScript, preventing XSS attacks.</li>
            <li><strong>Secure flag:</strong> In production, cookies are only transmitted over HTTPS.</li>
            <li><strong>SameSite:</strong> Cookies use the <code>SameSite</code> attribute to mitigate cross-site request forgery (CSRF).</li>
            <li><strong>Scoped paths:</strong> The refresh token cookie is restricted to <code>/auth</code> endpoints, minimising exposure.</li>
            <li><strong>Token hashing:</strong> Revoked tokens are stored as SHA-256 hashes in our database &mdash; never as raw values.</li>
          </ul>
        </>
      )
    },
    {
      id: 'updates',
      title: 'Changes to This Policy',
      content: (
        <>
          <p className="md-body-medium">
            We may update this Cookie Policy from time to time to reflect changes in our practices or applicable law. When we make material changes, we will update the "Last Updated" date at the top of this page and, where appropriate, notify you via the app.
          </p>
        </>
      )
    },
    {
      id: 'contact',
      title: 'Contact Us',
      content: (
        <>
          <p className="md-body-medium">
            If you have questions about how ShelfQuest uses cookies, please contact us:
          </p>
          <div className="legal-contact">
            <p><strong>Email:</strong> {CONTACT_EMAIL}</p>
          </div>
          <p className="md-body-medium">
            For broader privacy questions, please see our{' '}
            <a href="/legal/privacy-policy">Privacy Policy</a>.
          </p>
        </>
      )
    }
  ], []);

  const scrollToSection = useCallback((sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const tableOfContents = useMemo(() => (
    <nav className="legal-table-of-contents" aria-label="Cookie Policy sections">
      <h3 className="md-title-medium">Table of Contents</h3>
      <ul>
        {sections.map(section => (
          <li key={section.id}>
            <button
              onClick={() => scrollToSection(section.id)}
              className="legal-toc-link"
              aria-label={`Jump to ${section.title}`}
            >
              {section.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  ), [sections, scrollToSection]);

  return (
    <LegalPageLayout>
      <div className="legal-page-container">
        <div className="legal-page-header">
          <h1 className="md-display-small">Cookie Policy</h1>
          <p className="md-body-large legal-subtitle">
            How ShelfQuest uses cookies and similar technologies
          </p>
          <p className="md-body-medium legal-updated">
            Last Updated: <time dateTime={LAST_UPDATED.toISOString()}>{lastUpdatedFormatted}</time>
          </p>
          <p className="md-body-small legal-version">
            Version: {COOKIE_POLICY_VERSION}
          </p>
        </div>

        <MD3Card className="legal-content-card">
          <div className="legal-content">
            {tableOfContents}

            {sections.map(section => (
              <section
                key={section.id}
                id={section.id}
                className="legal-section"
                aria-labelledby={`${section.id}-heading`}
              >
                <h2 id={`${section.id}-heading`} className="md-headline-medium">
                  {section.title}
                </h2>
                {section.content}
              </section>
            ))}
          </div>
        </MD3Card>
      </div>
    </LegalPageLayout>
  );
};

export default CookiePolicyPage;
