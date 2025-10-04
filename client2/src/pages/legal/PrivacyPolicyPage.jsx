import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { MD3Card } from '../../components/Material3';
import LegalPageLayout from './LegalPageLayout';
import './LegalPages.css';

// Constants for better maintainability
const PRIVACY_POLICY_VERSION = '1.0.0';
const LAST_UPDATED = new Date('2024-01-15'); // Set a fixed date for consistency
const CONTACT_EMAIL = 'info@literati.pro';

// Memoized date formatter for performance
const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

const PrivacyPolicyPage = () => {
  // State for tracking if user has scrolled to bottom (for analytics/compliance)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  
  // Memoize the last updated date to prevent re-calculation
  const lastUpdatedFormatted = useMemo(() => formatDate(LAST_UPDATED), []);

  // Track scroll to bottom for compliance purposes
  useEffect(() => {
    const handleScroll = () => {
      if (hasScrolledToBottom) return;
      
      const scrolledToBottom = 
        window.innerHeight + window.scrollY >= 
        document.documentElement.scrollHeight - 100;
      
      if (scrolledToBottom) {
        setHasScrolledToBottom(true);
        // Log privacy policy view completion for compliance
        console.log('Privacy policy fully viewed');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolledToBottom]);

  // Memoize section data for performance
  const sections = useMemo(() => [
    {
      id: 'introduction',
      title: 'Introduction',
      content: (
        <>
          <p className="md-body-medium">
            Literati ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our digital library application ("Service").
          </p>
          <p className="md-body-medium">
            By accessing or using our Service, you agree to the collection and use of information in accordance with this Privacy Policy.
          </p>
        </>
      )
    },
    {
      id: 'information-collection',
      title: 'Information We Collect',
      content: (
        <>
          <h3 className="md-title-large">Personal Information</h3>
          <p className="md-body-medium">We collect information that identifies, relates to, describes, or is capable of being associated with you:</p>
          <ul className="legal-list">
            <li><strong>Account Information:</strong> Email address, name, password (encrypted)</li>
            <li><strong>Profile Data:</strong> Avatar, reading preferences, user settings</li>
            <li><strong>Authentication Data:</strong> Login timestamps, session information</li>
          </ul>

          <h3 className="md-title-large">Reading Data</h3>
          <ul className="legal-list">
            <li><strong>Book Library:</strong> Books you upload, metadata, reading status</li>
            <li><strong>Reading Activity:</strong> Reading sessions, duration, progress, bookmarks</li>
            <li><strong>Notes and Highlights:</strong> Text annotations, comments, summaries</li>
            <li><strong>Reading Statistics:</strong> Pages read, time spent reading, reading streaks</li>
          </ul>

          <h3 className="md-title-large">Gamification Data</h3>
          <ul className="legal-list">
            <li><strong>Achievement Data:</strong> Unlocked achievements, points earned, levels</li>
            <li><strong>Goal Tracking:</strong> Reading goals, progress, completion status</li>
            <li><strong>Activity Logs:</strong> Actions taken within the app for points calculation</li>
          </ul>
        </>
      )
    },
    {
      id: 'information-use',
      title: 'How We Use Your Information',
      content: (
        <>
          <h3 className="md-title-large">Core Service Provision</h3>
          <ul className="legal-list">
            <li><strong>Account Management:</strong> Creating and maintaining your account</li>
            <li><strong>Library Management:</strong> Storing and organizing your digital books</li>
            <li><strong>Reading Experience:</strong> Tracking progress, syncing across devices</li>
            <li><strong>Note-Taking:</strong> Saving and organizing your reading notes</li>
          </ul>

          <h3 className="md-title-large">Features and Functionality</h3>
          <ul className="legal-list">
            <li><strong>Gamification:</strong> Calculating points, unlocking achievements, tracking goals</li>
            <li><strong>Personalization:</strong> Customizing your reading experience and recommendations</li>
            <li><strong>Statistics:</strong> Providing reading analytics and progress tracking</li>
            <li><strong>AI Services:</strong> Generating note summaries using AI (when requested)</li>
          </ul>
        </>
      )
    },
    {
      id: 'information-sharing',
      title: 'Information Sharing',
      content: (
        <>
          <p className="md-body-medium">
            We do not sell, trade, or rent your personal information to third parties. We may share information only in these limited circumstances:
          </p>

          <h3 className="md-title-large">Service Providers</h3>
          <ul className="legal-list">
            <li><strong>AI Processing:</strong> Google Gemini API for note summarization (no personal data stored)</li>
            <li><strong>Hosting Services:</strong> Secure cloud hosting for data storage and app delivery</li>
            <li><strong>Authentication:</strong> Supabase for secure user authentication and data storage</li>
          </ul>

          <h3 className="md-title-large">Legal Requirements</h3>
          <ul className="legal-list">
            <li><strong>Compliance:</strong> When required by law, regulation, or legal process</li>
            <li><strong>Protection:</strong> To protect our rights, property, or safety, or that of our users</li>
            <li><strong>Enforcement:</strong> To enforce our Terms of Service or investigate violations</li>
          </ul>
        </>
      )
    },
    {
      id: 'privacy-rights',
      title: 'Your Privacy Rights',
      content: (
        <>
          <p className="md-body-medium">Depending on your location, you may have the following rights:</p>

          <h3 className="md-title-large">General Rights</h3>
          <ul className="legal-list">
            <li><strong>Access:</strong> Request access to your personal information</li>
            <li><strong>Correction:</strong> Request correction of inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
          </ul>

          <h3 className="md-title-large">How to Exercise Your Rights</h3>
          <p className="md-body-medium">
            To exercise these rights, contact us at: <strong>{CONTACT_EMAIL}</strong>
          </p>
          <p className="md-body-medium">
            We will respond to your request within 30 days (or as required by applicable law).
          </p>
        </>
      )
    },
    {
      id: 'data-security',
      title: 'Data Security',
      content: (
        <>
          <p className="md-body-medium">We implement appropriate technical and organizational security measures:</p>

          <h3 className="md-title-large">Technical Safeguards</h3>
          <ul className="legal-list">
            <li><strong>Encryption:</strong> All data encrypted in transit and at rest</li>
            <li><strong>Authentication:</strong> Secure password hashing (bcrypt) and JWT tokens</li>
            <li><strong>Access Controls:</strong> Role-based access and authentication requirements</li>
            <li><strong>Secure Storage:</strong> Supabase with Row Level Security (RLS) policies</li>
          </ul>
        </>
      )
    },
    {
      id: 'data-retention',
      title: 'Data Retention',
      content: (
        <>
          <p className="md-body-medium">We retain your information for as long as necessary to provide our Service:</p>
          <ul className="legal-list">
            <li><strong>Account Data:</strong> Until you delete your account</li>
            <li><strong>Reading Data:</strong> Until you delete specific content or your account</li>
            <li><strong>Usage Data:</strong> Aggregated data may be retained for analytics</li>
            <li><strong>Legal Requirements:</strong> As required by applicable law</li>
          </ul>
        </>
      )
    },
    {
      id: 'contact',
      title: 'Contact Information',
      content: (
        <>
          <p className="md-body-medium">
            If you have questions, concerns, or requests regarding this Privacy Policy, please contact us:
          </p>
          <div className="legal-contact">
            <p><strong>Email:</strong> {CONTACT_EMAIL}</p>
            <p><strong>Data Protection Officer:</strong> {CONTACT_EMAIL}</p>
          </div>
        </>
      )
    }
  ], []);

  // Callback for smooth scrolling to sections
  const scrollToSection = useCallback((sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Generate table of contents
  const tableOfContents = useMemo(() => (
    <nav className="legal-table-of-contents" aria-label="Privacy Policy sections">
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
          <h1 className="md-display-small">Privacy Policy</h1>
          <p className="md-body-large legal-subtitle">
            How we collect, use, and protect your information
          </p>
          <p className="md-body-medium legal-updated">
            Last Updated: <time dateTime={LAST_UPDATED.toISOString()}>{lastUpdatedFormatted}</time>
          </p>
          <p className="md-body-small legal-version">
            Version: {PRIVACY_POLICY_VERSION}
          </p>
        </div>

        <MD3Card className="legal-content-card">
          <div className="legal-content">
            {/* Table of Contents for better navigation */}
            {tableOfContents}
            
            {/* Render all sections */}
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

export default PrivacyPolicyPage;