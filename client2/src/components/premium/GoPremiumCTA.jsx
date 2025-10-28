import React from 'react';
import { useEntitlements } from '../../contexts/EntitlementsContext';

const GoPremiumCTA = ({ size = 'medium', variant = 'filled', className = '', children }) => {
  const { openPremiumModal } = useEntitlements();
  const label = children || 'Go Premium';

  const base = 'md3-button';
  const style = variant === 'outlined'
    ? 'md3-button--outlined'
    : variant === 'tonal'
      ? 'md3-button--tonal'
      : 'md3-button--filled';

  const sizeClass = size === 'small' ? 'md3-button--small' : size === 'large' ? 'md3-button--large' : '';

  return (
    <button onClick={openPremiumModal} className={[base, style, sizeClass, className].filter(Boolean).join(' ')}>
      <span className="material-symbols-outlined mr-2">workspace_premium</span>
      {label}
    </button>
  );
};

export default GoPremiumCTA;

