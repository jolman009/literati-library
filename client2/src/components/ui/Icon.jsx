// src/components/ui/Icon.jsx
import React from 'react';

// Map semantic names to Material Symbols icon names
const ICON_MAP = {
  // general
  book: 'menu_book',
  books: 'library_books',
  reading: 'auto_stories',
  note: 'note',
  highlight: 'border_color',
  upload: 'upload',
  login: 'login',
  check: 'check',
  check_circle: 'check_circle',
  page: 'article',
  time: 'timer',
  celebrate: 'celebration',
  trophy: 'emoji_events',
  fire: 'local_fire_department',
  bolt: 'bolt',
  star: 'grade',
  crown: 'workspace_premium',
  diamond: 'diamond',
  graduate: 'school',
  tips: 'lightbulb',
  rocket: 'rocket_launch',
  menu: 'more_horiz',
};

export function Icon({ name = 'book', variant = 'outlined', className = '', size = 20, title }) {
  const glyph = ICON_MAP[name] || name; // allow passing raw material name too
  const style = { fontSize: size, lineHeight: 1, display: 'inline-flex', verticalAlign: 'middle' };
  const variantClass = variant === 'filled' ? 'material-symbols-outlined filled' : 'material-symbols-outlined';
  return (
    <span className={`${variantClass} ${className}`} style={style} aria-hidden title={title}>
      {glyph}
    </span>
  );
}

export default Icon;

