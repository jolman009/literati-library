// src/pages/ContactPage.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { MD3Card, MD3Button, MD3TextField, useSnackbar } from '../components/Material3';
import './ContactPage.css';

const ContactPage = () => {
  const { user } = useAuth();
  const { actualTheme } = useMaterial3Theme();
  const { showSnackbar } = useSnackbar();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('feedback'); // feedback | bug | recommendation | uiux | other
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

  const handleSend = async () => {
    if (!isValid) {
      showSnackbar({ message: 'Please complete all required fields', variant: 'error' });
      return;
    }
    setSending(true);
    try {
      // Primary: open mail client
      const mailto = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${body}`;
      window.location.href = mailto;
      showSnackbar({ message: 'Opening your email app…', variant: 'info' });
    } catch (err) {
      // Fallback: copy to clipboard
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
    <div className="contact-page" data-theme={actualTheme}>
      <div className="contact-container">
        <div className="contact-header">
          <h1 className="md-display-small">Contact Us</h1>
          <p className="md-body-large on-surface-variant">We’d love your feedback, suggestions, and bug reports.</p>
        </div>

        <MD3Card className="contact-card">
          <div className="contact-grid">
            <MD3TextField
              label="Your Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              fullWidth
            />
            <MD3TextField
              label="Your Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              fullWidth
            />

            <div className="md3-select-field">
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
              rows={6}
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              fullWidth
            />

            <label className="contact-checkbox">
              <input
                type="checkbox"
                checked={contactBack}
                onChange={e => setContactBack(e.target.checked)}
              />
              <span className="md-body-medium">Please contact me back</span>
            </label>

            <div className="contact-actions">
              <MD3Button variant="text" onClick={() => { setMessage(''); }}>
                Clear Message
              </MD3Button>
              <MD3Button variant="filled" disabled={!isValid || sending} onClick={handleSend}>
                {sending ? 'Preparing…' : 'Send Email'}
              </MD3Button>
            </div>
          </div>
        </MD3Card>

        <div className="contact-help md-body-medium on-surface-variant">
          Prefer direct email? Write us at
          {' '}<a href={`mailto:${emailTo}`}>{emailTo}</a>.
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

