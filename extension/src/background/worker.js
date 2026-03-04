// MV3 background service worker.
// Handles: context menu registration, periodic token refresh, message passing,
// and the "Save to ShelfQuest" clip flow (Phase 2.2).

import { get, set, remove, KEYS } from '../config/storage.js';

// --- Install / Update ---

chrome.runtime.onInstalled.addListener(() => {
  // Register context menu — enabled for Phase 2.2 clipper
  chrome.contextMenus.create({
    id: 'save-to-shelfquest',
    title: 'Save to ShelfQuest',
    contexts: ['page', 'selection', 'link'],
    enabled: true,
  });

  // Set up periodic token refresh (every 14 minutes — tokens expire at 15)
  chrome.alarms.create('token-refresh', { periodInMinutes: 14 });
});

// --- Context menu click handler ---

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'save-to-shelfquest') return;

  // Check auth
  const token = await get(KEYS.ACCESS_TOKEN);
  if (!token) {
    await set(KEYS.CLIP_STATUS, { state: 'unauthenticated', ts: Date.now() });
    return;
  }

  // Set pending status
  await set(KEYS.CLIP_STATUS, { state: 'pending', ts: Date.now() });

  try {
    // Ask content script to capture page data
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_PAGE_DATA' });

    if (!response?.success) {
      throw new Error(response?.error || 'Content script capture failed');
    }

    // POST to API
    const { default: API } = await import('../config/api.js');
    await API.post('/api/clippings', response.data);

    await set(KEYS.CLIP_STATUS, { state: 'saved', ts: Date.now() });
  } catch (err) {
    console.error('[ShelfQuest] Clip failed:', err.message);
    await set(KEYS.CLIP_STATUS, {
      state: 'error',
      message: err.message || 'Failed to save clipping',
      ts: Date.now(),
    });
  }
});

// --- Alarm handler: token refresh ---

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'token-refresh') return;

  const refreshToken = await get(KEYS.REFRESH_TOKEN);
  if (!refreshToken) return;

  try {
    // Dynamic import so environment.js is only loaded when needed
    const { default: API } = await import('../config/api.js');
    const response = await API.post('/api/auth/refresh', { refreshToken });
    const { token, refreshToken: newRefresh } = response.data;

    await set(KEYS.ACCESS_TOKEN, token);
    if (newRefresh) {
      await set(KEYS.REFRESH_TOKEN, newRefresh);
    }
  } catch (err) {
    console.warn('[ShelfQuest] Token refresh failed:', err.message);
    // Don't clear tokens — let the user re-authenticate on next interaction
  }
});

// --- Message handler for popup / content script communication ---

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_AUTH_STATE') {
    (async () => {
      const token = await get(KEYS.ACCESS_TOKEN);
      const user = await get(KEYS.USER);
      sendResponse({
        isAuthenticated: !!token,
        user: user || null,
      });
    })();
    return true; // keep the message channel open for async response
  }

  if (message.type === 'LOGOUT') {
    (async () => {
      await remove(KEYS.ACCESS_TOKEN);
      await remove(KEYS.REFRESH_TOKEN);
      await remove(KEYS.USER);
      sendResponse({ success: true });
    })();
    return true;
  }
});
