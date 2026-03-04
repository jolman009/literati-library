// Content script — "Send to ShelfQuest" web clipper (Phase 2.2).
// Listens for CAPTURE_PAGE_DATA messages from the background worker,
// captures page data via clipper.js, and converts HTML selections to
// markdown using turndown before responding.
//
// IMPORTANT: turndown is lazy-imported inside the handler because its
// browser build evaluates document.implementation at module scope,
// which can crash in CRXJS content script IIFE wrappers.

import { capturePageData } from './clipper.js';

let turndown = null;

async function getTurndown() {
  if (!turndown) {
    const { default: TurndownService } = await import('turndown');
    turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  }
  return turndown;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'CAPTURE_PAGE_DATA') return false;

  (async () => {
    try {
      const data = capturePageData();

      // Convert HTML selection to markdown for cleaner storage
      if (data.selection_html) {
        try {
          const td = await getTurndown();
          data.content = td.turndown(data.selection_html);
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
  })();

  return true; // keep channel open for async response
});

console.debug('[ShelfQuest] Content script loaded');
