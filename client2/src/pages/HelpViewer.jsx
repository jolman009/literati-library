// src/pages/HelpViewer.jsx - Lightweight docs viewer for RAG sources
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function HelpViewer() {
  const query = useQuery();
  const sourcePath = query.get('path') || '';
  const navigate = useNavigate();
  const { makeAuthenticatedApiCall } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chunks, setChunks] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        if (!sourcePath) {
          setError('Missing path parameter.');
          return;
        }
        const enc = encodeURIComponent(sourcePath);
        const res = await makeAuthenticatedApiCall(`/api/guide/source-by-path?path=${enc}&limit=10`);
        if (!cancelled) setChunks(res?.chunks || []);
      } catch (e) {
        if (!cancelled) setError('Failed to load sources.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [sourcePath, makeAuthenticatedApiCall]);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>Help Viewer</h1>
        <button onClick={() => navigate(-1)} style={{ padding: '6px 10px', borderRadius: 8 }}>Back</button>
      </div>
      <div style={{ opacity: 0.8, marginBottom: 8 }}>Source: {sourcePath || '(none)'}
      </div>
      {loading && <div>Loading…</div>}
      {error && <div style={{ color: 'var(--md-sys-color-error, #ef4444)' }}>{error}</div>}
      {!loading && !error && chunks.length === 0 && (
        <div>No content found for this source.</div>
      )}
      {!loading && !error && chunks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {chunks.map((c, i) => (
            <div key={c.content_sha || i} style={{ border: '1px solid var(--md-sys-color-outline, #2b2b2b)', borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontWeight: 600 }}>{c?.metadata?.title || c?.metadata?.sourcePath}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Array.isArray(c?.metadata?.routeHints) && c.metadata.routeHints.length > 0 && (
                    <button onClick={() => navigate(c.metadata.routeHints[0])} style={{ padding: '4px 8px', borderRadius: 999 }}>
                      Open Page
                    </button>
                  )}
                </div>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', background: 'var(--md-sys-color-surface-container-high, #1c1c1c)', padding: 10, borderRadius: 10, maxHeight: 320, overflow: 'auto' }}>
                {String(c?.content || '')}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

