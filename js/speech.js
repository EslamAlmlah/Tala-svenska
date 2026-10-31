// Swedish text-to-speech and speech recognition through the browser (Chrome on Android).

let svVoice = null;

function pickVoice() {
  const voices = speechSynthesis.getVoices();
  svVoice = voices.find(v => v.lang === 'sv-SE') || voices.find(v => v.lang?.startsWith('sv')) || null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

export const hasSwedishVoice = () => Boolean(svVoice);

export function say(text, slow = false) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'sv-SE';
  if (svVoice) u.voice = svVoice;
  u.rate = slow ? 0.6 : 0.9;
  speechSynthesis.speak(u);
}

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canListen = () => Boolean(Recognition);

// Resolves with the list of things the phone thinks were said.
export function listen() {
  return new Promise((resolve, reject) => {
    const r = new Recognition();
    r.lang = 'sv-SE';
    r.maxAlternatives = 5;
    r.interimResults = false;
    r.onresult = e => resolve(Array.from(e.results[0]).map(a => a.transcript));
    r.onerror = e => reject(e.error);
    r.onnomatch = () => resolve([]);
    r.start();
  });
}

export function normalize(s) {
  return s.toLowerCase().replace(/[.,!?¿¡"'«»:;]/g, '').replace(/\s+/g, ' ').trim();
}

function levenshtein(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

// 0..1, where 1 is identical after normalizing.
export function similarity(a, b) {
  a = normalize(a); b = normalize(b);
  if (!a.length && !b.length) return 1;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}
