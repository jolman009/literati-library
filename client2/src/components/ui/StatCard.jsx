import React from 'react';
import './StatCard.css';

/*
 * StatCard — shared metric card recreated from the ShelfQuest "Core App"
 * design handoff (DashboardScreen StatCard). Mapped to MD3 tokens.
 *
 * icon medallion (accent-tinted) + optional delta (top-right) + big value +
 * label + optional subtitle, with an accent top-bar that animates in on hover.
 * `icon` may be an emoji string or any React node. Self-sizes to its container.
 */
const StatCard = ({ icon, value, label, delta, subtitle, accent = 'var(--md-sys-color-primary)' }) => (
  <div className="sq-statcard">
    <span className="sq-statcard__bar" aria-hidden="true" />
    <div className="sq-statcard__head">
      <span className="sq-statcard__medallion" style={{ color: accent }}>{icon}</span>
      {delta != null && <span className="sq-statcard__delta">{delta}</span>}
    </div>
    <div className="sq-statcard__value">{value}</div>
    <div className="sq-statcard__label">{label}</div>
    {subtitle && <div className="sq-statcard__subtitle">{subtitle}</div>}
  </div>
);

export default StatCard;
