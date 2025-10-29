import React from 'react';
import { Link } from 'react-router-dom';
import { useEntitlements } from '../../contexts/EntitlementsContext';

const GoPremiumCTA = ({ to, size = 'medium', variant = 'filled', className = '', children }) => {
  const { openPremiumModal } = useEntitlements();
  const label = children || 'Go Premium';

  const base = 'md3-button';
  const style = variant === 'outlined'
    ? 'md3-button--outlined'
    : variant === 'tonal'
      ? 'md3-button--tonal'
      : 'md3-button--filled';

  const sizeClass = size === 'small' ? 'md3-button--small' : size === 'large' ? 'md3-button--large' : '';

  const classes = [base, style, sizeClass, className].filter(Boolean).join(' ');

  if (to) {
    return (
      <Link to={to} className={classes} aria-label={typeof label === 'string' ? label : 'Go Premium'}>
        <span className="material-symbols-outlined mr-2">workspace_premium</span>
        <span className="btn-label">{label}</span>
      </Link>
    );
  }

  return (
    <button onClick={openPremiumModal} className={classes}>
      <span className="material-symbols-outlined mr-2">workspace_premium</span>
      <span className="btn-label">{label}</span>
    </button>
  );
};

export default GoPremiumCTA;
