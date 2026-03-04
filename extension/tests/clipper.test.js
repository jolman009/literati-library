// Tests for extension/src/content/clipper.js — pure DOM capture (no chrome.* deps).
import { describe, it, expect, beforeEach } from 'vitest';
import { capturePageData } from '../src/content/clipper.js';

describe('capturePageData', () => {
  beforeEach(() => {
    // Reset DOM between tests
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.title = '';
    // Reset selection to collapsed
    window.getSelection = () => ({
      toString: () => '',
      rangeCount: 0,
      isCollapsed: true,
      getRangeAt: () => null,
    });
  });

  it('returns url and title from the current page', () => {
    document.title = 'Test Page Title';
    const data = capturePageData();
    expect(data.url).toBe(window.location.href);
    expect(data.title).toBe('Test Page Title');
  });

  it('reads OG meta tags', () => {
    const ogSite = document.createElement('meta');
    ogSite.setAttribute('property', 'og:site_name');
    ogSite.setAttribute('content', 'My Blog');
    document.head.appendChild(ogSite);

    const ogDesc = document.createElement('meta');
    ogDesc.setAttribute('property', 'og:description');
    ogDesc.setAttribute('content', 'A great article');
    document.head.appendChild(ogDesc);

    const ogImage = document.createElement('meta');
    ogImage.setAttribute('property', 'og:image');
    ogImage.setAttribute('content', 'https://example.com/img.jpg');
    document.head.appendChild(ogImage);

    const data = capturePageData();
    expect(data.site_name).toBe('My Blog');
    expect(data.description).toBe('A great article');
    expect(data.image_url).toBe('https://example.com/img.jpg');
  });

  it('reads favicon from link[rel=icon]', () => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'icon');
    link.setAttribute('href', '/favicon.png');
    document.head.appendChild(link);

    const data = capturePageData();
    expect(data.favicon_url).toContain('favicon.png');
  });

  it('falls back to /favicon.ico when no link[rel=icon] exists', () => {
    const data = capturePageData();
    expect(data.favicon_url).toContain('favicon.ico');
  });

  it('reads meta keywords as tags', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'keywords');
    meta.setAttribute('content', 'javascript, react, testing');
    document.head.appendChild(meta);

    const data = capturePageData();
    expect(data.tags).toEqual(['javascript', 'react', 'testing']);
  });

  it('returns null selected_text when nothing is selected', () => {
    const data = capturePageData();
    expect(data.selected_text).toBeNull();
    expect(data.selection_html).toBeNull();
  });

  it('captures selected text when available', () => {
    window.getSelection = () => ({
      toString: () => 'Hello world',
      rangeCount: 1,
      isCollapsed: false,
      getRangeAt: () => ({
        cloneContents: () => {
          const frag = document.createDocumentFragment();
          const span = document.createElement('span');
          span.textContent = 'Hello world';
          frag.appendChild(span);
          return frag;
        },
      }),
    });

    const data = capturePageData();
    expect(data.selected_text).toBe('Hello world');
    expect(data.selection_html).toContain('Hello world');
  });
});
