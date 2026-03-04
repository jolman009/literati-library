import { useState, useEffect } from 'react';
import { get, remove, onChanged, KEYS } from '../config/storage.js';
import LoginForm from '../components/LoginForm.jsx';
import { BookOpen, LogOut, ExternalLink } from 'lucide-react';
import './popup.css';

export default function Popup() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load auth state on mount
  useEffect(() => {
    (async () => {
      const token = await get(KEYS.ACCESS_TOKEN);
      const storedUser = await get(KEYS.USER);
      if (token && storedUser) {
        setUser(storedUser);
      }
      setLoading(false);
    })();
  }, []);

  // Listen for storage changes (e.g. background worker refreshes token)
  useEffect(() => {
    onChanged((changes) => {
      if (changes[KEYS.USER]) {
        setUser(changes[KEYS.USER].newValue ?? null);
      }
      if (changes[KEYS.ACCESS_TOKEN] && !changes[KEYS.ACCESS_TOKEN].newValue) {
        setUser(null);
      }
    });
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleSignOut = async () => {
    await remove(KEYS.ACCESS_TOKEN);
    await remove(KEYS.REFRESH_TOKEN);
    await remove(KEYS.USER);
    setUser(null);
  };

  const openShelfQuest = () => {
    chrome.tabs.create({ url: 'https://shelfquest.org' });
  };

  if (loading) {
    return (
      <div className="popup">
        <div className="popup-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="popup">
      <header className="popup-header">
        <BookOpen size={24} className="popup-logo" />
        <h1 className="popup-title">ShelfQuest</h1>
      </header>

      <main className="popup-body">
        {user ? (
          <div className="popup-authenticated">
            <p className="popup-greeting">
              Hello, <strong>{user.name || user.email}</strong>
            </p>

            <button className="btn btn-primary" onClick={openShelfQuest}>
              <ExternalLink size={16} />
              Open ShelfQuest
            </button>

            <button className="btn btn-secondary" onClick={handleSignOut}>
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        ) : (
          <LoginForm onSuccess={handleLoginSuccess} />
        )}
      </main>

      <footer className="popup-footer">
        <a
          href="https://shelfquest.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          shelfquest.org
        </a>
      </footer>
    </div>
  );
}
