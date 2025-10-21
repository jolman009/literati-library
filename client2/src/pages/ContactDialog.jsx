// src/pages/ContactDialog.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { MD3Button, useSnackbar } from '../components/Material3';
import MD3Dialog from '../components/Material3/MD3Dialog.jsx';
import MD3TextField from '../components/Material3/MD3TextField.jsx';
import './ContactPage.css';

const ContactDialog = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { actualTheme } = useMaterial3Theme();
  const { showSnackbar } = useSnackbar();

  const [open, setOpen] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('feedback');
  const [message, setMessage] = useState('');
  const [contactBack, setContactBack] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      setName(prev => prev || user.name || '');
      setEmail(prev => prev || user.email || '');
    }
  }, [user]);

  const emailTo = 'admin@shelfquest.org';

  const subject = useMemo(() => {
    const labels = {
      feedback: 'General Feedback',
      bug: 'Bug Report',
      recommendation: 'Feature Recommendation',
      uiux: 'UI/UX Feedback',
      other: 'Other'
    };
    const wantReply = contactBack ? '• Please Reply' : '• FYI';
    return `[ShelfQuest] ${labels[type]} ${wantReply}`;
  }, [type, contactBack]);

  const body = useMemo(() => {
    const lines = [];
    lines.push(`Name: ${name || '(not provided)'}`);
    lines.push(`Email: ${email || '(not provided)'}`);
    lines.push(`Would like a reply: ${contactBack ? 'Yes' : 'No'}`);
    lines.push('');
    lines.push('Message:');
    lines.push(message || '(no details)');
    lines.push('');
    if (type === 'bug' || type === 'uiux') {
      try {
        lines.push('--- Diagnostics (helpful) ---');
        lines.push(`URL: ${window.location?.href || ''}`);
        lines.push(`User Agent: ${navigator.userAgent}`);
        lines.push(`Platform: ${navigator.platform}`);
        lines.push(`Language: ${navigator.language}`);
      } catch {}
    }
    return encodeURIComponent(lines.join('\n'));
  }, [name, email, message, contactBack, type]);

  const isValid = useMemo(() => {
    if (!name.trim()) return false;
    if (!email.trim()) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
    if (!message.trim()) return false;
    return true;
  }, [name, email, message]);

  const handleClose = () => {
    setOpen(false);
    // Navigate back if possible; otherwise go to a sensible default
    setTimeout(() => {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(isAuthenticated ? '/dashboard' : '/', { replace: true });
      }
    }, 200);
  };

  const handleSend = async () => {
    if (!isValid) {
      showSnackbar({ message: 'Please complete all required fields', variant: 'error' });
      return;
    }
    setSending(true);
    try {
      const mailto = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${body}`;
      window.location.href = mailto;
      showSnackbar({ message: 'Opening your email app…', variant: 'info' });
    } catch (err) {
      try {
        await navigator.clipboard.writeText(
          `To: ${emailTo}\nSubject: ${subject}\n\n${decodeURIComponent(body)}`
        );
        showSnackbar({ message: 'Copied message to clipboard. Paste into your email.', variant: 'success' });
      } catch {
        showSnackbar({ message: 'Could not open email. Copy your message manually.', variant: 'warning' });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-theme={actualTheme}>
      <MD3Dialog
        open={open}
        onClose={handleClose}
        title="Contact Us"
        maxWidth="md"
        dividers
        dataTheme={actualTheme}
        themeClass={actualTheme === 'dark' ? 'dark' : ''}
      >
        <div className="contact-grid">
          <MD3TextField
            label="Your Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <MD3TextField
            label="Your Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <div className="md3-select-field full-row">
            <label className="md3-select-label">Topic</label>
            <select className="md3-select" value={type} onChange={e => setType(e.target.value)}>
              <option value="recommendation">Feature Recommendation</option>
              <option value="bug">Bug Report</option>
              <option value="uiux">UI/UX Feedback</option>
              <option value="feedback">General Feedback</option>
              <option value="other">Other</option>
            </select>
          </div>

          <MD3TextField
            label="Message"
            multiline
            rows={12}
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            className="contact-message-field full-row"
          />

          <label className="contact-checkbox full-row">
            <input
              type="checkbox"
              checked={contactBack}
              onChange={e => setContactBack(e.target.checked)}
            />
            <span className="md-body-medium">Please contact me back</span>
          </label>
        </div>

        <div className="contact-actions full-row" style={{ marginTop: 16 }}>
          <MD3Button variant="text" onClick={handleClose}>
            Cancel
          </MD3Button>
          <MD3Button variant="filled" disabled={!isValid || sending} onClick={handleSend}>
            {sending ? 'Preparing…' : 'Send Email'}
          </MD3Button>
        </div>
      </MD3Dialog>
    </div>
  );
};

export default ContactDialog;
