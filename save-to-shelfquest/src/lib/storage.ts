import type { ExtensionSettings, ShelfQuestFolder, ShelfQuestTag } from './types';

// ============================================
// Chrome Storage Helpers
// ============================================

const SETTINGS_KEY = 'shelfquest_settings';
const FOLDERS_CACHE_KEY = 'shelfquest_folders_cache';
const TAGS_CACHE_KEY = 'shelfquest_tags_cache';
const AUTH_TOKEN_KEY = 'shelfquest_auth_token';

/** Default extension settings */
const DEFAULT_SETTINGS: ExtensionSettings = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  defaultFolderId: undefined,
  autoExtractMetadata: true,
  showNotifications: true,
};

/** Get extension settings from storage */
export async function getSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.sync.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] };
}

/** Save extension settings to storage */
export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.sync.set({
    [SETTINGS_KEY]: { ...current, ...settings },
  });
}

/** Get cached folders */
export async function getCachedFolders(): Promise<ShelfQuestFolder[]> {
  const result = await chrome.storage.local.get(FOLDERS_CACHE_KEY);
  return result[FOLDERS_CACHE_KEY] || [];
}

/** Cache folders locally */
export async function cacheFolders(folders: ShelfQuestFolder[]): Promise<void> {
  await chrome.storage.local.set({ [FOLDERS_CACHE_KEY]: folders });
}

/** Get cached tags */
export async function getCachedTags(): Promise<ShelfQuestTag[]> {
  const result = await chrome.storage.local.get(TAGS_CACHE_KEY);
  return result[TAGS_CACHE_KEY] || [];
}

/** Cache tags locally */
export async function cacheTags(tags: ShelfQuestTag[]): Promise<void> {
  await chrome.storage.local.set({ [TAGS_CACHE_KEY]: tags });
}

/** Get auth token */
export async function getAuthToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(AUTH_TOKEN_KEY);
  return result[AUTH_TOKEN_KEY] || null;
}

/** Save auth token */
export async function saveAuthToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [AUTH_TOKEN_KEY]: token });
}

/** Clear auth token */
export async function clearAuthToken(): Promise<void> {
  await chrome.storage.local.remove(AUTH_TOKEN_KEY);
}

/** Clear all extension data */
export async function clearAllData(): Promise<void> {
  await chrome.storage.local.clear();
  await chrome.storage.sync.clear();
}
