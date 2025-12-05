import type { ExtensionMessage, SaveItemPayload } from '@/lib/types';
import { saveItem, getAuthStatus } from '@/lib/api';

// ============================================
// Background Service Worker
// Handles context menus, keyboard shortcuts,
// and message passing between components
// ============================================

// Create context menu on extension install
chrome.runtime.onInstalled.addListener(() => {
  // Main context menu item
  chrome.contextMenus.create({
    id: 'save-to-shelfquest',
    title: 'Save to ShelfQuest',
    contexts: ['page', 'link', 'selection'],
  });

  // Sub-menu for saving with options
  chrome.contextMenus.create({
    id: 'save-to-shelfquest-with-note',
    parentId: 'save-to-shelfquest',
    title: 'Save with note...',
    contexts: ['page', 'link', 'selection'],
  });

  chrome.contextMenus.create({
    id: 'save-to-shelfquest-quick',
    parentId: 'save-to-shelfquest',
    title: 'Quick save (default folder)',
    contexts: ['page', 'link', 'selection'],
  });

  console.log('[ShelfQuest] Extension installed, context menus created');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  const menuId = info.menuItemId;

  if (menuId === 'save-to-shelfquest' || menuId === 'save-to-shelfquest-with-note') {
    // Open popup for full save experience
    // Note: Can't directly open popup, so we send message to content script
    // which will show an inline UI or we use chrome.action.openPopup() in MV3
    chrome.action.openPopup();
  } else if (menuId === 'save-to-shelfquest-quick') {
    // Quick save without popup
    await handleQuickSave(tab.id, info.selectionText);
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'save-current-page') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.action.openPopup();
    }
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case 'SAVE_TO_SHELFQUEST':
      return handleSave(message.payload as SaveItemPayload);

    case 'GET_AUTH_STATUS':
      return getAuthStatus();

    case 'EXTRACT_METADATA':
      // Forward to content script of active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        return chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_METADATA' });
      }
      return null;

    default:
      console.warn('[ShelfQuest] Unknown message type:', message);
      return null;
  }
}

async function handleSave(payload: SaveItemPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await saveItem(payload);

    if (result.success) {
      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'public/icons/icon128.png',
        title: 'Saved to ShelfQuest',
        message: `"${payload.title}" has been saved to your library.`,
      });
    }

    return result;
  } catch (error) {
    console.error('[ShelfQuest] Save failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function handleQuickSave(tabId: number, selectedText?: string): Promise<void> {
  try {
    // Get metadata from content script
    const metadata = await chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_METADATA' });

    if (!metadata) {
      throw new Error('Could not extract page metadata');
    }

    // Add selected text if any
    if (selectedText) {
      metadata.selectedText = selectedText;
    }

    const payload: SaveItemPayload = {
      url: metadata.url,
      title: metadata.title,
      description: metadata.description,
      author: metadata.author,
      tags: [],
      metadata,
      savedAt: new Date().toISOString(),
    };

    await handleSave(payload);
  } catch (error) {
    console.error('[ShelfQuest] Quick save failed:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'public/icons/icon128.png',
      title: 'Save Failed',
      message: error instanceof Error ? error.message : 'Could not save page',
    });
  }
}

// Keep service worker alive for message handling
chrome.runtime.onConnect.addListener((port) => {
  console.log('[ShelfQuest] Port connected:', port.name);
});
