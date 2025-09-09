import React from 'react';

// Material 3 Circular Progress Indicator
export const CircularProgress = ({ 
  size = 48, 
  className = '',
  color = 'primary' 
}) => (
  <div className={`relative inline-flex ${className}`} style={{ width: size, height: size }}>
    <svg
      className="animate-spin"
      viewBox="0 0 48 48"
      style={{ width: size, height: size }}
    >
      <circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="80 200"
        className={`text-${color}`}
      />
    </svg>
  </div>
);

// Material 3 Linear Progress Indicator
export const LinearProgress = ({ 
  value, 
  indeterminate = false, 
  className = '',
  height = 4,
  color = 'primary'
}) => (
  <div 
    className={`w-full bg-surface-container-highest rounded-full overflow-hidden ${className}`}
    style={{ height: `${height}px` }}
  >
    {indeterminate ? (
      <div className={`h-full bg-${color} rounded-full animate-progress-indeterminate`} />
    ) : (
      <div 
        className={`h-full bg-${color} rounded-full transition-all duration-medium4 ease-emphasized`}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    )}
  </div>
);

// Export both as default object and named exports
const Progress = {
  Circular: CircularProgress,
  Linear: LinearProgress
};

export default Progress;

/* Example Usage:
import { CircularProgress, LinearProgress } from './components/Material3/Progress';
import Progress from './components/Material3/Progress';


function MyComponent() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  return (
    <>
      {Indeterminate circular progress}
      {loading && <CircularProgress size={40} />}

      {Determinate linear progress}
      <LinearProgress value={progress} />

      {Indeterminate linear progress}
      <LinearProgress indeterminate />

      {Custom colored progress}
      <Progress.Linear value={75} color="secondary" height={8} />
    </>
  );
}
*/