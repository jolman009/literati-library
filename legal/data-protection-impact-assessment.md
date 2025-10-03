# Data Protection Impact Assessment (DPIA)
## For Literati Digital Library Application

**Organization**: Literati
**Assessment Date**: October 3, 2025
**Last Review**: October 3, 2025
**Next Review Due**: October 3, 2026
**Assessment Owner**: Data Protection Officer (info@literati.pro)
**GDPR Compliance**: Article 35 DPIA Requirement

---

## Executive Summary

This Data Protection Impact Assessment (DPIA) evaluates the privacy risks associated with Literati, a digital library application that allows users to upload, store, and manage their personal book collections with reading tracking and gamification features.

**Key Findings**:
- **Risk Level**: Medium
- **Processing Type**: Personal data storage, reading analytics, AI processing
- **Data Subjects**: Application users (age 13+)
- **Geographical Scope**: Global (with GDPR, CCPA compliance)
- **Recommendation**: Proceed with enhanced security measures and user consent mechanisms

---

## 1. Description of Processing Operations

### 1.1 Purpose of Processing

Literati processes personal data for the following purposes:

1. **Account Management**
   - User registration and authentication
   - Profile management and preferences
   - Access control and security

2. **Core Service Delivery**
   - Digital book storage and organization
   - Reading progress tracking and synchronization
   - Note-taking and annotation management
   - Reading statistics and analytics

3. **Gamification Features**
   - Achievement tracking and rewards
   - Reading goal management
   - Points calculation and level progression

4. **Service Improvement**
   - Usage analytics and feature optimization
   - Bug tracking and error resolution
   - Performance monitoring

5. **AI-Enhanced Features**
   - Note summarization using Google Gemini API
   - Content analysis for reading insights

### 1.2 Types of Personal Data Collected

#### Account & Identity Data
- Email address (required)
- Name or username (required)
- Password (hashed with bcrypt, never stored in plain text)
- User avatar (optional)
- Account creation timestamp
- Last login timestamp

#### Reading Data
- Uploaded book files (PDF, EPUB)
- Book metadata (title, author, genre, cover images)
- Reading progress (current page, completion percentage)
- Reading sessions (start time, duration, end time)
- Bookmarks and reading positions
- Reading statistics (total pages read, time spent, reading streaks)

#### User-Generated Content
- Notes and highlights
- Text annotations and comments
- Book reviews (if feature enabled)
- Reading goals and preferences

#### Technical & Usage Data
- Device information (browser type, OS, device identifiers)
- IP address
- Session data and cookies
- App interaction logs
- Feature usage patterns
- Error logs and crash reports
- PWA installation status

#### Gamification Data
- Achievement unlock timestamps
- Points earned and current level
- Goal creation and completion data
- Activity logs for points calculation

### 1.3 Data Subjects

**Primary Users**:
- Individuals aged 13 and older
- Self-registered users who create accounts voluntarily
- Users from any geographical location (global service)

**Special Categories**:
- Children (13-17): Parental consent required in some jurisdictions
- EU residents: Subject to GDPR protections
- California residents: Subject to CCPA rights

### 1.4 Data Recipients and Third-Party Processors

| Recipient | Purpose | Data Shared | Location | Safeguards |
|-----------|---------|-------------|----------|------------|
| **Supabase** | Database hosting, authentication | All user data except book files | Global (data residency configurable) | DPA, encryption, RLS policies |
| **Google Gemini API** | AI note summarization | Note text only (no PII) | United States | API terms, no data retention |
| **Cloud Storage Provider** | Book file storage | Book files, metadata | Configurable | Encryption at rest and in transit |
| **Analytics Service** (if used) | Usage analytics | Anonymized usage data | Varies | Data anonymization, aggregation |

**No data is sold to third parties.**

### 1.5 Data Retention Periods

| Data Type | Retention Period | Justification |
|-----------|------------------|---------------|
| Account data | Until account deletion | Required for service provision |
| Reading data | Until user deletion or manual removal | User-controlled data |
| Book files | Until user deletion | User-owned content |
| Session logs | 90 days | Security and debugging |
| Analytics data | 24 months (aggregated) | Service improvement |
| Backup data | 30 days after deletion | Data recovery capability |
| Legal holds | As required by law | Compliance obligation |

**Account Deletion**: When users delete their accounts, all personal data is permanently removed within 30 days, except where legal retention requirements apply.

---

## 2. Necessity and Proportionality Assessment

### 2.1 Lawful Basis for Processing (GDPR Article 6)

| Processing Activity | Lawful Basis | Justification |
|---------------------|--------------|---------------|
| Account creation | Consent | User voluntarily creates account |
| Service provision | Contract (Article 6(1)(b)) | Necessary to provide requested service |
| Reading analytics | Legitimate interest (Article 6(1)(f)) | Enhances user experience, can be opted out |
| AI summarization | Consent | User explicitly requests feature |
| Security measures | Legitimate interest | Protects user data and service integrity |
| Legal compliance | Legal obligation (Article 6(1)(c)) | DMCA, copyright law compliance |

### 2.2 Data Minimization

**Principle**: We collect only data necessary for stated purposes.

**Examples**:
- ✅ Email required: Necessary for account recovery and communication
- ✅ Reading progress: Core feature of the service
- ✅ Device info: Necessary for technical support and compatibility
- ❌ Phone number: Not collected (not necessary)
- ❌ Physical address: Not collected except for business contact
- ❌ Social security number: Never collected
- ❌ Biometric data: Never collected

### 2.3 Purpose Limitation

Data collected for one purpose is not used for unrelated purposes without user consent:
- Reading data used only for service features, not for advertising
- Email addresses used only for service communications, not sold to marketers
- Analytics used only for service improvement, not for user profiling

### 2.4 Storage Limitation

Data is not kept longer than necessary:
- Active accounts: Data retained for service provision
- Deleted accounts: Data purged within 30 days
- Inactive accounts: Retention policy to be defined (recommend deletion after 3 years of inactivity)

---

## 3. Risk Assessment

### 3.1 Identified Privacy Risks

#### Risk 1: Unauthorized Access to Book Collections
**Description**: User-uploaded books may contain sensitive or private information.
**Impact**: High (exposure of personal reading materials, potentially embarrassing or sensitive content)
**Likelihood**: Medium (depends on security measures)
**Risk Score**: **High**

**Mitigations**:
- ✅ End-to-end encryption for book files at rest
- ✅ Secure authentication (bcrypt password hashing, JWT tokens)
- ✅ Row-Level Security (RLS) policies in Supabase
- ✅ HTTPS encryption for all data in transit
- ⚠️ Consider: Additional file-level encryption for books

#### Risk 2: AI Processing Privacy Concerns
**Description**: Notes sent to Google Gemini API for summarization may contain personal information.
**Impact**: Medium (potential exposure of note content to third party)
**Likelihood**: Low (Google's data handling policies)
**Risk Score**: **Medium**

**Mitigations**:
- ✅ User consent required before AI processing
- ✅ Only note text sent (no PII like name, email)
- ✅ Google Gemini API does not store data per terms
- ✅ Clear disclosure of AI processing in Privacy Policy
- ✅ Opt-in feature (not automatic)

#### Risk 3: Reading Habits Profiling
**Description**: Reading statistics reveal personal interests, reading habits, and potentially sensitive preferences.
**Impact**: Medium (privacy concerns, potential misuse for profiling)
**Likelihood**: Low (data not shared or sold)
**Risk Score**: **Medium**

**Mitigations**:
- ✅ Reading data private to each user (not shared publicly)
- ✅ No social features that expose reading history
- ✅ No advertising or data selling
- ✅ User control to delete reading statistics
- ⚠️ Recommendation: Add ability to disable analytics collection

#### Risk 4: Data Breach / Unauthorized Access
**Description**: Hacking, insider threat, or system vulnerability could expose user data.
**Impact**: Very High (exposure of all user data, including books and notes)
**Likelihood**: Low (with proper security measures)
**Risk Score**: **Medium-High**

**Mitigations**:
- ✅ Database-level encryption (Supabase)
- ✅ Strong authentication mechanisms
- ✅ Regular security updates
- ✅ Access logging and monitoring
- ⚠️ Recommendation: Implement intrusion detection
- ⚠️ Recommendation: Regular security audits
- ⚠️ Recommendation: Incident response plan

#### Risk 5: Third-Party Service Risks
**Description**: Reliance on Supabase and Google Gemini introduces third-party data processing risks.
**Impact**: Medium (dependent on third-party security)
**Likelihood**: Low (reputable providers with strong security)
**Risk Score**: **Low-Medium**

**Mitigations**:
- ✅ Data Processing Agreements (DPAs) with vendors
- ✅ Vendors comply with GDPR (Supabase, Google)
- ✅ Standard Contractual Clauses for international transfers
- ✅ Regular vendor security reviews
- ⚠️ Recommendation: Diversification strategy for critical services

#### Risk 6: Children's Data (Ages 13-17)
**Description**: Special protections required for data of minors.
**Impact**: High (regulatory penalties, child safety concerns)
**Likelihood**: Medium (some users will be minors)
**Risk Score**: **Medium-High**

**Mitigations**:
- ✅ Minimum age requirement (13+) in Terms of Service
- ✅ Parental consent requirement in Privacy Policy
- ⚠️ Recommendation: Age verification mechanism
- ⚠️ Recommendation: Simplified privacy notice for children
- ⚠️ Recommendation: Enhanced data protection for users under 18

#### Risk 7: User Content Copyright Violations
**Description**: Users may upload pirated or copyrighted books.
**Impact**: Medium (legal liability, DMCA violations)
**Likelihood**: Medium (depends on user behavior)
**Risk Score**: **Medium**

**Mitigations**:
- ✅ Terms of Service prohibit copyright infringement
- ✅ DMCA takedown procedures in place
- ✅ User agreement to legal ownership
- ✅ Repeat infringer policy
- ⚠️ Recommendation: Copyright compliance monitoring tools

---

### 3.2 Risk Matrix Summary

| Risk | Impact | Likelihood | Risk Level | Priority |
|------|--------|------------|------------|----------|
| Unauthorized access to books | High | Medium | **High** | 1 |
| Children's data protection | High | Medium | **Medium-High** | 2 |
| Data breach | Very High | Low | **Medium-High** | 2 |
| AI processing privacy | Medium | Low | **Medium** | 3 |
| Reading habits profiling | Medium | Low | **Medium** | 3 |
| Copyright violations | Medium | Medium | **Medium** | 3 |
| Third-party service risks | Medium | Low | **Low-Medium** | 4 |

---

## 4. Compliance with Data Protection Principles

### 4.1 Lawfulness, Fairness, and Transparency

**Compliance Measures**:
- ✅ Clear Privacy Policy explaining all data collection and use
- ✅ Transparent consent mechanisms for optional features (AI summarization)
- ✅ User-friendly language (avoiding legal jargon where possible)
- ✅ Privacy Policy available before account creation
- ⚠️ Recommendation: Layered privacy notice (summary + full policy)

### 4.2 Purpose Limitation

**Compliance Measures**:
- ✅ Data used only for stated purposes in Privacy Policy
- ✅ No selling of user data to third parties
- ✅ Separate consent required for new purposes (e.g., AI features)

### 4.3 Data Minimization

**Compliance Measures**:
- ✅ Only essential data collected (email, name, password)
- ✅ Optional data clearly marked (avatar, AI summaries)
- ✅ No collection of unnecessary data (phone, address, etc.)

### 4.4 Accuracy

**Compliance Measures**:
- ✅ Users can update profile information at any time
- ✅ Email verification on account creation
- ⚠️ Recommendation: Periodic reminder to review account data

### 4.5 Storage Limitation

**Compliance Measures**:
- ✅ Clear retention periods defined
- ✅ Account deletion functionality provided
- ✅ Data purged within 30 days of deletion request
- ⚠️ Recommendation: Inactive account policy (delete after 3 years)

### 4.6 Integrity and Confidentiality (Security)

**Compliance Measures**:
- ✅ Encryption at rest and in transit
- ✅ Strong password hashing (bcrypt)
- ✅ Row-Level Security (RLS) in database
- ✅ Regular security updates
- ⚠️ Recommendation: Security audit and penetration testing
- ⚠️ Recommendation: Multi-factor authentication (MFA)

### 4.7 Accountability

**Compliance Measures**:
- ✅ This DPIA document
- ✅ Privacy Policy and Terms of Service
- ✅ Data Processing Agreements with vendors
- ✅ Designated Data Protection Officer contact
- ⚠️ Recommendation: Data protection training for staff
- ⚠️ Recommendation: Regular compliance audits

---

## 5. Data Subject Rights (GDPR Chapter 3)

Literati supports the following data subject rights:

| Right | Implementation | How Users Exercise |
|-------|---------------|-------------------|
| **Right to be Informed** (Art. 13-14) | ✅ Privacy Policy, clear notices | Automatic (policy available) |
| **Right of Access** (Art. 15) | ✅ Users can view all their data in app | Request via info@literati.pro |
| **Right to Rectification** (Art. 16) | ✅ Profile editing in settings | In-app profile settings |
| **Right to Erasure** (Art. 17) | ✅ Account deletion feature | In-app account deletion + email request |
| **Right to Restrict Processing** (Art. 18) | ⚠️ Partial (can disable features) | Contact info@literati.pro |
| **Right to Data Portability** (Art. 20) | ⚠️ To be implemented | Request via info@literati.pro |
| **Right to Object** (Art. 21) | ✅ Opt-out of analytics, AI features | In-app settings |
| **Rights Related to Automated Decision-Making** (Art. 22) | ✅ N/A (no automated decisions affecting users) | Not applicable |

**Response Time**: 30 days maximum (as required by GDPR)

**Recommendations**:
- ⚠️ Implement automated data export feature (JSON/CSV)
- ⚠️ Create self-service dashboard for data access requests
- ⚠️ Add granular processing restriction controls

---

## 6. Security Measures

### 6.1 Technical Measures

| Measure | Status | Description |
|---------|--------|-------------|
| **Encryption in Transit** | ✅ Implemented | HTTPS/TLS for all communications |
| **Encryption at Rest** | ✅ Implemented | Database and file storage encrypted |
| **Password Security** | ✅ Implemented | bcrypt hashing, strong password requirements |
| **Authentication** | ✅ Implemented | JWT tokens, session management |
| **Access Control** | ✅ Implemented | Row-Level Security (RLS) policies |
| **Input Validation** | ✅ Implemented | Prevents injection attacks |
| **File Upload Security** | ✅ Implemented | File type validation, size limits |
| **Multi-Factor Authentication** | ⚠️ Recommended | Not yet implemented |
| **Intrusion Detection** | ⚠️ Recommended | Not yet implemented |
| **Security Monitoring** | ⚠️ Recommended | Basic logging in place |

### 6.2 Organizational Measures

| Measure | Status | Description |
|---------|--------|-------------|
| **Privacy Policy** | ✅ Implemented | Comprehensive, GDPR-compliant |
| **Terms of Service** | ✅ Implemented | Clear user responsibilities |
| **Data Processing Agreements** | ✅ Required | With Supabase, Google |
| **Incident Response Plan** | ⚠️ Recommended | To be formalized |
| **Staff Training** | ⚠️ Recommended | Data protection awareness |
| **Regular Audits** | ⚠️ Recommended | Annual security and privacy review |
| **Vendor Management** | ⚠️ Recommended | Regular vendor security assessments |

### 6.3 Breach Notification Procedures

**GDPR Requirement**: Notify supervisory authority within 72 hours of becoming aware of a breach (Article 33)

**Procedure**:
1. **Detection**: Monitor for unauthorized access, data leaks, system anomalies
2. **Assessment**: Evaluate breach severity, affected users, data types
3. **Containment**: Immediately stop breach, secure systems
4. **Notification**:
   - Supervisory authority within 72 hours (if high risk)
   - Affected users without undue delay (if high risk to rights/freedoms)
5. **Documentation**: Record breach details, actions taken, effects
6. **Remediation**: Fix vulnerabilities, implement additional safeguards

**Recommendation**: ⚠️ Formalize incident response plan with specific roles and responsibilities

---

## 7. International Data Transfers

### 7.1 Transfer Mechanisms

Literati may transfer data internationally depending on hosting configuration:

| Transfer | From | To | Mechanism | Status |
|----------|------|-----|-----------|--------|
| Database hosting | EU/Other | Varies (Supabase) | Standard Contractual Clauses (SCCs) | ✅ |
| AI processing | Any | United States (Google) | SCCs, adequacy decision | ✅ |
| Cloud storage | Any | Configurable | SCCs, encryption | ✅ |

### 7.2 Adequacy Decisions

- **United States**: No general adequacy decision (post-Schrems II)
- **Mitigation**: Use Standard Contractual Clauses, supplementary measures (encryption)

### 7.3 Recommendations

- ⚠️ Offer EU-only hosting option for EU users (data residency)
- ⚠️ Conduct Transfer Impact Assessments (TIAs) for non-adequate countries
- ⚠️ Review international transfers annually as regulations evolve

---

## 8. Consultation and Stakeholder Input

### 8.1 Internal Stakeholders Consulted

- **Development Team**: Confirmed technical measures and data flows
- **Legal/Compliance**: Reviewed GDPR and CCPA requirements
- **Data Protection Officer**: Overall DPIA review and approval

### 8.2 External Consultation

Not required at this stage (no high-risk processing requiring supervisory authority consultation per GDPR Article 36).

**If required**: Consult with relevant supervisory authority if residual high risks cannot be mitigated.

---

## 9. Recommendations and Action Plan

### 9.1 High Priority (Implement Within 3 Months)

| Action | Rationale | Owner | Deadline |
|--------|-----------|-------|----------|
| Implement data export feature | GDPR data portability right | Development Team | January 3, 2026 |
| Formalize incident response plan | GDPR breach notification requirement | DPO | December 3, 2025 |
| Add age verification mechanism | Children's privacy protection | Development Team | January 3, 2026 |
| Implement MFA (optional) | Enhanced account security | Development Team | January 3, 2026 |

### 9.2 Medium Priority (Implement Within 6 Months)

| Action | Rationale | Owner | Deadline |
|--------|-----------|-------|----------|
| Add analytics opt-out setting | User control over data processing | Development Team | April 3, 2026 |
| Security audit and penetration test | Identify vulnerabilities | External Auditor | April 3, 2026 |
| Inactive account deletion policy | Storage limitation principle | DPO | March 3, 2026 |
| Enhanced file-level encryption | Book privacy protection | Development Team | April 3, 2026 |

### 9.3 Low Priority (Implement Within 12 Months)

| Action | Rationale | Owner | Deadline |
|--------|-----------|-------|----------|
| Intrusion detection system | Proactive security monitoring | Development Team | October 3, 2026 |
| Staff data protection training | Organizational accountability | DPO | October 3, 2026 |
| EU-only hosting option | Data residency for EU users | Infrastructure Team | October 3, 2026 |
| Automated compliance audits | Ongoing accountability | Development Team | October 3, 2026 |

---

## 10. Approval and Sign-Off

### 10.1 DPIA Outcome

**Decision**: ✅ **Proceed with processing, subject to implementation of recommended safeguards**

**Justification**:
- Privacy risks are manageable with identified mitigations
- Substantial user benefits (digital library, reading tracking, gamification)
- Appropriate technical and organizational measures in place
- User rights are respected and can be exercised
- Compliance with GDPR, CCPA, and other applicable laws

### 10.2 Residual Risks

After implementing all high and medium priority recommendations, residual risks include:
- Low risk of data breach (inherent to any online service)
- Low risk of third-party service failures (mitigated by vendor selection)

**Acceptance**: These residual risks are acceptable given the benefits provided to users and the safeguards in place.

### 10.3 Review Schedule

**Next Review Date**: October 3, 2026 (annual review)

**Trigger for Ad-Hoc Review**:
- Significant feature changes (e.g., adding social features, advertising)
- New data processing activities
- Data breach or security incident
- Changes to applicable laws or regulations
- New privacy risks identified

---

## 11. Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | October 3, 2025 | Data Protection Officer | Initial DPIA |

---

## 12. Contact Information

**Data Protection Officer**
Email: info@literati.pro
Address: 628 Montreal Court, Brownsville, Texas 78526

**Supervisory Authority** (for EU users)
Identify relevant authority based on user location or establishment of controller

---

*This Data Protection Impact Assessment was completed in accordance with GDPR Article 35 and represents a good-faith effort to identify and mitigate privacy risks associated with the Literati application.*
