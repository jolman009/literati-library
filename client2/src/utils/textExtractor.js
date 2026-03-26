// src/utils/textExtractor.js
// Utilities for extracting text from PDF pages and EPUB chapters

/**
 * Extract text content from a specific PDF page.
 * Uses PDF.js getTextContent API.
 *
 * @param {Object} pdfDocument - PDF.js document proxy (from react-pdf onLoadSuccess)
 * @param {number} pageNumber - 1-based page number
 * @returns {Promise<string>} The page text content
 */
export async function extractPdfPageText(pdfDocument, pageNumber) {
  if (!pdfDocument || !pageNumber) return '';

  try {
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();

    // Join text items, preserving line breaks where items have different y-positions
    let lastY = null;
    const parts = [];

    for (const item of textContent.items) {
      if (item.str === undefined) continue;
      const y = item.transform?.[5];
      if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 2) {
        parts.push('\n');
      }
      parts.push(item.str);
      if (y !== undefined) lastY = y;
    }

    return parts.join('').trim();
  } catch (err) {
    console.error('Failed to extract PDF page text:', err);
    return '';
  }
}

/**
 * Extract text content from a range of PDF pages.
 *
 * @param {Object} pdfDocument - PDF.js document proxy
 * @param {number} startPage - First page (1-based)
 * @param {number} endPage - Last page (1-based, inclusive)
 * @returns {Promise<string>} Combined text from all pages
 */
export async function extractPdfPageRange(pdfDocument, startPage, endPage) {
  if (!pdfDocument) return '';

  const clamped = Math.min(endPage, pdfDocument.numPages);
  const pages = [];

  for (let i = startPage; i <= clamped; i++) {
    const text = await extractPdfPageText(pdfDocument, i);
    if (text) pages.push(text);
  }

  return pages.join('\n\n');
}

/**
 * Extract text from the currently displayed EPUB chapter.
 * Reads from the rendition's iframe DOM content.
 *
 * @param {Object} rendition - EPUB.js rendition instance
 * @returns {string} The chapter text content
 */
export function extractEpubChapterText(rendition) {
  if (!rendition) return '';

  try {
    const contents = rendition.getContents();
    if (contents && contents.length > 0) {
      const doc = contents[0].document;
      return doc?.body?.innerText?.trim() || '';
    }
  } catch (err) {
    console.error('Failed to extract EPUB chapter text:', err);
  }

  return '';
}

/**
 * Split text into sentences for TTS sentence-level playback.
 * Handles common abbreviations and edge cases.
 *
 * @param {string} text - Input text
 * @returns {string[]} Array of sentences
 */
export function splitIntoSentences(text) {
  if (!text) return [];

  // Split on sentence-ending punctuation followed by whitespace or end of string
  // Negative lookbehind for common abbreviations
  const sentences = text
    .replace(/\n{2,}/g, '. ')  // Convert paragraph breaks to sentence breaks
    .replace(/\n/g, ' ')        // Single newlines become spaces
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return sentences;
}
