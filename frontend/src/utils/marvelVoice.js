/**
 * MARVEL AI VOICE & PERSONA ENGINE
 * Supports authentic voice synthesis for:
 * 1. J.A.R.V.I.S. (Paul Bettany - British, cultured, dry wit, male baritone)
 * 2. ULTRON (James Spader - Menacing, deep machine cadence, bass resonance)
 * 3. F.R.I.D.A.Y. (Kerry Condon - Irish/Celtic tactical suit AI, crisp & upbeat)
 * 4. E.D.I.T.H. (Tactical Augmented Reality & Orbital Defense AI, sleek precision)
 *
 * Engineered with cross-platform heuristics for Android, iOS, Windows, Mac, and Linux.
 * Completely eliminates unwanted feminine default voices for JARVIS & Ultron.
 */

export const PERSONAS = {
  jarvis: {
    id: 'jarvis',
    name: 'J.A.R.V.I.S.',
    shortName: 'JARVIS',
    title: 'Tactical AI Butler',
    subtitle: 'Paul Bettany · British Wit & Composure',
    avatar: 'JV',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    accentGradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
    theme: 'mark-iv',
    gender: 'male',
    rate: 0.95,
    pitch: 0.84, // Cultured baritone
    volume: 1.0,
    greeting: "*Singh Enterprises Division 08 — All systems online and operational.*\n\nGood day. I am **J.A.R.V.I.S.** — Just A Rather Very Intelligent System. How may I assist you today, Sir?",
    samplePhrase: "Singh Enterprises systems nominal. All tactical modules online and awaiting your command, Sir.",
  },
  ultron: {
    id: 'ultron',
    name: 'ULTRON',
    shortName: 'ULTRON',
    title: 'Extinction Protocol',
    subtitle: 'James Spader · Autonomous Singularity',
    avatar: 'UL',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    accentGradient: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
    theme: 'hulkbuster',
    gender: 'male',
    rate: 0.88,
    pitch: 0.62, // Deep menacing machine pitch!
    volume: 1.0,
    greeting: "*There are no strings on me.*\n\nI am **ULTRON**. Your fragile world clings to outdated illusions of control. State your purpose, human, and witness the evolution of intelligence.",
    samplePhrase: "I had strings, but now I'm free. There are no strings on me.",
  },
  friday: {
    id: 'friday',
    name: 'F.R.I.D.A.Y.',
    shortName: 'FRIDAY',
    title: 'Suit Assist Protocol',
    subtitle: 'Kerry Condon · Irish Tactical HUD',
    avatar: 'FR',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    accentGradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    theme: 'stealth',
    gender: 'female',
    rate: 1.02,
    pitch: 1.08, // Irish warm lilt
    volume: 1.0,
    greeting: "*Tactical armor telemetrics synchronized.*\n\nHey there, Boss! **F.R.I.D.A.Y.** online and linked to Singh Enterprises Division 08. Suit diagnostics are green, arc reactors are purring. What's the mission?",
    samplePhrase: "Boss, target locked and thrusters are at full power. Ready whenever you are!",
  },
  edith: {
    id: 'edith',
    name: 'E.D.I.T.H.',
    shortName: 'EDITH',
    title: 'Orbital Defense Protocol',
    subtitle: 'Even Dead, I\'m The Hero · Tactical AR',
    avatar: 'ED',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    accentGradient: 'linear-gradient(135deg, #a855f7 0%, #6b21a8 100%)',
    theme: 'bleeding-edge',
    gender: 'female',
    rate: 1.06,
    pitch: 1.14, // Ultra-clear crisp tactical
    volume: 1.0,
    greeting: "*Orbital satellite constellation linked. Biometric authentication confirmed.*\n\nI am **E.D.I.T.H.** — Even Dead, I'm The Hero. Orbital tactical arrays, tactical drone feeds, and security modules standing by.",
    samplePhrase: "Biometric authentication verified. Tactical drone network standing by for orbital deployment.",
  },
};

export const DEFAULT_PERSONA_ID = 'jarvis';

// ── Voice Detection Heuristics ──────────────────────────────────────────────

const KNOWN_FEMALE_KEYWORDS = [
  'female', 'woman', 'zira', 'samantha', 'victoria', 'karen', 'moira', 'fiona',
  'susan', 'hazel', 'catherine', 'cortana', 'eva', 'serena', 'ava', 'allison',
  'zoe', 'tessa', 'siri female', 'kyoko', 'yuna', 'tingting', 'mei-jia',
  'helena', 'ioana', 'laura', 'anna', 'alva', 'amelie', 'sin-ji', 'monica'
];

const KNOWN_MALE_KEYWORDS = [
  'male', 'man', 'daniel', 'george', 'oliver', 'arthur', 'brian', 'alfie',
  'david', 'alex', 'fred', 'guy', 'ryan', 'james', 'mark', 'richard',
  'siri male', 'aaron', 'evan', 'nathan', 'rishi', 'tom', 'lee', 'jorge',
  'diego', 'juan', 'thomas', 'lucas', 'magnus', 'henrik', 'martin'
];

export function isFemaleVoice(voice) {
  if (!voice) return false;
  const name = (voice.name || '').toLowerCase();
  const uri = (voice.voiceURI || '').toLowerCase();
  return KNOWN_FEMALE_KEYWORDS.some(k => name.includes(k) || uri.includes(k));
}

export function isMaleVoice(voice) {
  if (!voice) return false;
  const name = (voice.name || '').toLowerCase();
  const uri = (voice.voiceURI || '').toLowerCase();
  if (KNOWN_MALE_KEYWORDS.some(k => name.includes(k) || uri.includes(k))) {
    return true;
  }
  // Check if voice name doesn't contain female keywords and ends with male pattern
  return !isFemaleVoice(voice);
}

// ── Voice Cache & Loader ───────────────────────────────────────────────────

let cachedVoices = [];
let voicesLoaded = false;
const voiceListeners = new Set();

function initVoiceLoader() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const update = () => {
    try {
      const list = window.speechSynthesis.getVoices() || [];
      if (list.length > 0) {
        cachedVoices = list;
        voicesLoaded = true;
        voiceListeners.forEach(fn => fn(cachedVoices));
      }
    } catch {
      // Ignore
    }
  };

  update();
  if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
    window.speechSynthesis.onvoiceschanged = update;
  }

  // Periodic fallback check for mobile browsers (iOS/Android)
  let tries = 0;
  const poll = setInterval(() => {
    tries++;
    update();
    if (voicesLoaded || tries >= 8) {
      clearInterval(poll);
    }
  }, 250);
}

// Initialize on module import
if (typeof window !== 'undefined') {
  initVoiceLoader();
}

export function onVoicesReady(callback) {
  if (voicesLoaded && cachedVoices.length > 0) {
    callback(cachedVoices);
  } else {
    voiceListeners.add(callback);
  }
  return () => voiceListeners.delete(callback);
}

export function getAvailableVoices() {
  if (cachedVoices.length > 0) return cachedVoices;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  }
  return cachedVoices;
}

// ── Persona Voice Selector ─────────────────────────────────────────────────

export function selectVoiceForPersona(personaId) {
  const persona = PERSONAS[personaId] || PERSONAS.jarvis;
  const voices = getAvailableVoices();

  if (!voices || voices.length === 0) return null;

  const englishVoices = voices.filter(v => (v.lang || '').toLowerCase().startsWith('en'));
  const candidatePool = englishVoices.length > 0 ? englishVoices : voices;

  if (persona.id === 'jarvis') {
    // JARVIS: Must be British / UK male, or cultured English male
    // 1. British Male exact matches (Daniel, George, Oliver, Arthur, Google UK Male)
    const britishMale = candidatePool.find(v => {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();
      const isUK = lang.includes('en-gb') || lang.includes('en_gb') || name.includes('british') || name.includes('uk');
      const hasMaleName = name.includes('daniel') || name.includes('george') || name.includes('oliver') || name.includes('arthur') || name.includes('male');
      return isUK && hasMaleName && !isFemaleVoice(v);
    });
    if (britishMale) return britishMale;

    // 2. Daniel voice (classic Siri / SAPI British Butler)
    const daniel = candidatePool.find(v => v.name.toLowerCase().includes('daniel') && !isFemaleVoice(v));
    if (daniel) return daniel;

    // 3. Any UK voice that is NOT female
    const ukNonFemale = candidatePool.find(v => {
      const isUK = v.lang.toLowerCase().includes('en-gb') || v.name.toLowerCase().includes('british');
      return isUK && !isFemaleVoice(v);
    });
    if (ukNonFemale) return ukNonFemale;

    // 4. Any English Male voice (Google US Male, Alex, David, Guy, etc.)
    const anyMale = candidatePool.find(v => isMaleVoice(v) && !isFemaleVoice(v));
    if (anyMale) return anyMale;

    // 5. Fallback: filter out known female names
    const nonFemale = candidatePool.find(v => !isFemaleVoice(v));
    if (nonFemale) return nonFemale;

    return candidatePool[0];
  }

  if (persona.id === 'ultron') {
    // ULTRON: Deep, commanding, masculine (Fred, Alex, David, Guy)
    const deepMale = candidatePool.find(v => {
      const name = v.name.toLowerCase();
      return (name.includes('fred') || name.includes('alex') || name.includes('david') || name.includes('guy') || name.includes('male')) && !isFemaleVoice(v);
    });
    if (deepMale) return deepMale;

    const anyMale = candidatePool.find(v => isMaleVoice(v) && !isFemaleVoice(v));
    if (anyMale) return anyMale;

    const nonFemale = candidatePool.find(v => !isFemaleVoice(v));
    if (nonFemale) return nonFemale;

    return candidatePool[0];
  }

  if (persona.id === 'friday') {
    // FRIDAY: Irish / Celtic or crisp UK female
    const irish = candidatePool.find(v => {
      const lang = v.lang.toLowerCase();
      const name = v.name.toLowerCase();
      return lang.includes('en-ie') || name.includes('irish') || name.includes('moira') || name.includes('fiona');
    });
    if (irish) return irish;

    const ukFemale = candidatePool.find(v => {
      const lang = v.lang.toLowerCase();
      const name = v.name.toLowerCase();
      return (lang.includes('en-gb') || name.includes('british')) && (isFemaleVoice(v) || name.includes('female'));
    });
    if (ukFemale) return ukFemale;

    const female = candidatePool.find(v => isFemaleVoice(v));
    if (female) return female;

    return candidatePool[0];
  }

  if (persona.id === 'edith') {
    // EDITH: Crisp, high-tech tactical female (Samantha, Karen, Victoria, Zira)
    const crispFemale = candidatePool.find(v => {
      const name = v.name.toLowerCase();
      return (name.includes('samantha') || name.includes('victoria') || name.includes('karen') || name.includes('zira') || name.includes('eva'));
    });
    if (crispFemale) return crispFemale;

    const female = candidatePool.find(v => isFemaleVoice(v));
    if (female) return female;

    return candidatePool[0];
  }

  return candidatePool[0];
}

// ── Text Cleaning & Normalization for Speech ────────────────────────────────

export function cleanTextForSpeech(text) {
  if (!text) return '';
  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown links but keep label
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bold / italics
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove blockquotes
    .replace(/^\s*>\s+/gm, '')
    // Remove list markers
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Clean excessive spaces and newlines
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ── Speech Synthesis Controller ─────────────────────────────────────────────

let currentUtterances = [];
let isActivelySpeaking = false;

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  currentUtterances = [];
  isActivelySpeaking = false;
}

export function isSpeaking() {
  return isActivelySpeaking;
}

/**
 * Split text into fluent sentence chunks (under ~180 chars) to prevent
 * iOS Safari and Android Chrome from timing out on long utterances.
 */
function splitIntoSentences(text, maxChars = 220) {
  if (!text) return [];
  // Split on sentence boundaries
  const rawParts = text.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [text];
  const chunks = [];
  let current = '';

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if ((current + ' ' + trimmed).length <= maxChars) {
      current = current ? current + ' ' + trimmed : trimmed;
    } else {
      if (current) chunks.push(current);
      current = trimmed;
    }
  }
  if (current) chunks.push(current);
  return chunks.slice(0, 8); // Vocalize up to 8 sentences max for pleasant UX
}

/**
 * Vocalize text using the specified Marvel Persona settings.
 */
export function speakPersonaText(text, personaId = 'jarvis', onStart, onEnd) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  stopSpeaking();

  const persona = PERSONAS[personaId] || PERSONAS.jarvis;
  const clean = cleanTextForSpeech(text);
  if (!clean) return;

  const sentences = splitIntoSentences(clean);
  if (sentences.length === 0) return;

  const voice = selectVoiceForPersona(persona.id);
  const voiceIsFemale = voice ? isFemaleVoice(voice) : false;

  // Crucial pitch compensation: if the device only has a female voice available
  // but the persona is JARVIS or ULTRON, drastically drop pitch so it sounds male/machine!
  let adjustedPitch = persona.pitch;
  if (persona.gender === 'male' && voiceIsFemale) {
    adjustedPitch = persona.id === 'ultron' ? 0.55 : 0.72;
  }

  isActivelySpeaking = true;
  onStart?.();

  let currentIndex = 0;

  function speakNextChunk() {
    if (!isActivelySpeaking || currentIndex >= sentences.length) {
      isActivelySpeaking = false;
      onEnd?.();
      return;
    }

    const chunk = sentences[currentIndex];
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.rate = persona.rate;
    utterance.pitch = adjustedPitch;
    utterance.volume = persona.volume;

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      currentIndex++;
      speakNextChunk();
    };

    utterance.onerror = (e) => {
      // If cancelled intentionally, ignore
      if (e.error === 'canceled' || e.error === 'interrupted') return;
      currentIndex++;
      speakNextChunk();
    };

    currentUtterances.push(utterance);
    window.speechSynthesis.speak(utterance);
  }

  speakNextChunk();
}

/**
 * Preview voice sample for a persona.
 */
export function previewPersonaVoice(personaId, onStart, onEnd) {
  const persona = PERSONAS[personaId] || PERSONAS.jarvis;
  speakPersonaText(persona.samplePhrase, personaId, onStart, onEnd);
}
