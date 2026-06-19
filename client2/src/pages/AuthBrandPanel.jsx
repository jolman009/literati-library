import React from 'react';
import { Sun, Moon, LibraryBig, Flame, Brain } from 'lucide-react';
import './auth-shell.css';

/**
 * Shared brand panel + theme toggle for the split-panel auth screens
 * (LoginV2 / SignUpV2). Renders the left gradient panel and the absolutely
 * positioned theme toggle as siblings — the toggle pins to the layout's
 * top-right corner regardless of DOM order, so both can live here.
 *
 * The mock authored this against window.SQ primitives + inline styles; here it
 * maps onto lucide-react icons and the already-bridged --sq-* / --md-sys-color-*
 * tokens (sq-design-tokens.css), with visuals driven from auth CSS classes.
 */
const FEATURES = [
  { Icon: LibraryBig, label: 'Organize' },
  { Icon: Flame, label: 'Build streaks' },
  { Icon: Brain, label: 'AI mentor' },
];

const AuthBrandPanel = ({
  headline = 'Every book is a quest waiting to begin.',
  subcopy = 'Track your reading, capture notes, earn achievements, and let your AI mentor light the way.',
  theme,
  toggleTheme,
}) => {
  const isDark = theme === 'dark';
  return (
    <>
      {toggleTheme && (
        <button
          type="button"
          onClick={toggleTheme}
          className="auth-theme-toggle"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      )}

      <aside className="auth-brand-panel">
        <div className="auth-brand-top">
          <img src="/ShelfQuest_logo_v3.png" alt="" className="auth-brand-mark" />
          <span className="auth-brand-wordmark">ShelfQuest</span>
        </div>

        <div className="auth-brand-middle">
          <h2 className="auth-brand-headline">{headline}</h2>
          <p className="auth-brand-subcopy">{subcopy}</p>
          <div className="auth-brand-features">
            {FEATURES.map(({ Icon, label }) => (
              <div key={label} className="auth-brand-feature">
                <span className="auth-brand-feature-medallion">
                  <Icon size={22} strokeWidth={1.9} />
                </span>
                <span className="auth-brand-feature-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-brand-footer">shelfquest.org · Your digital library companion</div>
      </aside>
    </>
  );
};

export default AuthBrandPanel;
