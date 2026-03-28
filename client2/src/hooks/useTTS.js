// src/hooks/useTTS.js
// Custom hook wrapping the Web Speech Synthesis API for text-to-speech

import { useState, useEffect, useRef, useCallback } from 'react';
import { splitIntoSentences } from '../utils/textExtractor';

export default function useTTS({ onPageFinished } = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [voice, setVoice] = useState(null);
  const [voices, setVoices] = useState([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const [autoAdvance, setAutoAdvance] = useState(true);

  // Track cumulative listening time for gamification
  const [listeningSeconds, setListeningSeconds] = useState(0);
  const listeningTrackedRef = useRef(false); // Only fire gamification once per session

  const sentencesRef = useRef([]);
  const utteranceRef = useRef(null);
  const currentIndexRef = useRef(0);
  const onPageFinishedRef = useRef(onPageFinished);
  const rateRef = useRef(rate);
  const voiceRef = useRef(voice);

  // Keep refs in sync
  useEffect(() => { onPageFinishedRef.current = onPageFinished; }, [onPageFinished]);
  useEffect(() => { rateRef.current = rate; }, [rate]);
  useEffect(() => { voiceRef.current = voice; }, [voice]);

  // Load available voices
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const loadVoices = () => {
      const available = synth.getVoices();
      // Filter to English voices, prefer natural/enhanced voices
      const english = available.filter(v =>
        v.lang.startsWith('en')
      );
      // Sort: local voices first, then by name
      english.sort((a, b) => {
        if (a.localService !== b.localService) return a.localService ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      setVoices(english.length > 0 ? english : available);

      // Auto-select first good voice if none set
      if (!voiceRef.current && english.length > 0) {
        // Prefer voices with "natural", "enhanced", or "Google" in name
        const preferred = english.find(v =>
          /natural|enhanced|google|microsoft/i.test(v.name)
        );
        setVoice(preferred || english[0]);
      }
    };

    loadVoices();
    synth.addEventListener('voiceschanged', loadVoices);
    return () => synth.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const speakSentence = useCallback((index) => {
    const synth = window.speechSynthesis;
    if (!synth || index >= sentencesRef.current.length) {
      // All sentences done
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIndex(-1);
      currentIndexRef.current = 0;
      // Notify that the page/chapter is finished reading
      if (onPageFinishedRef.current) {
        onPageFinishedRef.current();
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sentencesRef.current[index]);
    utterance.rate = rateRef.current;
    if (voiceRef.current) utterance.voice = voiceRef.current;

    utterance.onstart = () => {
      setCurrentSentenceIndex(index);
    };

    utterance.onend = () => {
      currentIndexRef.current = index + 1;
      speakSentence(index + 1);
    };

    utterance.onerror = (e) => {
      if (e.error === 'canceled' || e.error === 'interrupted') return;
      console.error('TTS error:', e.error);
      // Try next sentence on error
      currentIndexRef.current = index + 1;
      speakSentence(index + 1);
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, []);

  const speak = useCallback((text) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    // Cancel any ongoing speech
    synth.cancel();

    const sentences = splitIntoSentences(text);
    if (sentences.length === 0) return;

    sentencesRef.current = sentences;
    currentIndexRef.current = 0;

    setIsPlaying(true);
    setIsPaused(false);

    // Small delay after cancel to prevent Chrome issues
    setTimeout(() => speakSentence(0), 50);
  }, [speakSentence]);

  const pause = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth || !isPlaying) return;
    synth.pause();
    setIsPaused(true);
  }, [isPlaying]);

  const resume = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth || !isPaused) return;
    synth.resume();
    setIsPaused(false);
  }, [isPaused]);

  const stop = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSentenceIndex(-1);
    currentIndexRef.current = 0;
    sentencesRef.current = [];
    // Reset listening tracker for next session
    setListeningSeconds(0);
    listeningTrackedRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Track cumulative listening time
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const timer = setInterval(() => {
      setListeningSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, isPaused]);

  // Chrome workaround: speech synthesis pauses after ~15s of continuous speech.
  // Periodically resume to keep it going.
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const interval = setInterval(() => {
      const synth = window.speechSynthesis;
      if (synth && synth.speaking && !synth.paused) {
        synth.pause();
        synth.resume();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isPlaying, isPaused]);

  return {
    // State
    isPlaying,
    isPaused,
    rate,
    voice,
    voices,
    currentSentenceIndex,
    autoAdvance,
    listeningSeconds,
    listeningTrackedRef,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,

    // Actions
    speak,
    pause,
    resume,
    stop,
    setRate,
    setVoice,
    setAutoAdvance,
  };
}
