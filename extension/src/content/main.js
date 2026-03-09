// Content script — "Send to ShelfQuest" web clipper (Phase 2.2).
// Listens for CAPTURE_PAGE_DATA messages from the background worker,
// captures page data via clipper.js, and converts HTML selections to
// markdown using turndown before responding.

import { capturePageData } from './clipper.js';
import TurndownService from 'turndown';

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'CAPTURE_PAGE_DATA' && message.type !== 'CAPTURE_FOR_NOTE' && message.type !== 'CAPTURE_FOR_TASK' && message.type !== 'CAPTURE_PAGE_CONTEXT') return false;

  try {
    const data = capturePageData();

    // Convert HTML selection to markdown for cleaner storage
    if (data.selection_html) {
      try {
        data.content = turndown.turndown(data.selection_html);
      } catch {
        data.content = data.selected_text || null;
      }
    } else {
      data.content = data.selected_text || null;
    }

    // Drop raw HTML — only markdown content goes forward
    delete data.selection_html;

    sendResponse({ success: true, data });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }

  return true; // keep channel open for async response
});

console.debug('[ShelfQuest] Content script loaded');
