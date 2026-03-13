import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEntitlements } from '../contexts/EntitlementsContext';
import GoPremiumCTA from '../components/premium/GoPremiumCTA';
import ThemeSwitcher from '../components/ThemeSwitcher';
import '../styles/settings-page.css';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, deleteAccount } = useAuth();
  const { isPremium, openPremiumModal } = useEntitlements();
  const [requesting, setRequesting] = useState(false);
  const [categories, setCategories] = useState({
    library: false,
    readingHistory: false,
    notes: false,
    highlights: false,
    gamification: false,
    allExceptAccount: false,
  });
  const [additionalInfo, setAdditionalInfo] = useState('');

  const toggleCategory = (key) => setCategories((c) => ({ ...c, [key]: !c[key] }));

  const onRequestDataDeletion = async (e) => {
    e.preventDefault();
    setRequesting(true);
    try {
      const selected = Object.entries(categories)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(', ');

      const email = user?.email || '';
      const subject = encodeURIComponent('Data deletion request (keep account) — ShelfQuest');
      const body = encodeURIComponent([
        `Account email: ${email}`,
        'I request deletion of the following data while keeping my account active:',
        selected || '(no categories selected)',
        '',
        'Additional details:',
        additionalInfo || '(none)'
      ].join('\n'));

      window.location.href = `mailto:info@shelfquest.org?subject=${subject}&body=${body}`;
    } finally {
      setRequesting(false);
    }
  };

  const onDeleteAccount = async () => {
    const confirmed = window.confirm(
      'This will permanently delete your ShelfQuest account and associated data. This action cannot be undone.\n\nDo you want to continue?'
    );
    if (!confirmed) return;
    const password = window.prompt('Please enter your password to confirm account deletion:');
    if (!password) return;
    const result = await deleteAccount(password);
    if (result?.success) {
      alert('Your account has been deleted.');
    } else if (result?.error) {
      alert(`Deletion failed: ${result.error}`);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header-panel">
        <h1 className="settings-page-title">Settings</h1>
        <p className="settings-page-subtitle">Manage your account, privacy, and data controls.</p>
      </div>

      {!isPremium && (
        <section className="settings-section">
          <h2 className="settings-section-title">ShelfQuest Premium</h2>
          <p className="settings-section-desc">Upgrade to unlock AI summaries, advanced analytics, and cross-device sync.</p>
          <ul className="settings-feature-list">
            <li>AI-powered summaries and contextual insights</li>
            <li>Advanced reading stats, goals, and streaks</li>
            <li>Secure backup and sync across devices</li>
            <li>Full note search and export</li>
          </ul>
          <div className="settings-actions">
            <GoPremiumCTA />
            <button className="md3-button md3-button--outlined" onClick={openPremiumModal}>Learn More</button>
          </div>
        </section>
      )}

      <section className="settings-section">
        <h2 className="settings-section-title">Appearance & Themes</h2>
        <p className="settings-section-desc">Customize your reading experience with unlockable themes. Earn points to unlock new color palettes!</p>
        <ThemeSwitcher />
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Help & Support</h2>
        <p className="settings-section-desc">Get answers to common questions or send us feedback.</p>
        <div className="settings-actions">
          <button className="md3-button md3-button--outlined" onClick={() => navigate('/help')}>
            <span className="material-symbols-outlined mr-2">help</span>
            Help & FAQ
          </button>
          <button className="md3-button md3-button--outlined" onClick={() => navigate('/feedback')}>
            <span className="material-symbols-outlined mr-2">feedback</span>
            Send Feedback
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Privacy</h2>
        <p className="settings-section-desc">Control how your data is handled and request deletions.</p>

        <div className="settings-subsection">
          <h3 className="settings-subsection-title">Request data deletion (keep account)</h3>
          <form onSubmit={onRequestDataDeletion} className="settings-form">
            <div className="settings-checkbox-grid">
              <label className="settings-checkbox-label"><input type="checkbox" checked={categories.library} onChange={() => toggleCategory('library')} /> Library (uploaded books + metadata)</label>
              <label className="settings-checkbox-label"><input type="checkbox" checked={categories.readingHistory} onChange={() => toggleCategory('readingHistory')} /> Reading history (progress, bookmarks, sessions)</label>
              <label className="settings-checkbox-label"><input type="checkbox" checked={categories.notes} onChange={() => toggleCategory('notes')} /> Notes</label>
              <label className="settings-checkbox-label"><input type="checkbox" checked={categories.highlights} onChange={() => toggleCategory('highlights')} /> Highlights/annotations</label>
              <label className="settings-checkbox-label"><input type="checkbox" checked={categories.gamification} onChange={() => toggleCategory('gamification')} /> Gamification data</label>
              <label className="settings-checkbox-label"><input type="checkbox" checked={categories.allExceptAccount} onChange={() => toggleCategory('allExceptAccount')} /> Delete all data (keep account)</label>
            </div>

            <div>
              <label className="settings-field-label">Additional details (optional)</label>
              <textarea
                className="settings-textarea"
                rows={4}
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Add any specifics that help us process your request"
              />
            </div>

            <div className="settings-actions">
              <button type="submit" disabled={requesting} className="md3-button md3-button--filled">
                <span className="material-symbols-outlined mr-2">how_to_reg</span>
                Send Request Email
              </button>
              <a className="md3-button md3-button--outlined" href="https://www.shelfquest.org/account-deletion.html" target="_blank" rel="noopener noreferrer">
                <span className="material-symbols-outlined mr-2">link</span>
                Account Deletion Info
              </a>
              <a className="md3-button md3-button--outlined" href="/legal/privacy-policy">
                <span className="material-symbols-outlined mr-2">policy</span>
                Privacy Policy
              </a>
            </div>
          </form>
        </div>

        <hr className="settings-divider" />

        <div>
          <h3 className="settings-subsection-title settings-section-title--error">Delete account</h3>
          <p className="settings-section-desc">Permanently delete your account and all associated data.</p>
          <button onClick={onDeleteAccount} className="md3-button md3-button--tonal settings-section-title--error">
            <span className="material-symbols-outlined mr-2">delete_forever</span>
            Delete Account
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Data Management</h2>
        <p className="settings-section-desc">Export or manage your local data.</p>
        <div className="settings-actions">
          <a className="md3-button md3-button--outlined" href="/settings/data-export">
            <span className="material-symbols-outlined mr-2">download</span>
            Export My Data
          </a>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
