// Content script — "Send to ShelfQuest" web clipper (Phase 2.2).
// Listens for CAPTURE_PAGE_DATA messages from the background worker,
// captures page data via clipper.js, and converts HTML selections to
// markdown using turndown before responding.

import TurndownService from 'turndown';
import { capturePageData } from './clipper.js';

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'CAPTURE_PAGE_DATA') return false;

  try {
    const data = capturePageData();

    // Convert HTML selection to markdown for cleaner storage
    if (data.selection_html) {
      try {
        data.content = turndown.turndown(data.selection_html);
      } catch {
        // Fall back to plain text if turndown fails
        data.content = data.selected_text || null;
      }
    }

    // Drop raw HTML — we only need the markdown content going forward
    delete data.selection_html;

    sendResponse({ success: true, data });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }

  return true; // keep channel open for async response
});

console.debug('[ShelfQuest] Content script loaded');
