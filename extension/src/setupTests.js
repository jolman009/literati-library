// Test setup — mocks chrome.* APIs for jsdom environment.
import '@testing-library/jest-dom';

// In-memory storage for chrome.storage.local mock
const storageData = {};

globalThis.chrome = {
  storage: {
    local: {
      get: (keys) => {
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: storageData[keys] ?? undefined });
        }
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach((k) => { result[k] = storageData[k] ?? undefined; });
          return Promise.resolve(result);
        }
        // No keys — return all
        return Promise.resolve({ ...storageData });
      },
      set: (items) => {
        Object.assign(storageData, items);
        return Promise.resolve();
      },
      remove: (keys) => {
        const toRemove = Array.isArray(keys) ? keys : [keys];
        toRemove.forEach((k) => delete storageData[k]);
        return Promise.resolve();
      },
      clear: () => {
        Object.keys(storageData).forEach((k) => delete storageData[k]);
        return Promise.resolve();
      },
    },
    onChanged: {
      addListener: () => {},
      removeListener: () => {},
    },
  },
  runtime: {
    onInstalled: { addListener: () => {} },
    onMessage: { addListener: () => {} },
    sendMessage: () => Promise.resolve(),
    getManifest: () => ({ version: '0.1.0' }),
  },
  contextMenus: {
    create: () => {},
    update: () => {},
    remove: () => {},
  },
  alarms: {
    create: () => {},
    onAlarm: { addListener: () => {} },
  },
  tabs: {
    create: () => Promise.resolve(),
    query: () => Promise.resolve([]),
    sendMessage: () => Promise.resolve(),
  },
};

// window.getSelection stub for clipper tests
if (!window.getSelection) {
  window.getSelection = () => ({
    toString: () => '',
    rangeCount: 0,
    isCollapsed: true,
    getRangeAt: () => null,
  });
}
