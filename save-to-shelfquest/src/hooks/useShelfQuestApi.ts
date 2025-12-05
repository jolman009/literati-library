import { useState, useEffect, useCallback } from 'react';
import type {
  ShelfQuestUser,
  ShelfQuestFolder,
  ShelfQuestTag,
  SaveItemPayload,
} from '@/lib/types';
import {
  getAuthStatus,
  fetchFolders,
  fetchTags,
  saveItem,
} from '@/lib/api';
import { getCachedFolders, getCachedTags } from '@/lib/storage';

// ============================================
// Custom Hook for ShelfQuest API Integration
// ============================================

interface UseShelfQuestApiReturn {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: ShelfQuestUser | null;
  folders: ShelfQuestFolder[];
  tags: ShelfQuestTag[];
  refresh: () => Promise<void>;
  save: (payload: SaveItemPayload) => Promise<boolean>;
}

export function useShelfQuestApi(): UseShelfQuestApiReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<ShelfQuestUser | null>(null);
  const [folders, setFolders] = useState<ShelfQuestFolder[]>([]);
  const [tags, setTags] = useState<ShelfQuestTag[]>([]);

  // Check auth status and load cached data on mount
  useEffect(() => {
    async function init() {
      try {
        // Load cached data first for fast UI
        const [cachedFolders, cachedTags] = await Promise.all([
          getCachedFolders(),
          getCachedTags(),
        ]);
        setFolders(cachedFolders);
        setTags(cachedTags);

        // Check authentication
        const authStatus = await getAuthStatus();
        setIsAuthenticated(authStatus.isAuthenticated);
        setUser(authStatus.user || null);
      } catch (error) {
        console.error('[ShelfQuest] Init failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  // Refresh folders and tags from API
  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const [newFolders, newTags] = await Promise.all([
        fetchFolders(),
        fetchTags(),
      ]);
      setFolders(newFolders);
      setTags(newTags);
    } catch (error) {
      console.error('[ShelfQuest] Refresh failed:', error);
      // Keep using cached data on error
    }
  }, [isAuthenticated]);

  // Save an item to the library
  const save = useCallback(async (payload: SaveItemPayload): Promise<boolean> => {
    try {
      const result = await saveItem(payload);
      return result.success;
    } catch (error) {
      console.error('[ShelfQuest] Save failed:', error);
      return false;
    }
  }, []);

  return {
    isLoading,
    isAuthenticated,
    user,
    folders,
    tags,
    refresh,
    save,
  };
}
