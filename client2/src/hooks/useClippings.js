// src/hooks/useClippings.js
// Data-fetching hook for web clippings. Follows useBookLibrary pattern.

import { useState, useEffect, useCallback, useMemo } from 'react';
import environmentConfig from '../config/environment.js';

async function apiFetch(endpoint, options = {}) {
  const res = await fetch(`${environmentConfig.apiUrl}${endpoint}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function useClippings() {
  const [clippings, setClippings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadClippings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/clippings');
      setClippings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClippings();
  }, [loadClippings]);

  const markRead = useCallback(async (id) => {
    try {
      const updated = await apiFetch(`/api/clippings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true }),
      });
      setClippings(prev => prev.map(c => (c.id === id ? updated : c)));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const deleteClipping = useCallback(async (id) => {
    try {
      await apiFetch(`/api/clippings/${id}`, { method: 'DELETE' });
      setClippings(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const stats = useMemo(() => ({
    total: clippings.length,
    unread: clippings.filter(c => !c.is_read).length,
    withBook: clippings.filter(c => c.book_id).length,
  }), [clippings]);

  return { clippings, loading, error, stats, loadClippings, markRead, deleteClipping };
}
