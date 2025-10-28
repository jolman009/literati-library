import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEntitlements } from '../contexts/EntitlementsContext';
import GoPremiumCTA from '../components/premium/GoPremiumCTA';

const SettingsPage = () => {
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
    <div className="container mx-auto px-4 py-6">
      <h1 className="md-headline-medium mb-2">Settings</h1>
      <p className="text-on-surface-variant mb-6">Manage your account, privacy, and data controls.</p>

      {!isPremium && (
        <section className="mb-6 bg-surface-container rounded-medium border border-outline-variant p-4">
          <h2 className="md-title-large mb-2">ShelfQuest Premium</h2>
          <p className="md-body-medium mb-3">Upgrade to unlock AI summaries, advanced analytics, and cross-device sync.</p>
          <ul className="md-body-medium list-disc pl-5 mb-4 space-y-1">
            <li>AI-powered summaries and contextual insights</li>
            <li>Advanced reading stats, goals, and streaks</li>
            <li>Secure backup and sync across devices</li>
            <li>Full note search and export</li>
          </ul>
          <div className="flex items-center gap-3">
            <GoPremiumCTA />
            <button className="md3-button md3-button--outlined" onClick={openPremiumModal}>Learn More</button>
          </div>
        </section>
      )}

      <section className="mb-6 bg-surface-container rounded-medium border border-outline-variant p-4">
        <h2 className="md-title-large mb-2">Privacy</h2>
        <p className="md-body-medium mb-4">Control how your data is handled and request deletions.</p>

        <div className="mb-4">
          <h3 className="md-title-medium mb-2">Request data deletion (keep account)</h3>
          <form onSubmit={onRequestDataDeletion} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2"><input type="checkbox" checked={categories.library} onChange={() => toggleCategory('library')} /> Library (uploaded books + metadata)</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={categories.readingHistory} onChange={() => toggleCategory('readingHistory')} /> Reading history (progress, bookmarks, sessions)</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={categories.notes} onChange={() => toggleCategory('notes')} /> Notes</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={categories.highlights} onChange={() => toggleCategory('highlights')} /> Highlights/annotations</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={categories.gamification} onChange={() => toggleCategory('gamification')} /> Gamification data</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={categories.allExceptAccount} onChange={() => toggleCategory('allExceptAccount')} /> Delete all data (keep account)</label>
            </div>

            <div>
              <label className="md-label-large block mb-1">Additional details (optional)</label>
              <textarea
                className="w-full border border-outline-variant rounded-medium p-2 bg-surface text-on-surface"
                rows={4}
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Add any specifics that help us process your request"
              />
            </div>

            <div className="flex items-center gap-3">
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

        <div className="border-t border-outline-variant my-4" />

        <div>
          <h3 className="md-title-medium mb-2 text-error">Delete account</h3>
          <p className="md-body-medium mb-3">Permanently delete your account and all associated data.</p>
          <button onClick={onDeleteAccount} className="md3-button md3-button--tonal text-error">
            <span className="material-symbols-outlined mr-2">delete_forever</span>
            Delete Account
          </button>
        </div>
      </section>

      <section className="bg-surface-container rounded-medium border border-outline-variant p-4">
        <h2 className="md-title-large mb-2">Data Management</h2>
        <p className="md-body-medium mb-4">Export or manage your local data.</p>
        <div className="flex items-center gap-3">
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
