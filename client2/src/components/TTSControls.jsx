// src/components/TTSControls.jsx
// Floating text-to-speech control panel
import { useState } from 'react';
import { Play, Pause, Square, ChevronUp, ChevronDown, Minimize2, Maximize2 } from 'lucide-react';
import '../styles/tts-controls.css';

const RATE_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function TTSControls({
  isPlaying,
  isPaused,
  rate,
  voice,
  voices,
  autoAdvance,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSetRate,
  onSetVoice,
  onSetAutoAdvance,
}) {
  const [minimized, setMinimized] = useState(false);
  const [showVoices, setShowVoices] = useState(false);

  if (!isPlaying && !isPaused) return null;

  if (minimized) {
    return (
      <div className="tts-controls tts-controls-minimized">
        <button
          className="tts-btn tts-btn-primary"
          onClick={isPaused ? onResume : onPause}
          title={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? <Play size={16} /> : <Pause size={16} />}
        </button>
        <button className="tts-btn" onClick={onStop} title="Stop">
          <Square size={14} />
        </button>
        <button className="tts-btn" onClick={() => setMinimized(false)} title="Expand">
          <Maximize2 size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="tts-controls">
      <div className="tts-controls-row">
        {/* Play/Pause */}
        <button
          className="tts-btn tts-btn-primary"
          onClick={isPaused ? onResume : onPause}
          title={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? <Play size={18} /> : <Pause size={18} />}
        </button>

        {/* Stop */}
        <button className="tts-btn" onClick={onStop} title="Stop reading">
          <Square size={16} />
        </button>

        {/* Speed */}
        <div className="tts-speed-control">
          <button
            className="tts-btn tts-btn-small"
            onClick={() => {
              const idx = RATE_OPTIONS.indexOf(rate);
              if (idx > 0) onSetRate(RATE_OPTIONS[idx - 1]);
            }}
            disabled={rate <= RATE_OPTIONS[0]}
            title="Slower"
          >
            <ChevronDown size={14} />
          </button>
          <span className="tts-speed-label">{rate}x</span>
          <button
            className="tts-btn tts-btn-small"
            onClick={() => {
              const idx = RATE_OPTIONS.indexOf(rate);
              if (idx < RATE_OPTIONS.length - 1) onSetRate(RATE_OPTIONS[idx + 1]);
            }}
            disabled={rate >= RATE_OPTIONS[RATE_OPTIONS.length - 1]}
            title="Faster"
          >
            <ChevronUp size={14} />
          </button>
        </div>

        {/* Auto-advance toggle */}
        <label className="tts-toggle" title="Auto-advance to next page when done">
          <input
            type="checkbox"
            checked={autoAdvance}
            onChange={(e) => onSetAutoAdvance(e.target.checked)}
          />
          <span className="tts-toggle-label">Auto</span>
        </label>

        {/* Minimize */}
        <button className="tts-btn" onClick={() => setMinimized(true)} title="Minimize">
          <Minimize2 size={14} />
        </button>
      </div>

      {/* Voice selector (collapsible) */}
      {voices.length > 1 && (
        <div className="tts-voice-section">
          <button
            className="tts-voice-toggle"
            onClick={() => setShowVoices(!showVoices)}
          >
            {voice?.name?.split(' ').slice(0, 3).join(' ') || 'Default Voice'}
            <ChevronDown size={12} className={showVoices ? 'tts-chevron-open' : ''} />
          </button>
          {showVoices && (
            <div className="tts-voice-list">
              {voices.slice(0, 15).map((v) => (
                <button
                  key={v.voiceURI}
                  className={`tts-voice-option ${v.voiceURI === voice?.voiceURI ? 'tts-voice-active' : ''}`}
                  onClick={() => {
                    onSetVoice(v);
                    setShowVoices(false);
                  }}
                >
                  {v.name}
                  {v.localService && <span className="tts-voice-badge">Local</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
