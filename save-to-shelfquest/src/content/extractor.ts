import type { PageMetadata, ExtensionMessage } from '@/lib/types';

// ============================================
// Content Script: Metadata Extractor
// Runs on every page to extract metadata
// when requested by popup or background
// ============================================

// Average reading speed (words per minute)
const WORDS_PER_MINUTE = 200;

/** Extract metadata from the current page */
function extractMetadata(): PageMetadata {
  const url = window.location.href;
  const contentType = detectContentType(url);

  // Get title from various sources
  const title =
    getMetaContent('og:title') ||
    getMetaContent('twitter:title') ||
    document.querySelector('h1')?.textContent?.trim() ||
    document.title ||
    'Untitled';

  // Get description
  const description =
    getMetaContent('og:description') ||
    getMetaContent('twitter:description') ||
    getMetaContent('description') ||
    undefined;

  // Get author
  const author =
    getMetaContent('author') ||
    getMetaContent('article:author') ||
    getMetaContent('og:article:author') ||
    extractAuthorFromByline() ||
    undefined;

  // Get published date
  const publishedDate =
    getMetaContent('article:published_time') ||
    getMetaContent('og:article:published_time') ||
    getMetaContent('date') ||
    extractDateFromPage() ||
    undefined;

  // Get site name
  const siteName =
    getMetaContent('og:site_name') ||
    window.location.hostname.replace('www.', '');

  // Get image
  const imageUrl =
    getMetaContent('og:image') ||
    getMetaContent('twitter:image') ||
    undefined;

  // Calculate word count and reading time
  const wordCount = countWords();
  const estimatedReadingTime = Math.ceil(wordCount / WORDS_PER_MINUTE);

  // Get selected text if any
  const selection = window.getSelection();
  const selectedText = selection?.toString().trim() || undefined;

  return {
    url,
    title,
    description,
    author,
    publishedDate,
    siteName,
    imageUrl,
    wordCount,
    estimatedReadingTime,
    contentType,
    selectedText,
  };
}

/** Get content from a meta tag */
function getMetaContent(name: string): string | undefined {
  const selectors = [
    `meta[property="${name}"]`,
    `meta[name="${name}"]`,
    `meta[itemprop="${name}"]`,
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    const content = el?.getAttribute('content');
    if (content) return content.trim();
  }

  return undefined;
}

/** Detect content type based on URL and page content */
function detectContentType(url: string): PageMetadata['contentType'] {
  if (url.endsWith('.pdf') || url.includes('/pdf/')) {
    return 'pdf';
  }

  // Check for article indicators
  const hasArticleTag = !!document.querySelector('article');
  const hasArticleMeta = !!getMetaContent('article:published_time');
  const hasLongContent = countWords() > 300;

  if (hasArticleTag || hasArticleMeta || hasLongContent) {
    return 'article';
  }

  return 'webpage';
}

/** Extract author from common byline patterns */
function extractAuthorFromByline(): string | undefined {
  const bylineSelectors = [
    '[rel="author"]',
    '.author',
    '.byline',
    '.post-author',
    '[itemprop="author"]',
    '.article-author',
  ];

  for (const selector of bylineSelectors) {
    const el = document.querySelector(selector);
    const text = el?.textContent?.trim();
    if (text && text.length < 100) {
      // Clean up common prefixes
      return text.replace(/^(by|written by|author:)\s*/i, '').trim();
    }
  }

  return undefined;
}

/** Extract date from page using common patterns */
function extractDateFromPage(): string | undefined {
  const dateSelectors = [
    'time[datetime]',
    '.date',
    '.published',
    '.post-date',
    '[itemprop="datePublished"]',
  ];

  for (const selector of dateSelectors) {
    const el = document.querySelector(selector);

    // Try datetime attribute first
    const datetime = el?.getAttribute('datetime');
    if (datetime) return datetime;

    // Try text content
    const text = el?.textContent?.trim();
    if (text) {
      const parsed = Date.parse(text);
      if (!isNaN(parsed)) {
        return new Date(parsed).toISOString();
      }
    }
  }

  return undefined;
}

/** Count words in the main content */
function countWords(): number {
  // Try to find main content area
  const mainContent =
    document.querySelector('article') ||
    document.querySelector('main') ||
    document.querySelector('.content') ||
    document.querySelector('.post-content') ||
    document.body;

  if (!mainContent) return 0;

  // Get text content, removing script and style content
  const clone = mainContent.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('script, style, nav, header, footer, aside').forEach(el => el.remove());

  const text = clone.textContent || '';
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);

  return words.length;
}

// Listen for messages from background/popup
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_METADATA') {
    try {
      const metadata = extractMetadata();
      sendResponse(metadata);
    } catch (error) {
      console.error('[ShelfQuest] Metadata extraction failed:', error);
      sendResponse(null);
    }
  }
  return true; // Keep channel open for async
});

// Announce that content script is ready
console.log('[ShelfQuest] Content script loaded');
