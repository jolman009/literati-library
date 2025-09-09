// src/components/Material3/MD3BookProgressControls.jsx
import React, { memo, useState, useCallback, useRef } from 'react';
import { MD3Button, MD3Chip, MD3Dialog, MD3TextField } from './index';
import MD3LinearProgress  from './MD3LinearProgress';
import './MD3BookProgressControls.css';

/**
 * Material Design 3 compliant book progress controls
 * Provides both quick preset actions and detailed progress input
 */
const MD3BookProgressControls = memo(({
  book,
  onProgressUpdate, 
  className = '',
  compact = false,
  showLabel = true,
  ...props
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingProgress, setPendingProgress] = useState(book.progress || 0);
  const [updating, setUpdating] = useState(false);
  const sliderRef = useRef();

  // Quick preset progress values
  const presets = [
    { value: 25, label: '25%', color: 'secondary' },
    { value: 50, label: '50%', color: 'secondary' },
    { value: 75, label: '75%', color: 'primary' },
    { value: 100, label: '100%', color: 'tertiary' }
  ];

  // Handle preset progress update
  const handlePresetUpdate = useCallback(async (progress) => {
    if (updating || progress === book.progress) return;

    setUpdating(true);
    try {
      await onProgressUpdate?.(book, progress);
    } catch (error) {
      console.error('Failed to update progress:', error);
    } finally {
      setUpdating(false);
    }
  }, [book, onProgressUpdate, updating]);

  // Handle detailed progress dialog
  const handleOpenDialog = useCallback(() => {
    setPendingProgress(book.progress || 0);
    setDialogOpen(true);
  }, [book.progress]);

  const handleDialogSave = useCallback(async () => {
    if (updating || pendingProgress === book.progress) {
      setDialogOpen(false);
      return;
    }

    setUpdating(true);
    try {
      await onProgressUpdate?.(book, pendingProgress);
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to update progress:', error);
    } finally {
      setUpdating(false);
    }
  }, [book, onProgressUpdate, pendingProgress, updating]);

  const handleDialogCancel = useCallback(() => {
    setPendingProgress(book.progress || 0);
    setDialogOpen(false);
  }, [book.progress]);

  // Handle slider change
  const handleSliderChange = useCallback((e) => {
    const value = parseInt(e.target.value, 10);
    setPendingProgress(value);
  }, []);

  // Handle text input change
  const handleTextChange = useCallback((e) => {
    const value = Math.min(Math.max(parseInt(e.target.value, 10) || 0, 0), 100);
    setPendingProgress(value);
  }, []);

  // Determine which presets to show based on current progress
  const getRelevantPresets = useCallback(() => {
    const current = book.progress || 0;
    return presets.filter(preset => preset.value > current);
  }, [book.progress, presets]);

  const containerClasses = [
    'md3-book-progress-controls',
    compact && 'md3-book-progress-controls--compact',
    className
  ].filter(Boolean).join(' ');

  const relevantPresets = getRelevantPresets();

  return (
    <div className={containerClasses} {...props}>
      {/* Current Progress Display */}
      {showLabel && (
        <div className="md3-book-progress-controls__header">
          <span className="md3-book-progress-controls__label">
            Reading Progress
          </span>
          <span className="md3-book-progress-controls__current">
            {book.progress || 0}%
          </span>
        </div>
      )}

      {/* Visual Progress Bar */}
      <div className="md3-book-progress-controls__progress">
        <MD3LinearProgress
          value={book.progress || 0}
          max={100}
          variant="determinate"
          size={compact ? "small" : "medium"}
        />
      </div>

      {/* Quick Action Chips */}
      {relevantPresets.length > 0 && (
        <div className="md3-book-progress-controls__presets">
          {relevantPresets.map((preset) => (
            <MD3Chip
              key={preset.value}
              variant="outlined"
              color={preset.color}
              size={compact ? "small" : "medium"}
              disabled={updating}
              onClick={() => handlePresetUpdate(preset.value)}
              className="md3-book-progress-controls__preset-chip"
            >
              {preset.label}
            </MD3Chip>
          ))}
        </div>
      )}

      {/* More Options Button */}
      <div className="md3-book-progress-controls__actions">
        <MD3Button
          variant="text"
          size={compact ? "small" : "medium"}
          disabled={updating}
          onClick={handleOpenDialog}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          }
        >
          {compact ? 'Edit' : 'Set Specific Progress'}
        </MD3Button>
      </div>

      {/* Detailed Progress Dialog */}
      <MD3Dialog
        open={dialogOpen}
        onClose={handleDialogCancel}
        title="Update Reading Progress"
        maxWidth="sm"
        actions={
          <>
            <MD3Button
              variant="text"
              onClick={handleDialogCancel}
              disabled={updating}
            >
              Cancel
            </MD3Button>
            <MD3Button
              variant="filled"
              onClick={handleDialogSave}
              disabled={updating || pendingProgress === book.progress}
              loading={updating}
            >
              Update Progress
            </MD3Button>
          </>
        }
      >
        <div className="md3-book-progress-dialog">
          {/* Book Info Header */}
          <div className="md3-book-progress-dialog__book-info">
            <h3 className="md3-book-progress-dialog__title">
              {book.title}
            </h3>
            {book.author && (
              <p className="md3-book-progress-dialog__author">
                by {book.author}
              </p>
            )}
          </div>

          {/* Current vs New Progress */}
          <div className="md3-book-progress-dialog__comparison">
            <div className="md3-book-progress-dialog__current">
              <span className="md3-book-progress-dialog__label">Current</span>
              <span className="md3-book-progress-dialog__value">
                {book.progress || 0}%
              </span>
            </div>
            <div className="md3-book-progress-dialog__arrow">→</div>
            <div className="md3-book-progress-dialog__new">
              <span className="md3-book-progress-dialog__label">New</span>
              <span className="md3-book-progress-dialog__value">
                {pendingProgress}%
              </span>
            </div>
          </div>

          {/* Visual Progress Preview */}
          <div className="md3-book-progress-dialog__preview">
            <MD3LinearProgress
              value={pendingProgress}
              max={100}
              variant="determinate"
              size="medium"
              showValue={true}
            />
          </div>

          {/* Slider Input */}
          <div className="md3-book-progress-dialog__slider">
            <label className="md3-book-progress-dialog__slider-label">
              Drag to adjust progress
            </label>
            <input
              ref={sliderRef}
              type="range"
              min="0"
              max="100"
              step="1"
              value={pendingProgress}
              onChange={handleSliderChange}
              className="md3-book-progress-dialog__slider-input"
            />
            <div className="md3-book-progress-dialog__slider-marks">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Numeric Input */}
          <div className="md3-book-progress-dialog__numeric">
            <MD3TextField
              label="Exact percentage"
              type="number"
              min="0"
              max="100"
              value={pendingProgress}
              onChange={handleTextChange}
              supportingText="Enter a value between 0 and 100"
              trailingIcon="%"
            />
          </div>

          {/* Quick Preset Actions */}
          <div className="md3-book-progress-dialog__quick-actions">
            <span className="md3-book-progress-dialog__quick-label">
              Quick options:
            </span>
            <div className="md3-book-progress-dialog__quick-chips">
              {presets.map((preset) => (
                <MD3Chip
                  key={preset.value}
                  variant={pendingProgress === preset.value ? "filled" : "outlined"}
                  color={preset.color}
                  size="small"
                  onClick={() => setPendingProgress(preset.value)}
                >
                  {preset.label}
                </MD3Chip>
              ))}
            </div>
          </div>
        </div>
      </MD3Dialog>
    </div>
  );
});

MD3BookProgressControls.displayName = 'MD3BookProgressControls';

export default MD3BookProgressControls;