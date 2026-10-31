// Learner state: progress, word strength, streak, time per day, and an event log
// that is synced to Supabase so Eslam can follow along from another country.
import { cloudEnabled, currentUser, rest } from './cloud.js';
import { UNITS, lessonsOf } from './content.js';

const STATE_KEY = 'ts_state';
const QUEUE_KEY = 'ts_queue';

export const today = () => new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD

function fresh() {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    xp: 0,
    streak: { count: 0, last: null, best: 0 },
    dailyGoalMin: 30,
    daily: {},        // date -> seconds active
    units: {},        // unitId -> { lessonsDone, testBest, passed, testTries }
    words: {},        // sv -> { seen, ok, bad, box, due, last }
    tests: [],        // { unit, score, passed, at }
    position: { unit: UNITS[0].id, lesson: 0 },
    games: {},        // gameId -> { best, plays }
    updatedAt: null,
  };
}

let state = load();
let queue = loadQueue();

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STATE_KEY));
    if (s && s.version === 1) return s;
  } catch {}
  return fresh();
}
function loadQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; } catch { return []; }
}

export function getState() { return state; }

export function save() {
  state.updatedAt = new Date().toISOString();
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {}
  scheduleSync();
}

export function replaceState(s) {
  state = s;
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {}
}

// ---- Event log ----
export function log(type, data = {}) {
  queue.push({ client_ts: new Date().toISOString(), type, data });
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch {}
  scheduleSync();
}

// ---- Words (spaced repetition, Leitner boxes) ----
const BOX_DAYS = [0, 1, 2, 4, 7, 15, 30, 60];

export function wordInfo(sv) {
  return state.words[sv] || { seen: 0, ok: 0, bad: 0, box: 0, due: null, last: null };
}

export function recordAnswer(item, exType, ok, given) {
  const w = { ...wordInfo(item.sv) };
  w.seen += 1;
  ok ? w.ok++ : w.bad++;
  w.box = ok ? Math.min(w.box + 1, BOX_DAYS.length - 1) : Math.max(1, w.box - 2);
  const due = new Date();
  due.setDate(due.getDate() + BOX_DAYS[w.box]);
  w.due = due.toLocaleDateString('sv-SE');
  w.last = new Date().toISOString();
  state.words[item.sv] = w;
  log('answer', { sv: item.sv, ex: exType, ok, given: given ?? null });
}

export function dueWords() {
  const t = today();
  return Object.entries(state.words)
    .filter(([, w]) => w.due && w.due <= t)
    .map(([sv]) => sv);
}

// Strength 0-100 for display: box progress, damped by error rate.
export function strength(w) {
  if (!w || !w.seen) return 0;
  const boxPart = w.box / (BOX_DAYS.length - 1);
  const acc = w.ok / w.seen;
  return Math.round(100 * (0.7 * boxPart + 0.3 * acc));
}

// ---- XP, streak, time ----
export function addXp(n) {
  state.xp += n;
  touchStreak();
}

function touchStreak() {
  const t = today();
  const s = state.streak;
  if (s.last === t) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  s.count = s.last === y.toLocaleDateString('sv-SE') ? s.count + 1 : 1;
  s.last = t;
  s.best = Math.max(s.best, s.count);
}

export function level() { return 1 + Math.floor(Math.sqrt(state.xp / 50)); }

export function secondsToday() { return state.daily[today()] || 0; }

let lastInteraction = Date.now();
export function startClock() {
  ['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => { lastInteraction = Date.now(); }));
  setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    if (Date.now() - lastInteraction > 90_000) return;
    const t = today();
    state.daily[t] = (state.daily[t] || 0) + 5;
    if (state.daily[t] % 60 === 0) save();
  }, 5000);
}

// ---- Units ----
export function unitProgress(id) {
  return state.units[id] || { lessonsDone: 0, testBest: null, passed: false, testTries: 0 };
}

export function isUnitOpen(index) {
  if (index === 0) return true;
  return unitProgress(UNITS[index - 1].id).passed;
}

export function finishLesson(unit, lessonIndex, score, secs) {
  const p = { ...unitProgress(unit.id) };
  p.lessonsDone = Math.max(p.lessonsDone, lessonIndex + 1);
  state.units[unit.id] = p;
  const total = lessonsOf(unit).length;
  state.position = { unit: unit.id, lesson: Math.min(p.lessonsDone, total) };
  log('lesson_done', { unit: unit.id, lesson: lessonIndex, score, secs });
}

export function finishTest(unit, score, secs) {
  const passed = score >= 80;
  const p = { ...unitProgress(unit.id) };
  p.testTries += 1;
  p.testBest = Math.max(p.testBest ?? 0, score);
  p.passed = p.passed || passed;
  state.units[unit.id] = p;
  state.tests.push({ unit: unit.id, score, passed, at: new Date().toISOString() });
  if (passed) {
    const i = UNITS.findIndex(u => u.id === unit.id);
    if (UNITS[i + 1]) state.position = { unit: UNITS[i + 1].id, lesson: 0 };
  }
  log('test_done', { unit: unit.id, score, passed, secs });
  return passed;
}

export function finishGame(id, score) {
  const g = state.games[id] || { best: 0, plays: 0 };
  g.plays += 1;
  g.best = Math.max(g.best, score);
  state.games[id] = g;
  log('game_done', { game: id, score });
}

// ---- Sync ----
let syncTimer = null;
export let syncStatus = 'local'; // local | ok | pending | error

function scheduleSync() {
  if (!cloudEnabled() || !currentUser()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(sync, 3000);
}

export async function sync() {
  if (!cloudEnabled() || !currentUser() || !navigator.onLine) return;
  syncStatus = 'pending';
  try {
    if (queue.length) {
      const batch = queue.slice(0, 200);
      await rest('events', { method: 'POST', body: batch });
      queue = queue.slice(batch.length);
      try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch {}
    }
    await rest('learner_state', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates',
      body: { user_id: currentUser().id, state, updated_at: new Date().toISOString() },
    });
    syncStatus = 'ok';
    if (queue.length) scheduleSync();
  } catch (e) {
    console.warn('sync failed', e);
    syncStatus = 'error';
    clearTimeout(syncTimer);
    syncTimer = setTimeout(sync, 60_000);
  }
}

// After sign-in on a new phone: take the cloud copy if it is ahead of the local one.
export async function pullState() {
  const rows = await rest(`learner_state?user_id=eq.${currentUser().id}&select=state`);
  const remote = rows?.[0]?.state;
  if (remote && (remote.xp || 0) > (state.xp || 0)) replaceState(remote);
}

addEventListener('online', () => sync());
