import { useState, useEffect, useRef } from 'react';
import { speakPersonaText, stopSpeaking as cancelSpeech } from '../utils/marvelVoice';

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
        // Haptic feedback on Android if supported
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([20, 40, 20]);
        }
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
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(25);
        }
        recognitionRef.current?.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  };

  if (!supported) {
    return (
      <button
        className="voice-btn"
        disabled
        title="Voice speech recognition not supported in this browser"
        style={{ opacity: 0.35, cursor: 'not-allowed' }}
        aria-label="Voice input not supported"
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
      title={listening ? 'Listening to speech... (Tap to stop)' : 'Voice Input (Tap to speak)'}
      aria-label={listening ? 'Stop listening' : 'Start voice input'}
    >
      {listening ? <StopIcon /> : <MicIcon />}
    </button>
  );
}

export function stopSpeaking() {
  cancelSpeech();
}

export function speak(text, personaId = 'jarvis', onStart, onEnd) {
  speakPersonaText(text, personaId, onStart, onEnd);
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
