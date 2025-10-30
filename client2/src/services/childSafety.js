// src/services/childSafety.js - Centralized Child Mode flag and helpers

const CHILD_MODE_KEY = 'shelfquest_child_mode';

export function isChildMode() {
  try {
    const raw = localStorage.getItem(CHILD_MODE_KEY);
    return raw === 'true';
  } catch (e) {
    return false;
  }
}

export function setChildMode(enabled) {
  try {
    localStorage.setItem(CHILD_MODE_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('shelfquest:child-mode-changed', { detail: { enabled } }));
  } catch (e) {
    // ignore
  }
}

export function onChildModeChange(handler) {
  const listener = (e) => handler(!!(e?.detail?.enabled));
  window.addEventListener('shelfquest:child-mode-changed', listener);
  return () => window.removeEventListener('shelfquest:child-mode-changed', listener);
}

export default { isChildMode, setChildMode, onChildModeChange };

