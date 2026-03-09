import { useState, useEffect, useCallback } from 'react';
import { get, remove, onChanged, KEYS } from '../config/storage.js';
import LoginForm from '../components/LoginForm.jsx';
import QuickNote from './QuickNote.jsx';
import { BookOpen, LogOut, ExternalLink, Loader, CheckCircle, AlertCircle, LogIn, StickyNote, ListTodo } from 'lucide-react';
import './popup.css';

const STATUS_AUTO_CLEAR_MS = 4000;

export default function Popup() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clipStatus, setClipStatus] = useState(null);
  const [noteStatus, setNoteStatus] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);

  // Clear a status after timeout
  const scheduleStatusClear = useCallback((key, setter) => (status) => {
    if (status && (status.state === 'saved' || status.state === 'error')) {
      setTimeout(async () => {
        await remove(key);
        setter(null);
      }, STATUS_AUTO_CLEAR_MS);
    }
  }, []);

  const scheduleClearClip = useCallback((status) => scheduleStatusClear(KEYS.CLIP_STATUS, setClipStatus)(status), [scheduleStatusClear]);
  const scheduleClearNote = useCallback((status) => scheduleStatusClear(KEYS.NOTE_STATUS, setNoteStatus)(status), [scheduleStatusClear]);
  const scheduleClearTask = useCallback((status) => scheduleStatusClear(KEYS.TASK_STATUS, setTaskStatus)(status), [scheduleStatusClear]);

  // Load auth state + statuses on mount
  useEffect(() => {
    (async () => {
      const token = await get(KEYS.ACCESS_TOKEN);
      const storedUser = await get(KEYS.USER);
      if (token && storedUser) {
        setUser(storedUser);
      }
      const cs = await get(KEYS.CLIP_STATUS);
      if (cs) { setClipStatus(cs); scheduleClearClip(cs); }
      const ns = await get(KEYS.NOTE_STATUS);
      if (ns) { setNoteStatus(ns); scheduleClearNote(ns); }
      const ts = await get(KEYS.TASK_STATUS);
      if (ts) { setTaskStatus(ts); scheduleClearTask(ts); }
      setLoading(false);
    })();
  }, [scheduleClearClip, scheduleClearNote, scheduleClearTask]);

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
        const s = changes[KEYS.CLIP_STATUS].newValue ?? null;
        setClipStatus(s);
        scheduleClearClip(s);
      }
      if (changes[KEYS.NOTE_STATUS]) {
        const s = changes[KEYS.NOTE_STATUS].newValue ?? null;
        setNoteStatus(s);
        scheduleClearNote(s);
      }
      if (changes[KEYS.TASK_STATUS]) {
        const s = changes[KEYS.TASK_STATUS].newValue ?? null;
        setTaskStatus(s);
        scheduleClearTask(s);
      }
    });
  }, [scheduleClearClip, scheduleClearNote, scheduleClearTask]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleSignOut = async () => {
    await remove(KEYS.ACCESS_TOKEN);
    await remove(KEYS.REFRESH_TOKEN);
    await remove(KEYS.USER);
    await remove(KEYS.CLIP_STATUS);
    await remove(KEYS.NOTE_STATUS);
    await remove(KEYS.TASK_STATUS);
    setUser(null);
    setClipStatus(null);
    setNoteStatus(null);
    setTaskStatus(null);
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

      {noteStatus && (
        <div
          className={`clip-status clip-status--${noteStatus.state}`}
          onClick={async () => { await remove(KEYS.NOTE_STATUS); setNoteStatus(null); }}
          role="status"
          aria-live="polite"
        >
          {noteStatus.state === 'pending' && (
            <>
              <Loader size={16} className="clip-status-icon spin" />
              <span>Saving note...</span>
            </>
          )}
          {noteStatus.state === 'saved' && (
            <>
              <StickyNote size={16} className="clip-status-icon" />
              <span>Note saved!</span>
            </>
          )}
          {noteStatus.state === 'error' && (
            <>
              <AlertCircle size={16} className="clip-status-icon" />
              <span>{noteStatus.message || 'Failed to save note'}</span>
            </>
          )}
          {noteStatus.state === 'unauthenticated' && (
            <>
              <LogIn size={16} className="clip-status-icon" />
              <span>Sign in to save notes</span>
            </>
          )}
        </div>
      )}

      {taskStatus && (
        <div
          className={`clip-status clip-status--${taskStatus.state}`}
          onClick={async () => { await remove(KEYS.TASK_STATUS); setTaskStatus(null); }}
          role="status"
          aria-live="polite"
        >
          {taskStatus.state === 'pending' && (
            <>
              <Loader size={16} className="clip-status-icon spin" />
              <span>Creating task...</span>
            </>
          )}
          {taskStatus.state === 'saved' && (
            <>
              <ListTodo size={16} className="clip-status-icon" />
              <span>Task created!</span>
            </>
          )}
          {taskStatus.state === 'error' && (
            <>
              <AlertCircle size={16} className="clip-status-icon" />
              <span>{taskStatus.message || 'Failed to create task'}</span>
            </>
          )}
          {taskStatus.state === 'unauthenticated' && (
            <>
              <LogIn size={16} className="clip-status-icon" />
              <span>Sign in to create tasks</span>
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

            <QuickNote />

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
