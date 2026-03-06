// MV3 background service worker.
// Handles: context menu registration, periodic token refresh, message passing,
// "Save to ShelfQuest" clip flow (Phase 2.2), and "Save as Note" (Phase 2.3).

import { get, set, remove, KEYS } from '../config/storage.js';
import API from '../config/api.js';

// --- Helpers ---

async function ensureContentScript(tabId, messageType) {
  try {
    return await chrome.tabs.sendMessage(tabId, { type: messageType });
  } catch {
    const contentFile = chrome.runtime.getManifest().content_scripts[0].js[0];
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [contentFile],
    });
    return await chrome.tabs.sendMessage(tabId, { type: messageType });
  }
}

async function requireAuth(statusKey) {
  const token = await get(KEYS.ACCESS_TOKEN);
  if (!token) {
    await set(statusKey, { state: 'unauthenticated', ts: Date.now() });
    return false;
  }
  return true;
}

// --- Install / Update ---

chrome.runtime.onInstalled.addListener(() => {
  // Parent menu
  chrome.contextMenus.create({
    id: 'shelfquest-parent',
    title: 'ShelfQuest',
    contexts: ['page', 'selection', 'link'],
  });

  // Save as Clipping (Phase 2.2)
  chrome.contextMenus.create({
    id: 'save-clipping',
    parentId: 'shelfquest-parent',
    title: 'Save as Clipping',
    contexts: ['page', 'selection', 'link'],
  });

  // Save as Note (Phase 2.3)
  chrome.contextMenus.create({
    id: 'save-as-note',
    parentId: 'shelfquest-parent',
    title: 'Save as Note',
    contexts: ['selection'],
  });

  // Set up periodic token refresh (every 14 minutes — tokens expire at 15)
  chrome.alarms.create('token-refresh', { periodInMinutes: 14 });
});

// --- Context menu click handler ---

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-clipping') {
    await handleSaveClipping(tab);
  } else if (info.menuItemId === 'save-as-note') {
    await handleSaveAsNote(tab);
  }
});

// Phase 2.2 — Save as Clipping
async function handleSaveClipping(tab) {
  if (!(await requireAuth(KEYS.CLIP_STATUS))) return;

  await set(KEYS.CLIP_STATUS, { state: 'pending', ts: Date.now() });

  try {
    const response = await ensureContentScript(tab.id, 'CAPTURE_PAGE_DATA');

    if (!response?.success) {
      throw new Error(response?.error || 'Content script capture failed');
    }

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
}

// Phase 2.3 — Save as Note
async function handleSaveAsNote(tab) {
  if (!(await requireAuth(KEYS.NOTE_STATUS))) return;

  await set(KEYS.NOTE_STATUS, { state: 'pending', ts: Date.now() });

  try {
    const response = await ensureContentScript(tab.id, 'CAPTURE_FOR_NOTE');

    if (!response?.success) {
      throw new Error(response?.error || 'Content script capture failed');
    }

    const { data } = response;

    await API.post('/notes', {
      title: data.title || 'Web Note',
      content: data.content || data.selected_text || '',
      tags: data.tags || [],
      source_url: data.url,
      source_title: data.title,
      source_favicon: data.favicon_url,
    });

    await set(KEYS.NOTE_STATUS, { state: 'saved', ts: Date.now() });
  } catch (err) {
    const detail = err.response?.data?.details || err.response?.data?.error || err.message;
    console.error('[ShelfQuest] Note save failed:', detail, err.response?.data);
    await set(KEYS.NOTE_STATUS, {
      state: 'error',
      message: detail || 'Failed to save note',
      ts: Date.now(),
    });
  }
}

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
    return true;
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

  // Phase 2.3 — Quick Note from popup
  if (message.type === 'SAVE_QUICK_NOTE') {
    (async () => {
      try {
        const token = await get(KEYS.ACCESS_TOKEN);
        if (!token) {
          sendResponse({ success: false, error: 'Not authenticated' });
          return;
        }
        await API.post('/notes', message.payload);
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }
});

// --- Alarm handler: token refresh ---

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'token-refresh') return;

  const refreshToken = await get(KEYS.REFRESH_TOKEN);
  if (!refreshToken) return;

  try {
    const response = await API.post('/auth/secure/refresh', { refreshToken });
    const { token, refreshToken: newRefresh } = response.data;

    await set(KEYS.ACCESS_TOKEN, token);
    if (newRefresh) {
      await set(KEYS.REFRESH_TOKEN, newRefresh);
    }
  } catch (err) {
    console.warn('[ShelfQuest] Token refresh failed:', err.message);
  }
});
