import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '../../contexts/AuthContext';
import './chat-guide.css';

const initialSuggestions = [
  'Show me how to upload a book',
  'Where do I find my library?',
  'How do notes and highlights work?',
  'Help me understand the dashboard'
];

export default function ChatGuide() {
  // All hooks must be called before any early returns
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, makeAuthenticatedApiCall } = useAuth();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    { id: 'm0', role: 'assistant', content: 'Hi! I can guide you around ShelfQuest. Ask me how to upload, find your library, or take notes.' }
  ]);
  const listRef = useRef(null);

  // Source preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [previewItems, setPreviewItems] = useState([]); // [{title, sourcePath, content}]

  const context = useMemo(() => ({ route: pathname, userRole: user?.role || 'user' }), [pathname, user]);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, messages]);

  // Feature flag check - after all hooks
  const enabled = import.meta.env.VITE_CHAT_GUIDE_ENABLED === 'true';
  if (!enabled) return null;

  const send = async (text) => {
    if (!text || busy) return;
    const userMsg = { id: `u${Date.now()}`, role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setBusy(true);
    try {
      const res = await makeAuthenticatedApiCall('/api/guide/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })), context })
      });
      const reply = res?.message || { role: 'assistant', content: 'I\'m here to help.' };
      setMessages(prev => [...prev, { id: `a${Date.now()}`, ...reply }]);
      if (Array.isArray(reply.actions) && reply.actions.length) {
        performActions(reply.actions);
      }
    } catch {
      setMessages(prev => [...prev, { id: `e${Date.now()}`, role: 'assistant', content: 'Sorry, I could not process that request.' }]);
    } finally {
      setBusy(false);
    }
  };

  const performActions = (actions) => {
    actions.forEach((a) => {
      if (a.type === 'open_page' && a.payload?.route) {
        navigate(a.payload.route);
      }
      if (a.type === 'start_tour' && a.payload?.tourId) {
        startTour(a.payload.tourId);
      }
      if (a.type === 'highlight' && a.payload?.selector) {
        const el = document.querySelector(a.payload.selector);
        if (el) {
          const d = driver();
          d.highlight({ element: el, popover: { title: 'Here it is', description: 'This is the control you need.' } });
        }
      }
    });
  };

  const startTour = (tourId) => {
    const d = driver({ showProgress: true, animate: true });
    if (tourId === 'uploadFlow') {
      const drop = document.querySelector('#upload-dropzone')
        || document.querySelector('[data-upload-area]')
        || document.querySelector("[class*='upload']");
      d.defineSteps([
        { element: 'body', popover: { title: 'Upload a Book', description: 'Go to the Upload page to add PDFs/EPUBs.' } },
        drop ? { element: drop, popover: { title: 'Dropzone', description: 'Drag a file here or click to select.' } } : undefined,
      ].filter(Boolean));
      d.start();
    } else if (tourId === 'notesBasics') {
      const notesBtn = document.querySelector("a[href='/notes']") || document.querySelector("[data-nav='notes']");
      d.defineSteps([
        { element: 'body', popover: { title: 'Notes & Highlights', description: 'Open a book, select text, then add a note.' } },
        notesBtn ? { element: notesBtn, popover: { title: 'Notes', description: 'View and manage your notes here.' } } : undefined,
      ].filter(Boolean));
      d.start();
    } else {
      d.drive([{ element: 'body', popover: { title: 'Guide', description: 'Follow the steps to complete your task.' } }]);
    }
  };

  const openPreview = async (citation) => {
    const sourcePath = citation?.sourcePath;
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError('');
    setPreviewItems([]);
    try {
      if (!sourcePath) {
        setPreviewError('No source path for this citation.');
        return;
      }
      const chunks = await fetchSourcesByPath(makeAuthenticatedApiCall, sourcePath);
      const items = (chunks || []).map(c => ({
        title: c?.metadata?.title,
        sourcePath: c?.metadata?.sourcePath,
        routeHints: c?.metadata?.routeHints || [],
        content: String(c?.content || '').slice(0, 1200)
      }));
      setPreviewItems(items);
    } catch {
      setPreviewError('Failed to load source preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="chat-guide">
      {!open && (
        <button className="chat-guide__fab" onClick={() => setOpen(true)} aria-label="Open guide">
          ❓
        </button>
      )}
      {open && (
        <div className="chat-guide__panel">
          <div className="chat-guide__header">
            <span>App Guide</span>
            <button className="chat-guide__close" onClick={() => setOpen(false)} aria-label="Close">×</button>
          </div>
          <div className="chat-guide__messages" ref={listRef}>
            {messages.map(m => (
              <div key={m.id} className={`chat-guide__msg chat-guide__msg--${m.role}`}>
                <div className="chat-guide__bubble">
                  {m.content}
                  {m.role === 'assistant' && Array.isArray(m.citations) && m.citations.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {m.citations.map((c, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="chat-guide__chip"
                          title={c.sourcePath}
                          onClick={() => openPreview(c)}
                          disabled={busy}
                        >
                          {c.title || c.sourcePath || 'source'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="chat-guide__suggestions">
            {initialSuggestions.map((s, i) => (
              <button key={i} className="chat-guide__chip" onClick={() => send(s)} disabled={busy}>{s}</button>
            ))}
          </div>
          <form className="chat-guide__input" onSubmit={(e) => { e.preventDefault(); send(input.trim()); }}>
            <input
              type="text"
              placeholder={busy ? 'Thinking…' : 'Ask how to use the app…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
            />
            <button type="submit" disabled={busy || !input.trim()}>Send</button>
          </form>
        </div>
      )}

      {previewOpen && (
        <div className="chat-guide__overlay" onClick={() => setPreviewOpen(false)}>
          <div className="chat-guide__modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-guide__modal-header">
              <span>Source Preview</span>
              <button className="chat-guide__close" onClick={() => setPreviewOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="chat-guide__modal-body">
              {previewLoading && <div>Loading…</div>}
              {previewError && <div style={{ color: 'var(--md-sys-color-error, #ef4444)' }}>{previewError}</div>}
              {!previewLoading && !previewError && previewItems.length > 0 && (
                <div className="chat-guide__sources">
                  {previewItems.map((it, i) => (
                    <div key={i} className="chat-guide__source">
                      <div className="chat-guide__source-title">{it.title || it.sourcePath}</div>
                      <pre className="chat-guide__source-content">{it.content}</pre>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        {Array.isArray(it.routeHints) && it.routeHints.length > 0 && (
                          <button type="button" className="chat-guide__chip" onClick={() => navigate(it.routeHints[0])}>
                            Open Page
                          </button>
                        )}
                        <button
                          type="button"
                          className="chat-guide__chip"
                          onClick={() => navigate(`/help/viewer?path=${encodeURIComponent(it.sourcePath)}`)}
                        >
                          View More
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!previewLoading && !previewError && previewItems.length === 0 && (
                <div>No preview available.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

async function fetchSourcesByPath(makeAuthenticatedApiCall, sourcePath) {
  const encoded = encodeURIComponent(sourcePath);
  const res = await makeAuthenticatedApiCall(`/api/guide/source-by-path?path=${encoded}`);
  return res?.chunks || [];
}
