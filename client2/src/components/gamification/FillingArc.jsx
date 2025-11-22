// src/components/gamification/FillingArc.jsx
import React, { useMemo } from 'react';
import './FillingArc.css';

/**
 * Filling Arc Component - Enhanced progress visualization with glowing elements
 *
 * Props:
 * - progress: 0-100 percentage
 * - level: Current user level
 * - variant: 'simple' | 'detailed' | 'intricate' | 'cosmic'
 * - size: 'small' | 'medium' | 'large'
 * - showStats: boolean - Show level/points text overlay
 * - stats: { totalPoints, nextLevelPoints, currentLevelPoints }
 */
const FillingArc = ({
  progress = 0,
  level = 1,
  variant = 'detailed',
  size = 'medium',
  showStats = true,
  stats = null,
  className = '',
}) => {
  // Ensure progress is within bounds
  const safeProgress = Math.min(Math.max(progress, 0), 100);

  // Calculate arc parameters
  const arcData = useMemo(() => {
    const radius = size === 'small' ? 60 : size === 'large' ? 100 : 80;
    const strokeWidth = size === 'small' ? 10 : size === 'large' ? 16 : 14;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

    return {
      radius,
      strokeWidth,
      circumference,
      strokeDashoffset,
      viewBox: `0 0 ${(radius + strokeWidth) * 2} ${(radius + strokeWidth) * 2}`,
      center: radius + strokeWidth,
    };
  }, [safeProgress, size]);

  // Render different arc styles based on variant
  const renderArcVariant = () => {
    const { radius, strokeWidth, circumference, strokeDashoffset, center } = arcData;

    switch (variant) {
      case 'simple':
        return (
          <g>
            {/* Background arc */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="rgba(150, 150, 150, 0.4)"
              strokeWidth={strokeWidth}
              className="arc-background"
            />

            {/* Progress arc with glow */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="url(#gradient-simple)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${center} ${center})`}
              className="arc-progress arc-glow"
            />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient-simple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#24A8E0" stopOpacity="1" />
                <stop offset="100%" stopColor="#24A8E0" stopOpacity="1" />
              </linearGradient>
            </defs>
          </g>
        );

      case 'detailed':
        return (
          <g>
            {/* Outer glow ring */}
            <circle
              cx={center}
              cy={center}
              r={radius + 4}
              fill="none"
              stroke="rgba(var(--md-sys-color-primary), 0.1)"
              strokeWidth={2}
              className="arc-outer-glow"
            />

            {/* Background arc with pattern */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="rgba(150, 150, 150, 0.35)"
              strokeWidth={strokeWidth}
              strokeDasharray="4 4"
              className="arc-background"
            />

            {/* Inner track */}
            <circle
              cx={center}
              cy={center}
              r={radius - 2}
              fill="none"
              stroke="rgba(100, 100, 100, 0.25)"
              strokeWidth={strokeWidth - 4}
              className="arc-inner-track"
            />

            {/* Progress arc with dual glow */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="url(#gradient-detailed)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${center} ${center})`}
              className="arc-progress arc-glow-intense"
              filter="url(#glow-filter)"
            />

            {/* Progress cap (glowing dot at end of arc) */}
            {safeProgress > 0 && (
              <circle
                cx={center + radius * Math.cos((safeProgress * 3.6 - 90) * (Math.PI / 180))}
                cy={center + radius * Math.sin((safeProgress * 3.6 - 90) * (Math.PI / 180))}
                r={strokeWidth / 2 + 2}
                fill="url(#gradient-detailed)"
                className="arc-cap arc-pulse"
                filter="url(#glow-filter)"
              />
            )}

            {/* Gradient and filter definitions */}
            <defs>
              <linearGradient id="gradient-detailed" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#24A8E0" stopOpacity="1" />
                <stop offset="50%" stopColor="#24A8E0" stopOpacity="1" />
                <stop offset="100%" stopColor="#24A8E0" stopOpacity="1" />
              </linearGradient>

              <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feFlood floodColor="#24A8E0" floodOpacity="0.6" result="glowColor"/>
                <feComposite in="glowColor" in2="coloredBlur" operator="in" result="coloredGlow"/>
                <feMerge>
                  <feMergeNode in="coloredGlow"/>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </g>
        );

      case 'intricate':
        return (
          <g>
            {/* Multi-layer background */}
            <circle
              cx={center}
              cy={center}
              r={radius + 6}
              fill="none"
              stroke="rgba(var(--md-sys-color-primary), 0.05)"
              strokeWidth={1}
              className="arc-outer-ring"
            />

            <circle
              cx={center}
              cy={center}
              r={radius + 3}
              fill="none"
              stroke="rgba(var(--md-sys-color-secondary), 0.08)"
              strokeWidth={1}
              strokeDasharray="2 2"
              className="arc-mid-ring arc-rotate-slow"
            />

            {/* Main background arc */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="rgba(var(--md-sys-color-outline-variant), 0.3)"
              strokeWidth={strokeWidth + 2}
              className="arc-background"
            />

            {/* Inner decorative arc */}
            <circle
              cx={center}
              cy={center}
              r={radius - strokeWidth / 2 - 2}
              fill="none"
              stroke="rgba(var(--md-sys-color-primary), 0.1)"
              strokeWidth={1}
              strokeDasharray="8 4"
              className="arc-inner-decoration arc-rotate"
            />

            {/* Pulsing underglow */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="rgba(var(--md-sys-color-primary), 0.3)"
              strokeWidth={strokeWidth + 4}
              className="arc-underglow arc-pulse-slow"
            />

            {/* Main progress arc */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="url(#gradient-intricate)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${center} ${center})`}
              className="arc-progress arc-glow-cosmic"
              filter="url(#glow-filter-intense)"
            />

            {/* Progress trail effect */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="url(#gradient-trail)"
              strokeWidth={strokeWidth - 2}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset + 10}
              transform={`rotate(-90 ${center} ${center})`}
              className="arc-trail"
              opacity="0.6"
            />

            {/* Glowing progress cap with sparkle */}
            {safeProgress > 0 && (
              <g>
                <circle
                  cx={center + radius * Math.cos((safeProgress * 3.6 - 90) * (Math.PI / 180))}
                  cy={center + radius * Math.sin((safeProgress * 3.6 - 90) * (Math.PI / 180))}
                  r={strokeWidth / 2 + 4}
                  fill="url(#radial-cap)"
                  className="arc-cap arc-pulse-fast"
                  filter="url(#glow-filter-intense)"
                />
                {/* Sparkle effect */}
                <circle
                  cx={center + radius * Math.cos((safeProgress * 3.6 - 90) * (Math.PI / 180))}
                  cy={center + radius * Math.sin((safeProgress * 3.6 - 90) * (Math.PI / 180))}
                  r={strokeWidth / 2}
                  fill="#ffffff"
                  opacity="0.8"
                  className="arc-sparkle"
                />
              </g>
            )}

            {/* Gradient and filter definitions */}
            <defs>
              <linearGradient id="gradient-intricate" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#24A8E0" stopOpacity="1" />
                <stop offset="33%" stopColor="#24A8E0" stopOpacity="0.95" />
                <stop offset="66%" stopColor="#f093fb" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#4facfe" stopOpacity="1" />
              </linearGradient>

              <linearGradient id="gradient-trail" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#24A8E0" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#4facfe" stopOpacity="0.1" />
              </linearGradient>

              <radialGradient id="radial-cap">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="50%" stopColor="rgb(var(--md-sys-color-primary))" stopOpacity="0.9" />
                <stop offset="100%" stopColor="rgb(var(--md-sys-color-tertiary))" stopOpacity="1" />
              </radialGradient>

              <filter id="glow-filter-intense" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </g>
        );

      case 'cosmic':
        return (
          <g>
            {/* Cosmic background layers */}
            {[...Array(5)].map((_, i) => (
              <circle
                key={`cosmic-bg-${i}`}
                cx={center}
                cy={center}
                r={radius + (5 - i) * 4}
                fill="none"
                stroke={`rgba(var(--md-sys-color-primary), ${0.02 * (i + 1)})`}
                strokeWidth={1}
                className={`arc-cosmic-layer arc-pulse-delay-${i}`}
              />
            ))}

            {/* Rotating star field */}
            <g className="arc-star-field arc-rotate-slow">
              {[...Array(12)].map((_, i) => {
                const angle = (i * 30) * (Math.PI / 180);
                const starRadius = radius - strokeWidth - 5;
                return (
                  <circle
                    key={`star-${i}`}
                    cx={center + starRadius * Math.cos(angle)}
                    cy={center + starRadius * Math.sin(angle)}
                    r={0.5}
                    fill="rgba(var(--md-sys-color-primary), 0.5)"
                    className="arc-star arc-twinkle"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                );
              })}
            </g>

            {/* Main cosmic arc with nebula effect */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="url(#gradient-cosmic)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${center} ${center})`}
              className="arc-progress arc-cosmic"
              filter="url(#cosmic-glow)"
            />

            {/* Energy particles along the arc */}
            {safeProgress > 10 && [...Array(Math.floor(safeProgress / 20))].map((_, i) => {
              const particleProgress = (i + 1) * 20;
              const angle = (particleProgress * 3.6 - 90) * (Math.PI / 180);
              return (
                <circle
                  key={`particle-${i}`}
                  cx={center + radius * Math.cos(angle)}
                  cy={center + radius * Math.sin(angle)}
                  r={2}
                  fill="url(#radial-particle)"
                  className="arc-particle arc-pulse-fast"
                  style={{ animationDelay: `${i * 0.2}s` }}
                  filter="url(#particle-glow)"
                />
              );
            })}

            {/* Glowing cosmic cap */}
            {safeProgress > 0 && (
              <g>
                <circle
                  cx={center + radius * Math.cos((safeProgress * 3.6 - 90) * (Math.PI / 180))}
                  cy={center + radius * Math.sin((safeProgress * 3.6 - 90) * (Math.PI / 180))}
                  r={strokeWidth / 2 + 6}
                  fill="url(#radial-cosmic-cap)"
                  className="arc-cap arc-cosmic-pulse"
                  filter="url(#cosmic-glow)"
                />
                {/* Core */}
                <circle
                  cx={center + radius * Math.cos((safeProgress * 3.6 - 90) * (Math.PI / 180))}
                  cy={center + radius * Math.sin((safeProgress * 3.6 - 90) * (Math.PI / 180))}
                  r={strokeWidth / 4}
                  fill="#ffffff"
                  className="arc-core arc-shimmer"
                />
              </g>
            )}

            {/* Cosmic gradients and filters */}
            <defs>
              <linearGradient id="gradient-cosmic" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8e2de2" />
                <stop offset="25%" stopColor="#4a00e0" />
                <stop offset="50%" stopColor="#7303c0" />
                <stop offset="75%" stopColor="#ec38bc" />
                <stop offset="100%" stopColor="#fdbb2d" />
              </linearGradient>

              <radialGradient id="radial-cosmic-cap">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="40%" stopColor="#fdbb2d" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#7303c0" stopOpacity="1" />
              </radialGradient>

              <radialGradient id="radial-particle">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="100%" stopColor="#ec38bc" stopOpacity="0.8" />
              </radialGradient>

              <filter id="cosmic-glow" x="-150%" y="-150%" width="400%" height="400%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              <filter id="particle-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </g>
        );

      default:
        return renderArcVariant();
    }
  };

  const { viewBox } = arcData;

  return (
    <div className={`filling-arc filling-arc--${variant} filling-arc--${size} ${className}`}>
      <svg
        viewBox={viewBox}
        className="filling-arc__svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {renderArcVariant()}
      </svg>

      {/* Center content */}
      {showStats && (
        <div className="filling-arc__content">
          <div className="filling-arc__level">
            Level <span className="filling-arc__level-number">{level}</span>
          </div>
          {stats && (
            <div className="filling-arc__stats">
              <div className="filling-arc__points">
                {stats.totalPoints.toLocaleString()}
              </div>
              {stats.nextLevelPoints && (
                <div className="filling-arc__next-level">
                  /{stats.nextLevelPoints.toLocaleString()} XP
                </div>
              )}
            </div>
          )}
          <div className="filling-arc__percentage">
            {Math.round(safeProgress)}%
          </div>
        </div>
      )}
    </div>
  );
};

export default FillingArc;

