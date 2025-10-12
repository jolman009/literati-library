// material3-tokens.js — simple theme toggler for MENTA IQ
export function setTheme(mode = 'auto') {
  const root = document.documentElement;
  if (mode === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', mode === 'dark' ? 'dark' : 'light');
  }
  localStorage.setItem('mentaiq-theme', mode);
}

export function initTheme() {
  const saved = localStorage.getItem('mentaiq-theme') || 'auto';
  setTheme(saved);
  // watch system changes if auto
  if (saved === 'auto') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => setTheme('auto'));
  }
}