// src/components/legal/CookieConsent.jsx
import React, { useState, useEffect } from 'react';
import { MD3Button, MD3Card } from '../Material3';
import { useMaterial3Theme } from '../../contexts/Material3ThemeContext';
import './CookieConsent.css';

const CookieConsent = () => {
  const { actualTheme } = useMaterial3Theme();
  const [isVisible, setIsVisible] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always true, can't be disabled
    analytics: false,
    marketing: false
  });
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consentData = localStorage.getItem('shelfquest-cookie-consent');

    // Enforce essential-only in child mode and do not show banner
    const isChild = localStorage.getItem('shelfquest_child_mode') === 'true';
    if (isChild) {
      const enforced = {
        essential: true,
        analytics: false,
        marketing: false,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem('shelfquest-cookie-consent', JSON.stringify(enforced));
      return;
    }

    if (!consentData) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const consentData = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    if (localStorage.getItem('shelfquest_child_mode') === 'true') {
      consentData.analytics = false;
      consentData.marketing = false;
    }

    localStorage.setItem('shelfquest-cookie-consent', JSON.stringify(consentData));
    setIsVisible(false);

    // Initialize analytics if accepted
    if (consentData.analytics) {
      initializeAnalytics();
    }
  };

  const handleAcceptEssential = () => {
    const consentData = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    localStorage.setItem('shelfquest-cookie-consent', JSON.stringify(consentData));
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    const consentData = {
      ...preferences,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    if (localStorage.getItem('shelfquest_child_mode') === 'true') {
      consentData.analytics = false;
      consentData.marketing = false;
    }

    localStorage.setItem('shelfquest-cookie-consent', JSON.stringify(consentData));
    setIsVisible(false);

    // Initialize analytics if accepted
    if (preferences.analytics) {
      initializeAnalytics();
    }
  };

  const initializeAnalytics = () => {
    // Initialize analytics services here
    console.log('Analytics initialized with user consent');
    // Example: gtag('config', 'GA_MEASUREMENT_ID');
    if (window.gtag && localStorage.getItem('shelfquest_child_mode') !== 'true') {
      try {
        window.gtag('consent', 'update', { analytics_storage: 'granted' });
      } catch (_) {
        // ignore
      }
    }
  };

  const togglePreference = (type) => {
    if (type === 'essential') return; // Essential cookies can't be disabled

    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-consent-overlay" data-theme={actualTheme}>
      <div className="cookie-consent-container">
        <MD3Card className="cookie-consent-card">
          {!showPreferences ? (
            // Main consent banner
            <div className="cookie-consent-content">
              <div className="cookie-consent-header">
                <span className="cookie-consent-icon">🍪</span>
                <h3 className="md-title-large">We use cookies</h3>
              </div>

              <p className="md-body-medium cookie-consent-text">
                We use essential cookies to make our service work and analytics cookies to understand how you use our service.
                We'd also like to set optional cookies to give you the best experience.
              </p>

              <div className="cookie-consent-links">
                <button
                  className="cookie-link"
                  onClick={() => setShowPreferences(true)}
                >
                  Customize cookies
                </button>
                <a
                  href="/legal/privacy-policy"
                  className="cookie-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
              </div>

              <div className="cookie-consent-actions">
                <MD3Button
                  variant="outlined"
                  onClick={handleAcceptEssential}
                  className="cookie-btn-secondary"
                >
                  Essential only
                </MD3Button>
                <MD3Button
                  variant="filled"
                  onClick={handleAcceptAll}
                  className="cookie-btn-primary"
                >
                  Accept all cookies
                </MD3Button>
              </div>
            </div>
          ) : (
            // Preferences panel
            <div className="cookie-preferences-content">
              <div className="cookie-consent-header">
                <button
                  className="cookie-back-btn"
                  onClick={() => setShowPreferences(false)}
                >
                  ←
                </button>
                <h3 className="md-title-large">Cookie preferences</h3>
              </div>

              <p className="md-body-medium cookie-consent-text">
                Choose which cookies you're happy for us to use. You can change these settings at any time.
              </p>

              <div className="cookie-categories">
                {/* Essential Cookies */}
                <div className="cookie-category">
                  <div className="cookie-category-header">
                    <div className="cookie-category-info">
                      <h4 className="md-title-medium">Essential cookies</h4>
                      <p className="md-body-small">Required for the service to work</p>
                    </div>
                    <div className="cookie-toggle">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled={true}
                        className="cookie-checkbox"
                      />
                      <span className="cookie-toggle-label">Always on</span>
                    </div>
                  </div>
                  <p className="md-body-small cookie-category-description">
                    These cookies are necessary for authentication, security, and basic functionality of the service.
                  </p>
                </div>

                {/* Analytics Cookies */}
              <div className="cookie-category">
                <div className="cookie-category-header">
                  <div className="cookie-category-info">
                    <h4 className="md-title-medium">Analytics cookies</h4>
                    <p className="md-body-small">Help us improve our service</p>
                  </div>
                  <div className="cookie-toggle">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={() => togglePreference('analytics')}
                      className="cookie-checkbox"
                    />
                  </div>
                </div>
                <p className="md-body-small cookie-category-description">
                  These cookies help us understand how you use our service so we can make improvements.
                </p>
              </div>

              {/* Marketing Cookies (hidden for child users) */}
              {localStorage.getItem('shelfquest_child_mode') !== 'true' && (
                <div className="cookie-category">
                  <div className="cookie-category-header">
                    <div className="cookie-category-info">
                      <h4 className="md-title-medium">Marketing cookies</h4>
                      <p className="md-body-small">Personalized content and ads</p>
                    </div>
                    <div className="cookie-toggle">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={() => togglePreference('marketing')}
                        className="cookie-checkbox"
                      />
                    </div>
                  </div>
                  <p className="md-body-small cookie-category-description">
                    These cookies are used to show you relevant content and advertisements.
                  </p>
                </div>
              )}
              </div>

              <div className="cookie-consent-actions">
                <MD3Button
                  variant="outlined"
                  onClick={() => setShowPreferences(false)}
                  className="cookie-btn-secondary"
                >
                  Cancel
                </MD3Button>
                <MD3Button
                  variant="filled"
                  onClick={handleSavePreferences}
                  className="cookie-btn-primary"
                >
                  Save preferences
                </MD3Button>
              </div>
            </div>
          )}
        </MD3Card>
      </div>
    </div>
  );
};

// Utility function to check if user has consented to specific cookie types
export const hasConsentFor = (cookieType) => {
  try {
    const consentData = localStorage.getItem('shelfquest-cookie-consent');
    if (!consentData) return false;

    const consent = JSON.parse(consentData);
    return consent[cookieType] === true;
  } catch (error) {
    console.error('Error checking cookie consent:', error);
    return false;
  }
};

// Utility function to get all consent preferences
export const getConsentPreferences = () => {
  try {
    const consentData = localStorage.getItem('shelfquest-cookie-consent');
    if (!consentData) return null;

    return JSON.parse(consentData);
  } catch (error) {
    console.error('Error getting consent preferences:', error);
    return null;
  }
};

// Function to show cookie preferences (for settings page)
export const showCookiePreferences = () => {
  localStorage.removeItem('shelfquest-cookie-consent');
  window.location.reload(); // Simple way to trigger the banner again
};

export default CookieConsent;
