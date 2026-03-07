import { useState, useEffect, useCallback } from 'react';
import { get, set, onChanged, KEYS } from '../config/storage.js';
import LoginForm from '../components/LoginForm.jsx';
import { BookOpen, RefreshCw, LogIn, Library, Sparkles } from 'lucide-react';

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(null);

  // Load auth state on mount
  useEffect(() => {
    (async () => {
      const token = await get(KEYS.ACCESS_TOKEN);
      const storedUser = await get(KEYS.USER);
      if (token && storedUser) {
        setUser(storedUser);
      }
      // Load cached reading queue
      const cached = await get(KEYS.READING_QUEUE);
      if (cached?.items) {
        setQueue(cached.items);
      }
      setLoading(false);
    })();
  }, []);

  // Watch for auth changes
  useEffect(() => {
    onChanged((changes) => {
      if (changes[KEYS.USER]) {
        setUser(changes[KEYS.USER].newValue ?? null);
      }
      if (changes[KEYS.ACCESS_TOKEN] && !changes[KEYS.ACCESS_TOKEN].newValue) {
        setUser(null);
        setQueue([]);
      }
      if (changes[KEYS.READING_QUEUE]) {
        const rq = changes[KEYS.READING_QUEUE].newValue;
        if (rq?.items) setQueue(rq.items);
      }
    });
  }, []);

  // Get current tab context
  const captureTabContext = useCallback(async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        setActiveTab({ url: tab.url, title: tab.title, favIconUrl: tab.favIconUrl });
        return { url: tab.url, title: tab.title };
      }
    } catch {
      // Tab query may fail in some contexts
    }
    return null;
  }, []);

  // Fetch reading queue from background
  const refreshQueue = useCallback(async () => {
    setQueueLoading(true);
    try {
      const tabContext = await captureTabContext();
      const response = await chrome.runtime.sendMessage({
        type: 'GET_READING_QUEUE',
        payload: tabContext,
      });
      if (response?.success && response.data) {
        setQueue(response.data);
        await set(KEYS.READING_QUEUE, { items: response.data, ts: Date.now() });
      }
    } catch (err) {
      console.error('[Sidebar] Failed to refresh queue:', err.message);
    } finally {
      setQueueLoading(false);
    }
  }, [captureTabContext]);

  // Auto-refresh on mount when authenticated
  useEffect(() => {
    if (user && queue.length === 0) {
      refreshQueue();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  if (loading) {
    return (
      <div className="sidebar">
        <div className="sidebar-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <header className="sidebar-header">
        <BookOpen size={20} className="sidebar-logo" />
        <h1 className="sidebar-title">ShelfQuest</h1>
        <button
          className="sidebar-refresh"
          onClick={refreshQueue}
          disabled={queueLoading || !user}
          aria-label="Refresh reading queue"
        >
          <RefreshCw size={16} className={queueLoading ? 'spin' : ''} />
        </button>
      </header>

      {activeTab && (
        <div className="sidebar-context">
          {activeTab.favIconUrl && (
            <img src={activeTab.favIconUrl} alt="" width="14" height="14" className="sidebar-context-favicon" />
          )}
          <span className="sidebar-context-title">{activeTab.title}</span>
        </div>
      )}

      <main className="sidebar-body">
        {!user ? (
          <div className="sidebar-unauthenticated">
            <LogIn size={32} className="sidebar-empty-icon" />
            <p>Sign in to see your reading queue</p>
            <LoginForm onSuccess={handleLoginSuccess} />
          </div>
        ) : queue.length === 0 ? (
          <div className="sidebar-empty">
            <Library size={32} className="sidebar-empty-icon" />
            <p className="sidebar-empty-text">
              {queueLoading ? 'Loading your library...' : 'Your reading queue is empty'}
            </p>
            {!queueLoading && (
              <p className="sidebar-empty-hint">
                Add books to your ShelfQuest library to see AI-powered reading suggestions here.
              </p>
            )}
          </div>
        ) : (
          <div className="sidebar-queue">
            {queue.map((item, i) => (
              <div key={item.id || i} className="queue-item">
                <div className="queue-item-cover">
                  {item.cover_url ? (
                    <img src={item.cover_url} alt="" className="queue-item-cover-img" />
                  ) : (
                    <div className="queue-item-cover-placeholder">
                      <BookOpen size={16} />
                    </div>
                  )}
                </div>
                <div className="queue-item-info">
                  <span className="queue-item-title">{item.title}</span>
                  <span className="queue-item-author">{item.author}</span>
                  {item.progress != null && (
                    <div className="queue-item-progress">
                      <div
                        className="queue-item-progress-bar"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                {item.ai_reason && (
                  <div className="queue-item-reason">
                    <Sparkles size={12} />
                    <span>{item.ai_reason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="sidebar-footer">
        <a href="https://shelfquest.org" target="_blank" rel="noopener noreferrer">
          Open ShelfQuest
        </a>
      </footer>
    </div>
  );
}
