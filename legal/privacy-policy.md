# Privacy Policy for ShelfQuest

**Last Updated: October 3, 2025**

## Introduction

ShelfQuest ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our digital library application ("Service"). Please read this Privacy Policy carefully.

By accessing or using our Service, you agree to the collection and use of information in accordance with this Privacy Policy.

### Audience and Family Compliance

 - Target Audience: ShelfQuest serves a general audience and may also be suitable for children.
 - Family Policy: We comply with Google Play Families Policy for child‑appropriate content, features, and data practices.
 - Child Mode: When a user indicates they are under the age of 13 (or local age of digital consent), we provide a limited experience with:
   - No personalized advertising, no advertising ID use for profiling.
   - Limited or disabled analytics and crash diagnostics.
   - No precise location collection; only coarse or none.
   - External links, app store pages, social sharing, or purchases behind a parental gate.
   - Parental Rights: Parents can review, delete, or request cessation of processing of their child’s personal information by contacting info@shelfquest.pro.”

## Information We Collect

### Personal Information

We collect information that identifies, relates to, describes, or is capable of being associated with you:

- **Account Information**: Email address, name, password (encrypted)
- **Profile Data**: Avatar, reading preferences, user settings
- **Authentication Data**: Login timestamps, session information
- **Parental Consent**: We collect a parent or legal guardian’s consent before collecting personal information from a child user where required by law.

### Reading Data

- **Book Library**: Books you upload, metadata, reading status
- **Reading Activity**: Reading sessions, duration, progress, bookmarks
- **Notes and Highlights**: Text annotations, comments, summaries
- **Reading Statistics**: Pages read, time spent reading, reading streaks

### Gamification Data

- **Achievement Data**: Unlocked achievements, points earned, levels
- **Goal Tracking**: Reading goals, progress, completion status
- **Activity Logs**: Actions taken within the app for points calculation

### Technical Information

- **Device Information**: Browser type, operating system, device identifiers
- **Usage Data**: App interaction patterns, feature usage, error logs
- **PWA Data**: Installation status, offline usage patterns

### Uploaded Content

- **Book Files**: PDF and EPUB files you upload (stored securely)
- **Book Metadata**: Title, author, genre, description, cover images
- **User-Generated Content**: Notes, highlights, reviews, comments

### Cloud Storage Integration

- **Third-Party Access Tokens**: Temporary OAuth 2.0 tokens for accessing your Google Drive or Dropbox account (encrypted and never shared)
- **Cloud File Metadata**: File names, sizes, types, and modification dates from files you select in the cloud picker
- **Cloud Provider Information**: Which cloud service you authorize (Google Drive, Dropbox, OneDrive)
- **Access Scope**: We only request read-only access to specific files you explicitly select through the picker interface
- **Token Storage**: OAuth tokens are encrypted at rest and stored only if you enable "Quick Import" feature
- **Revocation Data**: Records of when you connect or disconnect cloud storage providers

## How We Use Your Information

We use collected information for:

### Core Service Provision

- **Account Management**: Creating and maintaining your account
- **Library Management**: Storing and organizing your digital books
- **Reading Experience**: Tracking progress, syncing across devices
- **Note-Taking**: Saving and organizing your reading notes

### Features and Functionality

- **Gamification**: Calculating points, unlocking achievements, tracking goals
- **Personalization**: Customizing your reading experience and recommendations
- **Statistics**: Providing reading analytics and progress tracking
- **AI Services**: Generating note summaries using AI (when requested)

### Service Improvement

- **Analytics**: Understanding how users interact with our Service
- **Performance**: Monitoring and improving app performance
- **Bug Fixes**: Identifying and resolving technical issues
- **Feature Development**: Planning and implementing new features

### Communication

- **Service Updates**: Notifying you of important changes or updates
- **Support**: Responding to your questions and providing assistance
- **Achievement Notifications**: Informing you of unlocked achievements (optional)

## Information Sharing and Disclosure

We do not sell, trade, or rent your personal information to third parties. We may share information only in these limited circumstances:

### Service Providers

- **AI Processing**: Google Gemini API for note summarization (no personal data stored)
- **Hosting Services**: Secure cloud hosting for data storage and app delivery
- **Authentication**: Supabase for secure user authentication and data storage
- **Cloud Storage Providers**:
  - **Google Drive API**: For importing books you select from your Google Drive (OAuth 2.0 read-only access)
  - **Dropbox API**: For importing books you select from your Dropbox (OAuth 2.0 file picker access)
  - We **never store** your cloud storage passwords or credentials
  - We only access files you **explicitly authorize** through the picker interface
  - Access tokens are **temporary** and **encrypted**, and can be revoked at any time through your account settings
  - We request **minimal permissions** (read-only access to selected files only, not your entire drive)

### Legal Requirements

- **Compliance**: When required by law, regulation, or legal process
- **Protection**: To protect our rights, property, or safety, or that of our users
- **Enforcement**: To enforce our Terms of Service or investigate violations

### Business Transfers

- **Mergers**: In connection with any merger, sale of assets, or acquisition
- **Restructuring**: During any reorganization or restructuring of our business

## Third-Party Cloud Storage Services

When you choose to import books from cloud storage services, we implement strict security and privacy measures:

### Authentication and Access

- **OAuth 2.0 Protocol**: We use industry-standard OAuth 2.0 to securely connect to your cloud storage without ever accessing your passwords
- **No Credential Storage**: We **never** store, transmit, or have access to your Google, Dropbox, or other cloud storage passwords
- **Limited Access**: We only access files you explicitly select through the official cloud provider picker interface
- **Minimal Scopes**: We request the absolute minimum permissions required:
  - Google Drive: `https://www.googleapis.com/auth/drive.readonly` (read-only access to selected files)
  - Dropbox: File picker access only (no full account access)
- **Temporary Tokens**: OAuth access tokens are temporary and expire automatically
- **Encrypted Storage**: If you enable "Quick Import," tokens are stored encrypted using AES-256 encryption
- **User Control**: You maintain full control and can revoke ShelfQuest's access at any time

### How Cloud Import Works

1. **Authorization**: You click "Import from Google Drive" or similar option
2. **Cloud Provider Login**: You're redirected to Google/Dropbox's official login page (not controlled by us)
3. **Permission Grant**: You explicitly grant ShelfQuest read-only access to files you select
4. **File Selection**: You use the cloud provider's official picker to choose specific files
5. **Secure Transfer**: We download only the selected files using the temporary access token
6. **Local Storage**: Files are then stored in your ShelfQuest library (same as manual uploads)
7. **Token Handling**: Access tokens are either discarded immediately or stored encrypted (if you enable Quick Import)

### Data Minimization

- We **do not** access your file names, folder structure, or any files you don't explicitly select
- We **do not** scan or index your cloud storage
- We **do not** retain access to your cloud storage after file import completes (unless Quick Import is enabled)
- We **do not** share your cloud storage data with any other third parties

### Compliance with Cloud Provider Policies

#### Google Drive Integration

- **Privacy Policy**: https://policies.google.com/privacy
- **API Terms**: We comply with [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy)
- **Limited Use**: Your Google user data is only used to provide ShelfQuest's book import functionality
- **No Secondary Use**: We do not use your Google Drive data for advertising, analytics, or any purpose other than file import
- **Security**: We follow Google's security requirements and undergo periodic security assessments

#### Dropbox Integration

- **Privacy Policy**: https://www.dropbox.com/privacy
- **API Terms**: We comply with [Dropbox API Terms and Conditions](https://www.dropbox.com/developers/terms)
- **Minimal Permissions**: We request only file selection permissions, not full Dropbox access
- **Data Usage**: Your Dropbox data is used solely for importing books you select

### Revoking Cloud Storage Access

You can revoke ShelfQuest's access to your cloud storage at any time through multiple methods:

#### Through ShelfQuest (Recommended)
1. Go to **Settings → Cloud Storage Connections**
2. Click **"Disconnect Google Drive"** or **"Disconnect Dropbox"**
3. Confirm disconnection
4. All stored tokens are immediately deleted

#### Through Google Account
1. Visit https://myaccount.google.com/permissions
2. Find "ShelfQuest" in the list
3. Click **"Remove Access"**

#### Through Dropbox Account
1. Visit https://www.dropbox.com/account/connected_apps
2. Find "ShelfQuest" in the list
3. Click **"Revoke"**

### Child Users and Cloud Storage

- Cloud storage import features are **disabled** for users under 13 years old
- If enabled for children with parental consent, we implement additional safeguards:
  - No persistent identifiers attached to cloud provider tokens
  - Tokens are never stored, only used once per import session
  - Additional parental verification required before first cloud import
  - Parents can disable cloud import features in parental controls

## Data Security

We implement appropriate technical and organizational security measures:

### Technical Safeguards

- **Encryption**: All data encrypted in transit and at rest
- **Authentication**: Secure password hashing (bcrypt) and JWT tokens
- **Access Controls**: Role-based access and authentication requirements
- **Secure Storage**: Supabase with Row Level Security (RLS) policies
- **OAuth Token Security**: Cloud storage access tokens encrypted using AES-256 encryption
- **Token Isolation**: Tokens stored separately from user data with strict access controls
- **No Credential Storage**: We never have access to or store your cloud storage passwords
- **Scope Limitation**: Minimal access scopes requested (read-only, file-picker only)
- **HTTPS Only**: All OAuth callbacks and API requests use secure HTTPS connections
- **CSRF Protection**: State parameter validation prevents cross-site request forgery attacks

### Operational Safeguards

- **Regular Updates**: Keeping software and security measures current
- **Monitoring**: Continuous monitoring for security threats
- **Backups**: Regular secure backups of your data
- **Incident Response**: Procedures for handling potential data breaches

## Your Privacy Rights

Depending on your location, you may have the following rights:

### General Rights

- **Access**: Request access to your personal information
- **Correction**: Request correction of inaccurate information
- **Deletion**: Request deletion of your personal information
- **Portability**: Request a copy of your data in a portable format
- **Revoke Cloud Access**: Disconnect cloud storage providers (Google Drive, Dropbox) at any time through Settings
- **Token Deletion**: Request immediate deletion of stored OAuth tokens
- **Access Review**: View which cloud services are currently connected to your account

### GDPR Rights (EU Residents)

- **Lawful Basis**: We process data based on legitimate interests and consent
- **Right to Object**: Object to processing based on legitimate interests
- **Right to Restrict**: Request restriction of processing in certain circumstances
- **Data Protection Officer**: Contact us for data protection inquiries

### CCPA Rights (California Residents)

- **Right to Know**: Categories and specific pieces of information collected
- **Right to Delete**: Deletion of personal information (with exceptions)
- **Right to Opt-Out**: We do not sell personal information
- **Non-Discrimination**: No discrimination for exercising privacy rights

### How to Exercise Your Rights

To exercise these rights, contact us at: **info@shelfquest.pro**

We will respond to your request within 30 days (or as required by applicable law).

### Cookies and Tracking

## Child Users
 - We disable or limit cookies and analytics for child users and do not use cookies for personalized ads.

### Cookies We Use

- **Authentication Cookies**: To keep you logged in securely
- **Preference Cookies**: To remember your theme and settings
- **Session Cookies**: To maintain your reading session state

### Third-Party Services

- **Analytics**: We may use analytics services to understand app usage
- **AI Services**: Google Gemini for note summarization (no tracking)
- **Ads**: If we show ads to child users, we use only Google Play Families Ads Program‑certified networks with child‑directed settings and contextual ads only. If we do not show ads, we do not share identifiers for ad purposes.
- **Analytics/Crash Reporting**: Disabled or minimized for child users; retained only as necessary for security or legal compliance.
- **AI Services (e.g., Google Gemini)**: For child users, we either disable AI features that transmit content to third parties, or obtain parental consent and avoid attaching persistent identifiers.

### Cookie Management

You can control cookies through your browser settings. Disabling certain cookies may affect app functionality.

## Data Retention

We retain your information for as long as necessary to provide our Service:

- **Account Data**: Until you delete your account
- **Reading Data**: Until you delete specific content or your account
- **Usage Data**: Aggregated data may be retained for analytics
- **Legal Requirements**: As required by applicable law
- **Cloud Storage Tokens**: Until you disconnect the cloud provider or delete your account (if Quick Import is disabled, tokens are discarded immediately after import)
- **Cloud Connection Logs**: Retained for 90 days for security and troubleshooting purposes

### Account Deletion

When you delete your account:

- All personal information is permanently deleted
- Uploaded books and notes are removed
- Reading statistics and achievements are deleted
- **Cloud storage OAuth tokens are immediately revoked and deleted**
- **Cloud connection records are permanently removed**
- Some aggregated, anonymized data may be retained for analytics

### Children’s Privacy

- ShelfQuest is a mixed‑audience app and may be used by children with a parent or legal guardian’s involvement. We do not knowingly collect personal information from children under 13 without verifiable parental consent.
- Child users receive a limited experience designed to minimize data collection and enhance safety: no personalized ads, no precise location, limited or disabled analytics, and external links/features behind a parental gate.
- If you are a parent/guardian and believe your child provided personal information without consent, contact us at info@shelfquest.pro. We will delete the information and/or disable the account.
- For child accounts or features that require personal information, we obtain verifiable parental consent or require the parent/guardian to create and manage the child’s account.”

## International Data Transfers

Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for international transfers as required by applicable law.

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any material changes by:

- Posting the updated Privacy Policy on this page
- Updating the "Last Updated" date
- Sending you an email notification (for significant changes)

Your continued use of the Service after changes constitutes acceptance of the updated Privacy Policy.

## Contact Information

If you have questions, concerns, or requests regarding this Privacy Policy, please contact us:

**Email**: info@shelfquest.pro
**Address**: 628 Montreal Court, Brownsville, Texas 78526
**Data Protection Officer**: info@shelfquest.pro

## Legal Basis for Processing (GDPR)

For EU residents, our legal basis for processing includes:

- **Consent**: For optional features and communications
- **Contract**: To provide the Service you've requested
- **Legitimate Interests**: To improve our Service and ensure security
- **Legal Obligation**: To comply with applicable laws

---

_This Privacy Policy is effective as of October 3, 2025 and was last updated on October 3, 2025._
