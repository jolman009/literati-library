import React, { useEffect, useState } from 'react';
import { useShelfQuestApi } from '@/hooks/useShelfQuestApi';
import { FolderSelect } from '@/components/FolderSelect';
import { TagInput } from '@/components/TagInput';
import { SaveButton } from '@/components/SaveButton';
import type { PageMetadata, ShelfQuestFolder, ShelfQuestTag } from '@/lib/types';

// ============================================
// Main Popup Component
// ============================================

export function Popup() {
  const { isAuthenticated, isLoading, user, folders, tags, save, refresh } = useShelfQuestApi();

  const [metadata, setMetadata] = useState<PageMetadata | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<ShelfQuestFolder | null>(null);
  const [selectedTags, setSelectedTags] = useState<ShelfQuestTag[]>([]);
  const [customTitle, setCustomTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<'success' | 'error' | null>(null);

  // Fetch metadata from current page on mount
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'EXTRACT_METADATA' }).then((result) => {
      if (result) {
        setMetadata(result);
        setCustomTitle(result.title);
      }
    });
  }, []);

  // Refresh folders/tags when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    }
  }, [isAuthenticated, refresh]);

  const handleSave = async () => {
    if (!metadata) return;

    setIsSaving(true);
    setSaveResult(null);

    try {
      const success = await save({
        url: metadata.url,
        title: customTitle || metadata.title,
        description: metadata.description,
        author: metadata.author,
        folderId: selectedFolder?.id,
        tags: selectedTags.map(t => t.id),
        metadata,
        savedAt: new Date().toISOString(),
      });

      setSaveResult(success ? 'success' : 'error');

      if (success) {
        // Close popup after brief success message
        setTimeout(() => window.close(), 1500);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="spinner" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="auth-notice">
        <div className="text-4xl mb-4">📚</div>
        <h2>Connect to ShelfQuest</h2>
        <p>Sign in to start saving pages to your library.</p>
        <button
          className="btn-primary"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          Open Settings
        </button>
      </div>
    );
  }

  // Main UI
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📚</span>
          <h1 className="font-semibold">Save to ShelfQuest</h1>
        </div>
        <span className="text-xs text-white/50">{user?.email}</span>
      </div>

      {/* Page Preview */}
      {metadata && (
        <div className="card">
          <div className="meta-preview">
            {metadata.imageUrl ? (
              <img
                src={metadata.imageUrl}
                alt=""
                className="meta-preview-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="meta-preview-image flex items-center justify-center text-2xl">
                {metadata.contentType === 'pdf' ? '📄' : '🌐'}
              </div>
            )}
            <div className="meta-preview-content">
              <div className="meta-preview-title" title={metadata.title}>
                {metadata.title}
              </div>
              <div className="meta-preview-url" title={metadata.url}>
                {metadata.siteName}
              </div>
              <div className="meta-preview-stats">
                {metadata.author && <span>By {metadata.author}</span>}
                <span>{metadata.wordCount.toLocaleString()} words</span>
                <span>~{metadata.estimatedReadingTime} min read</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Title (editable) */}
      <div>
        <label className="input-label" htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          className="input-field"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder="Enter a title..."
        />
      </div>

      {/* Folder Selection */}
      <div>
        <label className="input-label">Save to Folder</label>
        <FolderSelect
          folders={folders}
          selected={selectedFolder}
          onChange={setSelectedFolder}
        />
      </div>

      {/* Tags */}
      <div>
        <label className="input-label">Tags</label>
        <TagInput
          availableTags={tags}
          selectedTags={selectedTags}
          onChange={setSelectedTags}
        />
      </div>

      {/* Save Button */}
      <SaveButton
        onClick={handleSave}
        isLoading={isSaving}
        result={saveResult}
      />

      {/* Success/Error feedback */}
      {saveResult === 'success' && (
        <div className="text-center text-sm text-green-400">
          ✓ Saved to your library!
        </div>
      )}
      {saveResult === 'error' && (
        <div className="text-center text-sm text-red-400">
          ✗ Failed to save. Please try again.
        </div>
      )}
    </div>
  );
}
