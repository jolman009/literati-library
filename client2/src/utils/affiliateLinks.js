// Affiliate link generators for book purchase recommendations.
// Configure IDs via environment variables. Links work without IDs as plain search URLs.

const BOOKSHOP_AFFILIATE_ID = import.meta.env.VITE_BOOKSHOP_AFFILIATE_ID || '';
const AMAZON_AFFILIATE_TAG = import.meta.env.VITE_AMAZON_AFFILIATE_TAG || '';

/**
 * Generate a Bookshop.org search link (supports independent bookstores).
 */
export function bookshopUrl(title, author) {
  const query = encodeURIComponent(`${title} ${author}`.trim());
  const base = BOOKSHOP_AFFILIATE_ID
    ? `https://bookshop.org/a/${BOOKSHOP_AFFILIATE_ID}`
    : 'https://bookshop.org';
  return `${base}/search?keywords=${query}`;
}

/**
 * Generate an Amazon search link.
 */
export function amazonUrl(title, author) {
  const query = encodeURIComponent(`${title} ${author}`.trim());
  const tag = AMAZON_AFFILIATE_TAG ? `&tag=${AMAZON_AFFILIATE_TAG}` : '';
  return `https://www.amazon.com/s?k=${query}&i=stripbooks${tag}`;
}
