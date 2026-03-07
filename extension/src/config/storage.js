// chrome.storage.local wrapper — async/await interface for extension storage.
// Service workers can't use localStorage, so all persistence goes through here.

export const KEYS = {
  ACCESS_TOKEN: 'shelfquest_token',
  REFRESH_TOKEN: 'shelfquest_refresh_token',
  USER: 'shelfquest_user',
  SETTINGS: 'shelfquest_settings',
  CLIP_STATUS: 'shelfquest_clip_status',
  NOTE_STATUS: 'shelfquest_note_status',
  TASK_STATUS: 'shelfquest_task_status',
  SIDEBAR_STATE: 'shelfquest_sidebar_state',
  READING_QUEUE: 'shelfquest_reading_queue',
};

export async function get(key) {
  const result = await chrome.storage.local.get(key);
  return result[key] ?? null;
}

export async function set(key, value) {
  await chrome.storage.local.set({ [key]: value });
}

export async function remove(key) {
  await chrome.storage.local.remove(key);
}

export async function clear() {
  await chrome.storage.local.clear();
}

export function onChanged(callback) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      callback(changes);
    }
  });
}
