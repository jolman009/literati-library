import { useState, useEffect, useCallback } from 'react';
import { get, remove, onChanged, KEYS } from '../config/storage.js';
import LoginForm from '../components/LoginForm.jsx';
import { BookOpen, LogOut, ExternalLink, Loader, CheckCircle, AlertCircle, LogIn } from 'lucide-react';
import './popup.css';

const STATUS_AUTO_CLEAR_MS = 4000;

export default function Popup() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clipStatus, setClipStatus] = useState(null);

  // Clear clip status after timeout
  const scheduleClear = useCallback((status) => {
    if (status && (status.state === 'saved' || status.state === 'error')) {
      setTimeout(async () => {
        await remove(KEYS.CLIP_STATUS);
        setClipStatus(null);
      }, STATUS_AUTO_CLEAR_MS);
    }
  }, []);

  // Load auth state + clip status on mount
  useEffect(() => {
    (async () => {
      const token = await get(KEYS.ACCESS_TOKEN);
      const storedUser = await get(KEYS.USER);
      if (token && storedUser) {
        setUser(storedUser);
      }
      const status = await get(KEYS.CLIP_STATUS);
      if (status) {
        setClipStatus(status);
        scheduleClear(status);
      }
      setLoading(false);
    })();
  }, [scheduleClear]);

  // Listen for storage changes
  useEffect(() => {
    onChanged((changes) => {
      if (changes[KEYS.USER]) {
        setUser(changes[KEYS.USER].newValue ?? null);
      }
      if (changes[KEYS.ACCESS_TOKEN] && !changes[KEYS.ACCESS_TOKEN].newValue) {
        setUser(null);
      }
      if (changes[KEYS.CLIP_STATUS]) {
        const newStatus = changes[KEYS.CLIP_STATUS].newValue ?? null;
        setClipStatus(newStatus);
        scheduleClear(newStatus);
      }
    });
  }, [scheduleClear]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleSignOut = async () => {
    await remove(KEYS.ACCESS_TOKEN);
    await remove(KEYS.REFRESH_TOKEN);
    await remove(KEYS.USER);
    await remove(KEYS.CLIP_STATUS);
    setUser(null);
    setClipStatus(null);
  };

  const openShelfQuest = () => {
    chrome.tabs.create({ url: 'https://shelfquest.org' });
  };

  const dismissStatus = async () => {
    await remove(KEYS.CLIP_STATUS);
    setClipStatus(null);
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

      {clipStatus && (
        <div
          className={`clip-status clip-status--${clipStatus.state}`}
          onClick={dismissStatus}
          role="status"
          aria-live="polite"
        >
          {clipStatus.state === 'pending' && (
            <>
              <Loader size={16} className="clip-status-icon spin" />
              <span>Saving clipping...</span>
            </>
          )}
          {clipStatus.state === 'saved' && (
            <>
              <CheckCircle size={16} className="clip-status-icon" />
              <span>Saved to ShelfQuest!</span>
            </>
          )}
          {clipStatus.state === 'error' && (
            <>
              <AlertCircle size={16} className="clip-status-icon" />
              <span>{clipStatus.message || 'Failed to save'}</span>
            </>
          )}
          {clipStatus.state === 'unauthenticated' && (
            <>
              <LogIn size={16} className="clip-status-icon" />
              <span>Sign in to clip pages</span>
            </>
          )}
        </div>
      )}

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
