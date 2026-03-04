// MV3 background service worker.
// Handles: context menu registration, periodic token refresh, and message passing.

import { get, set, remove, KEYS } from '../config/storage.js';

// --- Install / Update ---

chrome.runtime.onInstalled.addListener(() => {
  // Register context menu — disabled until Phase 2.2 (clipper)
  chrome.contextMenus.create({
    id: 'save-to-shelfquest',
    title: 'Save to ShelfQuest',
    contexts: ['page', 'selection', 'link'],
    enabled: false,
  });

  // Set up periodic token refresh (every 14 minutes — tokens expire at 15)
  chrome.alarms.create('token-refresh', { periodInMinutes: 14 });
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
