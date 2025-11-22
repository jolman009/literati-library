// src/components/Material3/MD3Fab.jsx
import React from "react";
import { motion } from "framer-motion";
import { useMaterial3Theme } from "../../contexts/Material3ThemeContext";
import styles from "./MD3Fab.module.css";

/**
 * Material Design 3 Floating Action Button (FAB)
 *
 * @param {string|ReactNode} icon - Icon to display (emoji, SVG, or component)
 * @param {function} onClick - Click handler
 * @param {string} ariaLabel - Accessibility label
 * @param {object} position - CSS position properties (default: bottom-right)
 * @param {string} size - 'normal' (56px) or 'small' (40px)
 * @param {string} variant - 'primary' (default), 'secondary', or 'tertiary'
 * @param {boolean} extended - Show label alongside icon
 * @param {string} label - Label text (only shown if extended=true)
 * @param {boolean} disabled - Disabled state
 */
const MD3Fab = ({
  icon,
  onClick,
  ariaLabel,
  position = { bottom: '24px', right: '24px' },
  size = 'normal',
  variant = 'primary',
  extended = false,
  label = '',
  disabled = false,
  className = ''
}) => {
  const { actualTheme } = useMaterial3Theme();
  const isDark = actualTheme === 'dark';

  const fabClasses = [
    styles.fab,
    styles[size],
    styles[variant],
    isDark ? styles.dark : styles.light,
    extended ? styles.extended : '',
    disabled ? styles.disabled : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      onClick={onClick}
      className={fabClasses}
      aria-label={ariaLabel}
      disabled={disabled}
      style={position}
      type="button"
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{
        top: -window.innerHeight + 100,
        bottom: window.innerHeight - 100,
        left: -window.innerWidth + 100,
        right: window.innerWidth - 100,
      }}
      whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
    >
      <span className={styles.icon}>{icon}</span>
      {extended && label && (
        <span className={styles.label}>{label}</span>
      )}
    </motion.button>
  );
};

export default MD3Fab;
