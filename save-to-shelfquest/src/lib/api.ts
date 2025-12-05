import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  SaveItemPayload,
  SaveItemResponse,
  ShelfQuestFolder,
  ShelfQuestTag,
  ShelfQuestUser,
} from './types';
import { getSettings, getAuthToken, cacheFolders, cacheTags } from './storage';

// ============================================
// ShelfQuest API Client
// ============================================

let supabaseClient: SupabaseClient | null = null;

/** Initialize or get Supabase client */
async function getClient(): Promise<SupabaseClient> {
  if (supabaseClient) return supabaseClient;

  const settings = await getSettings();

  if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
    throw new Error('ShelfQuest not configured. Please set up your connection in the extension settings.');
  }

  supabaseClient = createClient(settings.supabaseUrl, settings.supabaseAnonKey, {
    auth: {
      persistSession: false, // We handle session in chrome.storage
    },
  });

  // Restore session if we have a token
  const token = await getAuthToken();
  if (token) {
    await supabaseClient.auth.setSession({ access_token: token, refresh_token: '' });
  }

  return supabaseClient;
}

/** Check if user is authenticated */
export async function getAuthStatus(): Promise<{ isAuthenticated: boolean; user?: ShelfQuestUser }> {
  try {
    const client = await getClient();
    const { data: { user } } = await client.auth.getUser();

    if (user) {
      return {
        isAuthenticated: true,
        user: {
          id: user.id,
          email: user.email || '',
          displayName: user.user_metadata?.display_name,
        },
      };
    }
    return { isAuthenticated: false };
  } catch {
    return { isAuthenticated: false };
  }
}

/** Fetch user's folders from ShelfQuest */
export async function fetchFolders(): Promise<ShelfQuestFolder[]> {
  const client = await getClient();

  const { data, error } = await client
    .from('folders')
    .select('id, name, color, parent_id')
    .order('name');

  if (error) {
    console.error('Failed to fetch folders:', error);
    throw new Error('Failed to fetch folders');
  }

  const folders: ShelfQuestFolder[] = (data || []).map(f => ({
    id: f.id,
    name: f.name,
    color: f.color,
    parentId: f.parent_id,
  }));

  // Cache for offline/faster access
  await cacheFolders(folders);

  return folders;
}

/** Fetch user's tags from ShelfQuest */
export async function fetchTags(): Promise<ShelfQuestTag[]> {
  const client = await getClient();

  const { data, error } = await client
    .from('tags')
    .select('id, name, color')
    .order('name');

  if (error) {
    console.error('Failed to fetch tags:', error);
    throw new Error('Failed to fetch tags');
  }

  const tags: ShelfQuestTag[] = (data || []).map(t => ({
    id: t.id,
    name: t.name,
    color: t.color,
  }));

  // Cache for offline/faster access
  await cacheTags(tags);

  return tags;
}

/** Save an item to ShelfQuest */
export async function saveItem(payload: SaveItemPayload): Promise<SaveItemResponse> {
  const client = await getClient();

  // First, create the library item
  const { data: item, error: itemError } = await client
    .from('library_items')
    .insert({
      url: payload.url,
      title: payload.title,
      description: payload.description,
      author: payload.author,
      folder_id: payload.folderId,
      metadata: payload.metadata,
      source: 'extension',
      saved_at: payload.savedAt,
    })
    .select('id')
    .single();

  if (itemError) {
    console.error('Failed to save item:', itemError);
    return { success: false, error: itemError.message };
  }

  // Then, associate tags if any
  if (payload.tags.length > 0 && item) {
    const tagAssociations = payload.tags.map(tagId => ({
      item_id: item.id,
      tag_id: tagId,
    }));

    const { error: tagError } = await client
      .from('item_tags')
      .insert(tagAssociations);

    if (tagError) {
      console.warn('Failed to associate tags:', tagError);
      // Don't fail the whole save for tag errors
    }
  }

  return { success: true, itemId: item?.id };
}

/** Sign in with email/password (for settings page) */
export async function signIn(email: string, password: string): Promise<boolean> {
  const client = await getClient();

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    console.error('Sign in failed:', error);
    return false;
  }

  // Store the access token
  const { saveAuthToken } = await import('./storage');
  await saveAuthToken(data.session.access_token);

  return true;
}

/** Sign out */
export async function signOut(): Promise<void> {
  const client = await getClient();
  await client.auth.signOut();

  const { clearAuthToken } = await import('./storage');
  await clearAuthToken();

  supabaseClient = null;
}
