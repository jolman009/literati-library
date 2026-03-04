// Content script — "Send to ShelfQuest" web clipper (Phase 2.2).
// Listens for CAPTURE_PAGE_DATA messages from the background worker,
// captures page data via clipper.js, and responds with the payload.
//
// NOTE: turndown (HTML→markdown) removed to isolate "document is not
// defined" bug. Plain text is stored as content instead. Turndown can
// be re-added once the root cause is confirmed fixed.

import { capturePageData } from './clipper.js';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'CAPTURE_PAGE_DATA') return false;

  try {
    const data = capturePageData();

    // Store plain text as content (turndown conversion removed for debugging)
    data.content = data.selected_text || null;

    // Drop raw HTML — not needed without turndown
    delete data.selection_html;

    sendResponse({ success: true, data });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }

  return true; // keep channel open for async response
});

console.debug('[ShelfQuest] Content script loaded');
