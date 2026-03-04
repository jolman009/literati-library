// src/hooks/useClippings.js
// Data-fetching hook for web clippings.
// Uses makeAuthenticatedApiCall from AuthContext for proper token handling.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useClippings() {
  const { makeAuthenticatedApiCall } = useAuth();
  const [clippings, setClippings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadClippings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await makeAuthenticatedApiCall('/api/clippings');
      setClippings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedApiCall]);

  useEffect(() => {
    loadClippings();
  }, [loadClippings]);

  const markRead = useCallback(async (id) => {
    try {
      const updated = await makeAuthenticatedApiCall(`/api/clippings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true }),
      });
      setClippings(prev => prev.map(c => (c.id === id ? updated : c)));
    } catch (err) {
      setError(err.message);
    }
  }, [makeAuthenticatedApiCall]);

  const updateClipping = useCallback(async (id, fields) => {
    try {
      const updated = await makeAuthenticatedApiCall(`/api/clippings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      });
      setClippings(prev => prev.map(c => (c.id === id ? updated : c)));
      return updated;
    } catch (err) {
      setError(err.message);
    }
  }, [makeAuthenticatedApiCall]);

  const deleteClipping = useCallback(async (id) => {
    try {
      await makeAuthenticatedApiCall(`/api/clippings/${id}`, { method: 'DELETE' });
      setClippings(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }, [makeAuthenticatedApiCall]);

  const stats = useMemo(() => ({
    total: clippings.length,
    unread: clippings.filter(c => !c.is_read).length,
    withBook: clippings.filter(c => c.book_id).length,
  }), [clippings]);

  return { clippings, loading, error, stats, loadClippings, markRead, updateClipping, deleteClipping };
}
