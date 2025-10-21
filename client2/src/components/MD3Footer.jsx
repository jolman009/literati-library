// src/components/MD3Footer.jsx - Material Design 3 Footer Component
import React from 'react';
import { Link } from 'react-router-dom';
import './MD3Footer.css';

const MD3Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="md3-footer">
      <div className="md3-footer-container">
        {/* Brand Section */}
        <div className="md3-footer-brand">
          <h3 className="md-title-medium md3-footer-logo">
            📚 ShelfQuest
          </h3>
          <p className="md-body-small md3-footer-tagline">
            Your personal digital library
          </p>
        </div>

        {/* Links Section */}
        <div className="md3-footer-links">
          {/* Legal Links */}
          <div className="md3-footer-column">
            <h4 className="md-title-small md3-footer-column-title">Legal</h4>
            <nav className="md3-footer-nav">
              <Link
                to="/legal/privacy-policy"
                className="md-label-large md3-footer-link"
              >
                Privacy Policy
              </Link>
              <Link
                to="/legal/terms-of-service"
                className="md-label-large md3-footer-link"
              >
                Terms of Service
              </Link>
              <button
                onClick={() => {
                  // Trigger cookie preferences (if you have a global function)
                  localStorage.removeItem('shelfquest-cookie-consent');
                  window.location.reload();
                }}
                className="md-label-large md3-footer-link md3-footer-button"
              >
                Cookie Preferences
              </button>
            </nav>
          </div>

          {/* Support Links */}
          <div className="md3-footer-column">
            <h4 className="md-title-small md3-footer-column-title">Support</h4>
            <nav className="md3-footer-nav">
              <Link
                to="/contact"
                className="md-label-large md3-footer-link"
              >
                Contact Us
              </Link>
              <Link
                to="/help"
                className="md-label-large md3-footer-link"
              >
                Help Center
              </Link>
              <Link
                to="/settings/data-export"
                className="md-label-large md3-footer-link"
              >
                Export My Data
              </Link>
            </nav>
          </div>

          {/* About Links */}
          <div className="md3-footer-column">
            <h4 className="md-title-small md3-footer-column-title">About</h4>
            <nav className="md3-footer-nav">
              <Link
                to="/about"
                className="md-label-large md3-footer-link"
              >
                About ShelfQuest
              </Link>
              <a
                href="https://github.com/yourusername/shelfquest"
                target="_blank"
                rel="noopener noreferrer"
                className="md-label-large md3-footer-link"
              >
                GitHub
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="md3-footer-bottom">
          <div className="md3-footer-bottom-content">
            <p className="md-body-small md3-footer-copyright">
              © {currentYear} ShelfQuest. All rights reserved.
            </p>
            <div className="md3-footer-meta">
              <span className="md-body-small md3-footer-location">
                Made in Brownsville, Texas
              </span>
              <span className="md-body-small md3-footer-separator">•</span>
              <a
                href="mailto:admin@shelfquest.org"
                className="md-body-small md3-footer-email"
              >
                admin@shelfquest.org
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MD3Footer;
