import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PremiumHeader.css';

/**
 * A Material Design 3–compliant header for the premium experience.
 *
 * This component displays a header with a navigation button, a title,
 * optional breadcrumbs and a search field. It uses CSS classes for
 * all styling – there are **no** inline style objects or `title`
 * attributes that cause unwanted tooltips.
 *
 * Props:
 * - `title` (string): The page title to display.
 * - `breadcrumbs` (array of `{ label: string, href?: string }`): Optional
 *     breadcrumb links. If provided, the header will render an ordered
 *     list of links separated by chevrons. If `href` is omitted, the
 *     breadcrumb will render as plain text.
 */
export default function PremiumHeader({ title, breadcrumbs = [] }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  /**
   * Navigate to the dashboard. This replaces the inline `title`
   * attribute previously used to describe the button, using
   * `aria-label` instead to avoid native tooltips while remaining
   * accessible.
   */
  const handleLogoClick = () => navigate('/dashboard');

  /**
   * Handle changes to the search field. At some point you could
   * dispatch this query to a search endpoint or update context state.
   * For now it simply updates local state.
   */
  const handleSearchChange = (e) => setQuery(e.target.value);

  return (
    <header className="premium-header">
      <div className="premium-header-left">
        <button
          className="premium-header-logo-btn"
          onClick={handleLogoClick}
          aria-label="Home"
        >
          <span className="material-symbols-outlined">auto_stories</span>
        </button>
        <h1 className="premium-header-title">{title}</h1>
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="premium-header-breadcrumbs">
            <ol>
              {breadcrumbs.map((crumb, idx) => (
                <li key={idx} className="premium-header-crumb">
                  {crumb.href ? (
                    <a href={crumb.href}>{crumb.label}</a>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                  {idx < breadcrumbs.length - 1 && (
                    <span className="premium-header-crumb-separator">›</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
      <div className="premium-header-right">
        <div className="premium-header-search">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            className="premium-header-search-input"
            placeholder="Search…"
            value={query}
            onChange={handleSearchChange}
          />
        </div>
        {/*
          Additional action buttons or profile components can be added here.
          For example, a notifications icon or user avatar can live in
          this right-hand container without using inline styles.
        */}
      </div>
    </header>
  );
}