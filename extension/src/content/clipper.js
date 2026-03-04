// Pure DOM capture logic — no chrome.* dependencies so it's testable with jsdom.

/**
 * Read a <meta> tag's content attribute.
 * Tries property first (og:*), then falls back to name (description, etc.).
 */
function getMeta(attr) {
  const el =
    document.querySelector(`meta[property="${attr}"]`) ||
    document.querySelector(`meta[name="${attr}"]`);
  return el?.getAttribute('content') || null;
}

/**
 * Capture page data from the active DOM.
 * Returns a plain object with url, title, selected text (plain + HTML),
 * OG metadata, favicon, and auto-extracted tags.
 */
export function capturePageData() {
  const data = {
    url: window.location.href,
    title: document.title || '',
    selected_text: null,
    selection_html: null,
    site_name: getMeta('og:site_name') || null,
    description: getMeta('og:description') || getMeta('description') || null,
    image_url: getMeta('og:image') || null,
    favicon_url: null,
    tags: [],
  };

  // Favicon — prefer <link rel="icon">, fall back to /favicon.ico
  const iconLink =
    document.querySelector('link[rel="icon"]') ||
    document.querySelector('link[rel="shortcut icon"]');
  if (iconLink) {
    data.favicon_url = iconLink.href;
  } else {
    try {
      data.favicon_url = new URL('/favicon.ico', window.location.origin).href;
    } catch {
      // invalid origin — leave null
    }
  }

  // Selected text + HTML
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
    data.selected_text = selection.toString().trim() || null;

    try {
      const range = selection.getRangeAt(0);
      const fragment = range.cloneContents();
      const wrapper = document.createElement('div');
      wrapper.appendChild(fragment);
      data.selection_html = wrapper.innerHTML || null;
    } catch {
      // Range cloning can fail on certain special elements
    }
  }

  // Auto-tag from meta keywords
  const keywords = getMeta('keywords');
  if (keywords) {
    data.tags = keywords
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  return data;
}
