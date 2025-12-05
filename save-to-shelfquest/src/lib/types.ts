// ============================================
// ShelfQuest Extension Types
// ============================================

/** Metadata extracted from a web page */
export interface PageMetadata {
  url: string;
  title: string;
  description?: string;
  author?: string;
  publishedDate?: string;
  siteName?: string;
  imageUrl?: string;
  wordCount: number;
  estimatedReadingTime: number; // in minutes
  contentType: 'article' | 'pdf' | 'webpage' | 'unknown';
  selectedText?: string;
}

/** A folder/collection in ShelfQuest */
export interface ShelfQuestFolder {
  id: string;
  name: string;
  color?: string;
  parentId?: string;
}

/** A tag in ShelfQuest */
export interface ShelfQuestTag {
  id: string;
  name: string;
  color?: string;
}

/** Payload sent to ShelfQuest API to save an item */
export interface SaveItemPayload {
  url: string;
  title: string;
  description?: string;
  author?: string;
  folderId?: string;
  tags: string[];
  metadata: Partial<PageMetadata>;
  savedAt: string;
}

/** Response from ShelfQuest API after saving */
export interface SaveItemResponse {
  success: boolean;
  itemId?: string;
  error?: string;
}

/** User's ShelfQuest account info */
export interface ShelfQuestUser {
  id: string;
  email: string;
  displayName?: string;
}

/** Extension settings stored in chrome.storage */
export interface ExtensionSettings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  defaultFolderId?: string;
  autoExtractMetadata: boolean;
  showNotifications: boolean;
}

/** Message types for communication between extension components */
export type ExtensionMessage =
  | { type: 'EXTRACT_METADATA'; payload?: undefined }
  | { type: 'METADATA_EXTRACTED'; payload: PageMetadata }
  | { type: 'SAVE_TO_SHELFQUEST'; payload: SaveItemPayload }
  | { type: 'SAVE_RESULT'; payload: SaveItemResponse }
  | { type: 'GET_AUTH_STATUS'; payload?: undefined }
  | { type: 'AUTH_STATUS'; payload: { isAuthenticated: boolean; user?: ShelfQuestUser } }
  | { type: 'OPEN_POPUP'; payload?: undefined };

/** Helper to create typed messages */
export function createMessage<T extends ExtensionMessage['type']>(
  type: T,
  payload?: Extract<ExtensionMessage, { type: T }>['payload']
): ExtensionMessage {
  return { type, payload } as ExtensionMessage;
}
