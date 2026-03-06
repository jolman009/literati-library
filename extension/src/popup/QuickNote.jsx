import { useState } from 'react';
import { Send, StickyNote } from 'lucide-react';
import './QuickNote.css';

export default function QuickNote() {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    setFeedback(null);

    try {
      // Get current tab info for source metadata
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const tagsList = tags.split(',').map(t => t.trim()).filter(Boolean);

      const payload = {
        title: `Note from ${tab?.title || 'web'}`,
        content: content.trim(),
        tags: tagsList,
        source_url: tab?.url || null,
        source_title: tab?.title || null,
        source_favicon: tab?.favIconUrl || null,
      };

      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_QUICK_NOTE',
        payload,
      });

      if (response?.success) {
        setFeedback('saved');
        setContent('');
        setTags('');
        setTimeout(() => setFeedback(null), 2500);
      } else {
        setFeedback('error');
      }
    } catch {
      setFeedback('error');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  return (
    <div className="quick-note">
      <div className="quick-note-header">
        <StickyNote size={14} />
        <span>Quick Note</span>
      </div>
      <textarea
        className="quick-note-input"
        placeholder="Type a note... (Ctrl+Enter to save)"
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
      />
      <input
        className="quick-note-tags"
        type="text"
        placeholder="Tags (comma-separated)"
        value={tags}
        onChange={e => setTags(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="quick-note-footer">
        {feedback === 'saved' && <span className="quick-note-feedback quick-note-feedback--saved">Saved!</span>}
        {feedback === 'error' && <span className="quick-note-feedback quick-note-feedback--error">Failed</span>}
        <button
          className="quick-note-send"
          onClick={handleSave}
          disabled={saving || !content.trim()}
          title="Save note (Ctrl+Enter)"
        >
          <Send size={14} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
