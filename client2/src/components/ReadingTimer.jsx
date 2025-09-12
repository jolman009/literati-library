import { useEffect, useMemo, useRef, useState } from "react";
import { MD3Button as Button, MD3Chip as Chip, MD3Progress as Progress } from "./Material3";
import { useGamification } from "../contexts/GamificationContext"; // exposes trackAction(...)
import { useMaterial3Theme } from "./Material3";       // for colors if needed

/**
 * Props:
 *  - bookId (string)
 *  - genre (string)
 *  - currentPage (number)           // optional; if you can supply it, we’ll log pages_read delta
 *  - onReadingStateChange?(boolean) // optional callback for parent
 */
export default function ReadingTimer({ bookId, genre, currentPage = 0, onReadingStateChange }) {
  const { trackAction } = useGamification();
  const [isReading, setIsReading] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds (for UI tick)
  const [sessionMinutes, setSessionMinutes] = useState(0); // minutes to send to backend
  const tickRef = useRef(null);
  const startRef = useRef(null);
  const pageStartRef = useRef(currentPage ?? 0);

  const label = useMemo(() => (isReading ? "Stop" : "Start"), [isReading]);

  const start = () => {
    if (isReading) return;
    startRef.current = Date.now();
    pageStartRef.current = currentPage ?? 0;
    setIsReading(true);
    onReadingStateChange?.(true);

    // UI ticker (every second)
    tickRef.current = window.setInterval(() => {
      const diffSec = Math.floor((Date.now() - startRef.current) / 1000);
      setElapsed(diffSec);
      setSessionMinutes(Math.floor(diffSec / 60));
    }, 1000);
  };

  const stop = async () => {
    if (!isReading) return;
    if (tickRef.current) window.clearInterval(tickRef.current);

    const end = Date.now();
    const diffMin = Math.max(0, Math.floor((end - startRef.current) / 60000));
    const pagesRead = Math.max(0, (currentPage ?? 0) - (pageStartRef.current ?? 0));

    // Log to gamification backend (time first, then pages if applicable)
    try {
      if (diffMin > 0) {
        await trackAction("reading_time", {
          minutes: diffMin,
          sessionLength: diffMin,
          bookId
        });
      }
      if (pagesRead > 0) {
        await trackAction("pages_read", {
          pages: pagesRead,
          bookId
        });
      }
    } finally {
      // reset local state regardless of success/failure
      setIsReading(false);
      setElapsed(0);
      setSessionMinutes(0);
      startRef.current = null;
      onReadingStateChange?.(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  // Keyboard a11y: space/enter toggles
  const onKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      isReading ? stop() : start();
    }
  };

  // Friendly “mm:ss” for chip/tooltip
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const timeStr = `${mm}:${ss}`;

  return (
    <div className="flex items-center gap-2">
      {/* Genre Chip (kept next to timer as requested) */}
      <Chip variant="filter" selected={false} aria-label={`Genre: ${genre}`}>
        {genre || "Unknown"}
      </Chip>

      {/* Timer readout (small, unobtrusive) */}
      <Tooltip content={isReading ? "Reading… time is tracking" : "Timer is idle"}>
        <div
          className="px-2 py-1 rounded-full text-label-medium md3-surface-variant"
          aria-live="polite"
          aria-atomic="true"
          role="status"
        >
          {timeStr}
        </div>
      </Tooltip>

      {/* Start/Stop action—Material 3 Button (tonal to keep hierarchy light) */}
      {isReading ? (
        <Button
          variant="filled"
          aria-label="Stop reading timer"
          onClick={stop}
          onKeyDown={onKeyDown}
        >
          Stop
        </Button>
      ) : (
        <Button
          variant="tonal"
          aria-label="Start reading timer"
          onClick={start}
          onKeyDown={onKeyDown}
        >
          Start
        </Button>
      )}

      {/* Subtle progress ring while reading */}
      {isReading && (
        <Progress
          variant="circular"
          size={20}
          aria-label="Reading in progress"
          // circular can be indeterminate for activity feedback
          indeterminate
        />
      )}
    </div>
  );
}
