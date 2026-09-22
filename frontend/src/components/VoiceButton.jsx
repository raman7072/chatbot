import { useState, useEffect, useRef } from 'react';

export default function VoiceButton({ onTranscript, isSpeaking, disabled }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setListening(false);
      };

      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);

      recognitionRef.current = recognition;
    }
  }, [onTranscript]);

  const toggleListening = () => {
    if (!supported || disabled) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      recognitionRef.current?.start();
      setListening(true);
    }
  };

  if (!supported) {
    return (
      <button
        className="voice-btn"
        disabled
        title="Voice not supported in this browser"
        style={{ opacity: 0.3, cursor: 'not-allowed' }}
      >
        <MicIcon />
      </button>
    );
  }

  return (
    <button
      id="voice-btn"
      className={`voice-btn ${listening ? 'listening' : ''}`}
      onClick={toggleListening}
      disabled={disabled || isSpeaking}
      title={listening ? 'Listening... (click to stop)' : 'Voice input'}
    >
      {listening ? <StopIcon /> : <MicIcon />}
    </button>
  );
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function speak(text, onStart, onEnd) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  stopSpeaking();

  // Clean text: remove markdown symbols
  const clean = text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*{1,2}(.*?)\*{1,2}/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .slice(0, 500); // limit TTS length

  if (!clean.trim()) return;

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 0.95;
  utterance.pitch = 0.85;
  utterance.volume = 1;

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  // Try to pick a British male voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.toLowerCase().includes('british') ||
    v.name.toLowerCase().includes('daniel') ||
    (v.lang === 'en-GB' && v.name.toLowerCase().includes('male'))
  ) || voices.find(v => v.lang === 'en-GB') || voices[0];
  if (preferred) utterance.voice = preferred;

  window.speechSynthesis.speak(utterance);
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 19.93V23h2v-2.07A8 8 0 0 0 20 13h-2a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.93z"/>
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="12" height="12" rx="2"/>
    </svg>
  );
}
