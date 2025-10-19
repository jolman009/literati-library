import React from 'react';
import { MD3Card } from '../../components/Material3';
import LegalPageLayout from './LegalPageLayout';
import './LegalPages.css';

const TermsOfServicePage = () => {
  return (
    <LegalPageLayout>
      <div className="legal-page-container">
      <div className="legal-page-header">
        <h1 className="md-display-small">Terms of Service</h1>
        <p className="md-body-large legal-subtitle">
          Legal agreement for using ShelfQuest
        </p>
        <p className="md-body-medium legal-updated">
          Last Updated: October 3, 2025
        </p>
      </div>

      <MD3Card className="legal-content-card">
        <div className="legal-content">
          <section className="legal-section">
            <h2 className="md-headline-medium">Agreement to Terms</h2>
            <p className="md-body-medium">
              By accessing or using ShelfQuest ("Service"), you agree to be bound by these Terms of Service ("Terms").
              If you disagree with any part of these Terms, you may not access or use our Service.
            </p>
          </section>

          <section className="legal-section">
            <h2 className="md-headline-medium">Description of Service</h2>
            <p className="md-body-medium">ShelfQuest is a digital library application that allows users to:</p>
            <ul className="legal-list">
              <li>Upload, store, and organize digital books (PDF, EPUB)</li>
              <li>Track reading progress and maintain reading statistics</li>
              <li>Create notes, highlights, and annotations</li>
              <li>Participate in gamification features (achievements, goals, points)</li>
              <li>Access AI-powered note summarization</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2 className="md-headline-medium">User Accounts</h2>

            <h3 className="md-title-large">Account Creation</h3>
            <ul className="legal-list">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must be at least 13 years old to create an account</li>
              <li>One person may not maintain multiple accounts</li>
            </ul>

            <h3 className="md-title-large">Account Security</h3>
            <ul className="legal-list">
              <li>You are responsible for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>We are not liable for any loss or damage from unauthorized account access</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2 className="md-headline-medium">User Content and Conduct</h2>

            <h3 className="md-title-large">Content Ownership</h3>
            <ul className="legal-list">
              <li>You retain ownership of content you upload to ShelfQuest</li>
              <li>You grant us a license to store, process, and display your content to provide the Service</li>
              <li>You are solely responsible for the content you upload and share</li>
            </ul>

            <h3 className="md-title-large">Content Restrictions</h3>
            <p className="md-body-medium">You agree NOT to upload, share, or transmit content that:</p>
            <ul className="legal-list">
              <li>Violates copyright, trademark, or other intellectual property rights</li>
              <li>Contains malware, viruses, or harmful code</li>
              <li>Is illegal, harmful, threatening, abusive, or offensive</li>
              <li>Contains personal information of others without consent</li>
              <li>Violates any applicable laws or regulations</li>
            </ul>

            <h3 className="md-title-large">Copyright Compliance</h3>
            <ul className="legal-list">
              <li>You warrant that you have the right to upload and share any books or content</li>
              <li>You must only upload books you legally own or have permission to share</li>
              <li>We comply with the Digital Millennium Copyright Act (DMCA)</li>
              <li>Copyright holders may request removal of infringing content</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2 className="md-headline-medium">Intellectual Property Rights</h2>

            <h3 className="md-title-large">Our Content</h3>
            <ul className="legal-list">
              <li>The ShelfQuest application, including its design, features, and functionality, is owned by us</li>
              <li>Our trademarks, logos, and service marks are our property</li>
              <li>You may not use our intellectual property without written permission</li>
            </ul>

            <h3 className="md-title-large">License to Use Service</h3>
            <p className="md-body-medium">
              We grant you a limited, non-exclusive, non-transferable license to use ShelfQuest for personal,
              non-commercial purposes in accordance with these Terms.
            </p>
          </section>

          <section className="legal-section">
            <h2 className="md-headline-medium">Privacy and Data Protection</h2>
            <p className="md-body-medium">
              Your privacy is important to us. Our collection and use of your information is governed by our Privacy Policy,
              which is incorporated into these Terms by reference.
            </p>
          </section>

          <section className="legal-section">
            <h2 className="md-headline-medium">Limitation of Liability</h2>
            <p className="md-body-medium">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>

            <h3 className="md-title-large">Disclaimer of Warranties</h3>
            <ul className="legal-list">
              <li>The Service is provided "AS IS" without warranties of any kind</li>
              <li>We disclaim all warranties, express or implied, including merchantability and fitness for a particular purpose</li>
              <li>We do not warrant that the Service will be error-free or uninterrupted</li>
            </ul>

            <h3 className="md-title-large">Limitation of Damages</h3>
            <ul className="legal-list">
              <li>Our liability is limited to the maximum extent permitted by law</li>
              <li>We are not liable for indirect, incidental, consequential, or punitive damages</li>
              <li>Our total liability shall not exceed the amount you paid for the Service (if any)</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2 className="md-headline-medium">Dispute Resolution</h2>

            <h3 className="md-title-large">Governing Law</h3>
            <p className="md-body-medium">
              These Terms are governed by the laws of the State of Texas, United States, without regard to conflict of law principles.
            </p>

            <h3 className="md-title-large">Jurisdiction</h3>
            <p className="md-body-medium">
              Any legal actions must be brought in the courts of Cameron County, Texas.
            </p>

            <h3 className="md-title-large">Dispute Resolution Process</h3>
            <ol className="legal-list">
              <li><strong>Informal Resolution:</strong> Contact us first to attempt informal resolution</li>
              <li><strong>Mediation:</strong> If informal resolution fails, disputes may be resolved through mediation</li>
              <li><strong>Arbitration:</strong> Binding arbitration may be required for certain disputes (where permitted by law)</li>
            </ol>
          </section>

          <section className="legal-section">
            <h2 className="md-headline-medium">DMCA Copyright Policy</h2>
            <p className="md-body-medium">
              If you believe content on our Service infringes your copyright, please contact our DMCA agent:
            </p>
            <div className="legal-contact">
              <p><strong>Email:</strong> info@shelfquest.pro</p>
              <p><strong>Address:</strong> 628 Montreal Court, Brownsville, Texas 78526</p>
            </div>
          </section>

          <section className="legal-section">
            <h2 className="md-headline-medium">Changes to Terms</h2>
            <p className="md-body-medium">
              We may modify these Terms at any time. Material changes will be communicated through the Service or by email.
              Continued use after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="legal-section">
            <h2 className="md-headline-medium">Termination</h2>

            <h3 className="md-title-large">Your Rights</h3>
            <ul className="legal-list">
              <li>You may stop using the Service at any time</li>
              <li>You may delete your account through the app settings</li>
            </ul>

            <h3 className="md-title-large">Our Rights</h3>
            <p className="md-body-medium">We may suspend or terminate your access for:</p>
            <ul className="legal-list">
              <li>Violation of these Terms</li>
              <li>Illegal or harmful activity</li>
              <li>Long periods of inactivity</li>
              <li>Business reasons (with notice when possible)</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2 className="md-headline-medium">Contact Information</h2>
            <p className="md-body-medium">
              For questions about these Terms, contact us at:
            </p>
            <div className="legal-contact">
              <p><strong>Email:</strong> info@shelfquest.pro</p>
              <p><strong>Address:</strong> 628 Montreal Court, Brownsville, Texas 78526</p>
              <p><strong>Support:</strong> info@shelfquest.org</p>
            </div>
          </section>

          <div className="legal-footer">
            <p className="md-body-small">
              These Terms of Service are effective as of October 3, 2025 and were last updated on October 3, 2025.
            </p>
            <p className="md-body-medium" style={{ marginTop: '16px', fontWeight: 500 }}>
              By using ShelfQuest, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </MD3Card>
    </div>
    </LegalPageLayout>
  );
};

export default TermsOfServicePage;
