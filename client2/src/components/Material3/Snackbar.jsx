import React, { useEffect } from 'react';

// Material 3 Snackbar Component
const Snackbar = ({ 
  open, 
  message, 
  action, 
  onClose,
  duration = 4000,
  className = '' 
}) => {
  useEffect(() => {
    if (open && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);
  
  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto transition-all duration-medium4 ease-emphasized z-50 ${
      open ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
    } ${className}`}>
      <div className="bg-inverse-surface text-inverse-on-surface rounded-small shadow-elevation-3 px-4 py-3 flex items-center justify-between min-w-[344px] max-w-[672px]">
        <span className="text-body-medium mr-4">{message}</span>
        {action && (
          <button
            onClick={action.onClick}
            className="text-inverse-primary font-medium text-label-large hover:bg-inverse-primary hover:bg-opacity-hover px-2 py-1 -mr-2 rounded transition-colors duration-medium2"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default Snackbar;

/* Example Usage:
import { Snackbar } from './components/Material3';

function MyComponent() {
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setSnackbarOpen(true)}>
        Show Snackbar
      </Button>
      
      <Snackbar
        open={snackbarOpen}
        message="Book added to your library"
        action={{
          label: 'Undo',
          onClick: () => {
            console.log('Undo action');
            setSnackbarOpen(false);
          }
        }}
        onClose={() => setSnackbarOpen(false)}
      />
    </>
  );
}
*/