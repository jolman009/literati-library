# Legal & Compliance Documentation
## Literati Digital Library Application

**Last Updated**: October 3, 2025
**Organization**: Literati
**Contact**: info@literati.pro

---

## Overview

This directory contains all legal, compliance, and regulatory documentation for the Literati application. These documents ensure compliance with privacy laws (GDPR, CCPA), content rating requirements, and provide clear terms for users.

---

## Documents Index

### 1. Privacy Policy
**File**: [privacy-policy.md](./privacy-policy.md)
**Status**: ✅ Complete and up-to-date
**Last Updated**: October 3, 2025

**Purpose**: Explains how Literati collects, uses, and protects user data.

**Key Sections**:
- Information collection (account, reading data, technical data)
- How data is used (service provision, gamification, AI features)
- Data sharing and disclosure (limited to service providers)
- User privacy rights (GDPR, CCPA compliance)
- Security measures
- Cookie usage
- International data transfers

**User Visibility**: Displayed at `/legal/privacy` and linked from signup/settings.

---

### 2. Terms of Service
**File**: [terms-of-service.md](./terms-of-service.md)
**Status**: ✅ Complete and up-to-date
**Last Updated**: October 3, 2025

**Purpose**: Legal agreement between Literati and users governing service use.

**Key Sections**:
- User responsibilities and prohibited activities
- Intellectual property rights (user content, app ownership)
- Copyright compliance and DMCA policy
- Limitation of liability and disclaimers
- Dispute resolution and governing law (Texas, USA)
- Account termination procedures
- Data portability and export

**User Visibility**: Displayed at `/legal/terms` and must be accepted during signup.

**Governing Law**: State of Texas, United States
**Jurisdiction**: Cameron County, Texas

---

### 3. IARC Content Rating Documentation
**File**: [iarc-content-rating.md](./iarc-content-rating.md)
**Status**: ✅ Ready for submission
**Date Prepared**: October 3, 2025

**Purpose**: Guide for obtaining age ratings from IARC (International Age Rating Coalition).

**Contents**:
- Complete IARC questionnaire with recommended responses
- Expected ratings (ESRB: E, PEGI: 3, USK: 0, etc.)
- Post-rating requirements (display, maintenance)
- User content disclaimer
- Annual review schedule

**Action Required**:
- Submit questionnaire at [IARC Portal](https://www.globalratings.com/)
- Download and store certificates in `legal/iarc-certificates/`
- Update app store listings with ratings

**Expected Ratings**:
| Region | System | Rating |
|--------|--------|--------|
| US/Canada | ESRB | Everyone (E) |
| Europe | PEGI | PEGI 3 |
| Germany | USK | USK 0 |
| Brazil | ClassInd | L (Livre) |
| Australia | ACB | G (General) |
| South Korea | GRAC | All |

---

### 4. Data Protection Impact Assessment (DPIA)
**File**: [data-protection-impact-assessment.md](./data-protection-impact-assessment.md)
**Status**: ✅ Complete
**Assessment Date**: October 3, 2025
**Next Review**: October 3, 2026

**Purpose**: Comprehensive privacy risk assessment required by GDPR Article 35.

**Key Findings**:
- **Risk Level**: Medium (manageable with safeguards)
- **Identified Risks**: Unauthorized book access, AI processing privacy, data breaches
- **Mitigations**: Encryption, RLS policies, consent mechanisms, security monitoring
- **Outcome**: ✅ Proceed with processing, subject to recommended safeguards

**Action Items**:
| Priority | Action | Deadline |
|----------|--------|----------|
| High | Implement data export feature | January 3, 2026 |
| High | Formalize incident response plan | December 3, 2025 |
| High | Add age verification mechanism | January 3, 2026 |
| Medium | Security audit | April 3, 2026 |
| Medium | Inactive account deletion policy | March 3, 2026 |

**User Rights Supported**:
- ✅ Right to access
- ✅ Right to rectification
- ✅ Right to erasure (account deletion)
- ✅ Right to object
- ⚠️ Right to data portability (to be implemented)

---

### 5. Cookie Consent Implementation Guide
**File**: [cookie-consent-implementation.md](./cookie-consent-implementation.md)
**Status**: ✅ Complete (implementation pending)
**Date Prepared**: October 3, 2025

**Purpose**: Technical guide for implementing GDPR-compliant cookie consent.

**Key Contents**:
- Complete cookie inventory (necessary vs. functional cookies)
- UI/UX designs for consent banner and preferences modal
- Implementation code structure and examples
- Compliance checklist (GDPR, CCPA, LGPD)
- Testing guidelines (functional, browser, accessibility)

**Cookies Used**:
| Cookie | Category | Consent Required? |
|--------|----------|-------------------|
| auth_token | Strictly Necessary | ❌ No |
| session_id | Strictly Necessary | ❌ No |
| theme_preference | Functional | ✅ Yes |
| reading_position | Functional | ✅ Yes |
| cookie_consent | Strictly Necessary | ❌ No |

**Implementation Status**:
- ✅ Documentation complete
- ⚠️ Code implementation pending (see timeline in document)
- ⚠️ Cookie Policy page to be created at `/legal/cookies`

---

## Compliance Summary

### GDPR Compliance (European Union)
**Status**: ✅ Compliant

**Requirements Met**:
- ✅ Privacy Policy with clear data processing disclosures
- ✅ Lawful basis for processing (consent, contract, legitimate interest)
- ✅ User rights implementation (access, rectification, erasure)
- ✅ Data Protection Impact Assessment completed
- ✅ Cookie consent mechanism documented
- ✅ Data Processing Agreements with vendors (Supabase, Google)
- ✅ Breach notification procedures defined
- ✅ Data retention and deletion policies

**Pending**:
- ⚠️ Data export feature (data portability) - Due: January 3, 2026
- ⚠️ Cookie consent UI implementation - Due: Week 5 (see timeline)

---

### CCPA Compliance (California, USA)
**Status**: ✅ Compliant

**Requirements Met**:
- ✅ Privacy Policy with CCPA-specific rights disclosure
- ✅ Right to know what data is collected
- ✅ Right to delete personal information
- ✅ No sale of personal information (and clear disclosure)
- ✅ Non-discrimination for exercising rights
- ✅ Contact information for privacy requests (info@literati.pro)

---

### COPPA Compliance (Children's Privacy)
**Status**: ✅ Compliant

**Requirements Met**:
- ✅ Minimum age requirement (13+) in Terms of Service
- ✅ Parental consent requirement for users under 18
- ✅ No collection of sensitive data from children
- ✅ Clear privacy disclosures

**Recommendation**:
- ⚠️ Implement age verification mechanism (Due: January 3, 2026)

---

### ePrivacy Directive (Cookie Law)
**Status**: ⚠️ Implementation Pending

**Requirements Met**:
- ✅ Cookie inventory completed
- ✅ Implementation guide created
- ✅ Consent mechanism designed

**Pending**:
- ⚠️ Cookie consent banner implementation
- ⚠️ Cookie Policy page creation

---

### DMCA Compliance (Copyright)
**Status**: ✅ Compliant

**Requirements Met**:
- ✅ DMCA policy in Terms of Service
- ✅ Designated DMCA agent (info@literati.pro)
- ✅ Takedown procedures documented
- ✅ Counter-notification process defined
- ✅ Repeat infringer policy

---

## Contact Information

### General Inquiries
**Email**: info@literati.pro
**Address**: 628 Montreal Court, Brownsville, Texas 78526

### Privacy & Data Protection
**Data Protection Officer**: info@literati.pro
**Privacy Requests**: info@literati.pro
**DMCA Agent**: info@literati.pro

### Legal
**Governing Law**: State of Texas, United States
**Jurisdiction**: Cameron County, Texas

---

## Maintenance Schedule

### Annual Reviews (Every October 3)
- [ ] Review Privacy Policy for accuracy
- [ ] Review Terms of Service for updates
- [ ] Update Data Protection Impact Assessment (DPIA)
- [ ] Re-submit IARC questionnaire if features changed
- [ ] Audit cookie usage and update Cookie Policy
- [ ] Review vendor Data Processing Agreements
- [ ] Check for regulatory changes (GDPR, CCPA updates)

### Trigger-Based Reviews (When These Occur)
- [ ] New features added (especially social, payment, advertising)
- [ ] New data processing activities
- [ ] Data breach or security incident
- [ ] Changes to privacy laws or regulations
- [ ] User complaints or privacy requests
- [ ] Change of service providers (Supabase, Google, etc.)

---

## Implementation Roadmap

### Immediate (Completed ✅)
- ✅ Privacy Policy updated with contact info and dates
- ✅ Terms of Service updated with jurisdiction and contact info
- ✅ IARC questionnaire prepared
- ✅ DPIA completed and risks assessed
- ✅ Cookie consent implementation guide created

### Short-Term (Next 3 Months)
Priority: High

- [ ] Implement cookie consent banner (Week 1-5)
- [ ] Create Cookie Policy page (Week 2)
- [ ] Implement data export feature (by January 3, 2026)
- [ ] Formalize incident response plan (by December 3, 2025)
- [ ] Submit IARC questionnaire and obtain certificates
- [ ] Add age verification mechanism (by January 3, 2026)

### Medium-Term (3-6 Months)
Priority: Medium

- [ ] Conduct security audit and penetration testing (by April 3, 2026)
- [ ] Implement inactive account deletion policy (by March 3, 2026)
- [ ] Add analytics opt-out settings (by April 3, 2026)
- [ ] Implement enhanced file-level encryption (by April 3, 2026)

### Long-Term (6-12 Months)
Priority: Low

- [ ] Intrusion detection system (by October 3, 2026)
- [ ] Staff data protection training (by October 3, 2026)
- [ ] EU-only hosting option for data residency (by October 3, 2026)
- [ ] Automated compliance audits (by October 3, 2026)

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | October 3, 2025 | Initial creation of all legal documents | Literati Team |

---

## Additional Resources

### Regulatory Authorities

**GDPR (EU)**
- Website: [ec.europa.eu/info/law/law-topic/data-protection](https://ec.europa.eu/info/law/law-topic/data-protection)
- Supervisory Authorities: [edpb.europa.eu](https://edpb.europa.eu/)

**CCPA (California)**
- Website: [oag.ca.gov/privacy/ccpa](https://oag.ca.gov/privacy/ccpa)
- Attorney General: California Department of Justice

**IARC (Content Ratings)**
- Website: [globalratings.com](https://www.globalratings.com/)
- Support: support@globalratings.com

### Legal Templates and Guides

- **GDPR Info**: [gdpr-info.eu](https://gdpr-info.eu/)
- **Privacy Policy Generator**: [termsfeed.com](https://www.termsfeed.com/)
- **DMCA Guidance**: [dmca.com](https://www.dmca.com/)

---

*This README provides an overview of Literati's legal and compliance documentation. For detailed information, refer to individual documents listed above.*
