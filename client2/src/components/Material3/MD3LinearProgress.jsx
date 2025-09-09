import React from 'react';
import MD3Progress from './MD3Progress.jsx';

export default React.forwardRef(function MD3LinearProgress(props, ref) {
  return <MD3Progress ref={ref} variant="linear" {...props} />;
});
