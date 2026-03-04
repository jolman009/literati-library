import { describe, test, expect, beforeEach } from 'vitest';
import { get, set, remove, clear, KEYS } from '../src/config/storage.js';

describe('chrome.storage wrapper', () => {
  beforeEach(async () => {
    await clear();
  });

  test('returns null for missing keys', async () => {
    const value = await get('nonexistent');
    expect(value).toBeNull();
  });

  test('stores and retrieves a value', async () => {
    await set('test_key', 'hello');
    const value = await get('test_key');
    expect(value).toBe('hello');
  });

  test('stores and retrieves an object', async () => {
    const user = { name: 'Alice', email: 'alice@example.com' };
    await set(KEYS.USER, user);
    const stored = await get(KEYS.USER);
    expect(stored).toEqual(user);
  });

  test('removes a key', async () => {
    await set('to_remove', 'value');
    await remove('to_remove');
    const value = await get('to_remove');
    expect(value).toBeNull();
  });

  test('clears all keys', async () => {
    await set('a', 1);
    await set('b', 2);
    await clear();
    expect(await get('a')).toBeNull();
    expect(await get('b')).toBeNull();
  });

  test('exports expected key constants', () => {
    expect(KEYS.ACCESS_TOKEN).toBe('shelfquest_token');
    expect(KEYS.REFRESH_TOKEN).toBe('shelfquest_refresh_token');
    expect(KEYS.USER).toBe('shelfquest_user');
    expect(KEYS.SETTINGS).toBe('shelfquest_settings');
  });
});
