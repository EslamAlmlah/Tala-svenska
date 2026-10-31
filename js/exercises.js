// Builds exercise queues and renders each exercise type.
import { UNITS, lessonsOf, allItems } from './content.js';
import { getState, wordInfo, dueWords } from './store.js';
import { say, canListen, listen, similarity, normalize } from './speech.js';
import { t, tp, esc } from './i18n.js';

export const shuffle = a => {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const pick = (a, n) => shuffle(a).slice(0, n);

const ITEMS = allItems();
const bySv = new Map(ITEMS.map(i => [i.sv, i]));
export const itemBySv = sv => bySv.get(sv) || minedItem(sv);
const minedItem = sv => { const m = getState().mined?.[sv]; return m && { ...m, unit: 'mined', kind: 'sentence' }; };

function distractors(item, n) {
  const same = ITEMS.filter(i => i.kind === item.kind && i.sv !== item.sv && i.ar !== item.ar);
  const sameUnit = same.filter(i => i.unit === item.unit);
  const pool = sameUnit.length >= n ? sameUnit : same;
  return pick(pool, n);
}

const isSingleChar = item => item.sv.length <= 1;
const words = s => s.replace(/[.,!?]/g, '').split(' ');

// A few older words to keep earlier units alive inside new lessons.
function reviewItems(unitId, n) {
  const due = dueWords().map(itemBySv).filter(i => i && i.unit !== unitId);
  if (due.length >= n) return pick(due, n);
  const seen = Object.keys(getState().words).map(itemBySv).filter(i => i && i.unit !== unitId);
  const weak = seen.sort((a, b) => wordInfo(a.sv).box - wordInfo(b.sv).box);
  return [...due, ...weak.filter(i => !due.includes(i))].slice(0, n);
}

export function lessonQueue(unit, lessonIndex) {
  const lesson = lessonsOf(unit)[lessonIndex];
  const items = lesson.items.map(i => itemBySv(i.sv));
  const learn = items.map(item => ({ type: 'learn', item }));
  let practice = [];
  if (lesson.kind === 'words') {
    for (const item of items) {
      practice.push({ type: 'chooseMeaning', item });
      practice.push({ type: Math.random() < 0.5 ? 'chooseSwedish' : 'listenChoose', item });
    }
    for (const item of pick(items, 3)) practice.push({ type: 'type', item });
    const speakable = items.filter(i => !isSingleChar(i));
    for (const item of pick(speakable, 2)) practice.push({ type: 'speak', item });
    practice = shuffle(practice);
    practice.splice(Math.floor(practice.length / 2), 0, { type: 'match', items });
  } else {
    for (const item of items) {
      practice.push({ type: 'build', item });
      practice.push({ type: Math.random() < 0.5 ? 'chooseMeaning' : 'listenChoose', item });
    }
    for (const item of pick(items, 2)) practice.push({ type: 'speak', item });
    practice = shuffle(practice);
  }
  for (const item of reviewItems(unit.id, 3)) {
    practice.push({ type: item.kind === 'sentence' ? 'build' : 'chooseSwedish', item, review: true });
  }
  return [...learn, ...practice];
}

export function testQueue(unit) {
  const items = [...unit.words, ...unit.sentences].map(i => itemBySv(i.sv));
  const out = [];
  const types = ['chooseMeaning', 'chooseSwedish', 'listenChoose', 'type'];
  for (const item of shuffle(items)) {
    if (out.length >= 15) break;
    const type = item.kind === 'sentence' ? (Math.random() < 0.6 ? 'build' : 'listenChoose') : types[out.length % types.length];
    out.push({ type, item });
  }
  while (out.length < 15) {
    const item = items[Math.floor(Math.random() * items.length)];
    out.push({ type: item.kind === 'sentence' ? 'build' : 'chooseMeaning', item });
  }
  return shuffle(out);
}

// ---- Rendering ----
// Each renderer fills `el` and calls answer(ok, given) once. 'learn' and 'match' call answer(true).

const sv = (s, cls = '') => `<span class="sv ${cls}" lang="sv" dir="ltr">${esc(s)}</span>`;
const audioBtns = text => `
  <div class="audio-row">
    <button class="btn-audio" data-say="${esc(text)}" aria-label="${tp('listen')}">🔊</button>
    <button class="btn-audio small" data-say-slow="${esc(text)}" aria-label="${tp('slow')}">🐢</button>
  </div>`;

function wireAudio(el) {
  el.querySelectorAll('[data-say]').forEach(b => b.onclick = () => say(b.dataset.say));
  el.querySelectorAll('[data-say-slow]').forEach(b => b.onclick = () => say(b.dataset.saySlow, true));
}

function options(el, opts, correct, render, answer) {
  const box = el.querySelector('.options');
  box.innerHTML = opts.map((o, i) => `<button class="opt" data-i="${i}">${render(o)}</button>`).join('');
  box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    const o = opts[+b.dataset.i];
    const ok = o === correct;
    box.querySelectorAll('.opt').forEach(x => {
      x.disabled = true;
      if (opts[+x.dataset.i] === correct) x.classList.add('right');
    });
    if (!ok) b.classList.add('bad');
    answer(ok, o.sv);
  });
}

export const RENDER = {
  learn(el, ex, answer) {
    const { item } = ex;
    el.innerHTML = `
      <p class="ex-title">${t('newWord')}</p>
      <div class="card learn">
        ${item.e ? `<div class="emoji">${item.e}</div>` : ''}
        ${sv(item.sv, 'big')}
        <div class="ar-big">${esc(item.ar)}</div>
        ${item.n ? `<p class="note">${esc(item.n)}</p>` : ''}
        ${audioBtns(item.sv)}
      </div>
      <button class="btn primary wide" id="go">${t('continue')}</button>`;
    wireAudio(el);
    say(item.sv);
    el.querySelector('#go').onclick = () => answer(true, null, { silent: true });
  },

  chooseMeaning(el, ex, answer) {
    const { item } = ex;
    el.innerHTML = `
      <p class="ex-title">${t('chooseMeaning')}</p>
      <div class="prompt">${sv(item.sv, 'big')}${audioBtns(item.sv)}</div>
      <div class="options"></div>`;
    wireAudio(el);
    say(item.sv);
    options(el, shuffle([item, ...distractors(item, 3)]), item, o => esc(o.ar), answer);
  },

  chooseSwedish(el, ex, answer) {
    const { item } = ex;
    el.innerHTML = `
      <p class="ex-title">${t('chooseSwedish')}</p>
      <div class="prompt"><div class="ar-big">${item.e ? item.e + ' ' : ''}${esc(item.ar)}</div></div>
      <div class="options"></div>`;
    options(el, shuffle([item, ...distractors(item, 3)]), item, o => sv(o.sv), answer);
  },

  listenChoose(el, ex, answer) {
    const { item } = ex;
    el.innerHTML = `
      <p class="ex-title">${t('listenChoose')}</p>
      <div class="prompt">${audioBtns(item.sv)}</div>
      <div class="options"></div>`;
    wireAudio(el);
    setTimeout(() => say(item.sv), 250);
    options(el, shuffle([item, ...distractors(item, 3)]), item, o => sv(o.sv), answer);
  },

  type(el, ex, answer) {
    const { item } = ex;
    el.innerHTML = `
      <p class="ex-title">${t('type')}</p>
      <div class="prompt"><div class="ar-big">${item.e ? item.e + ' ' : ''}${esc(item.ar)}</div></div>
      <input class="type-in" lang="sv" dir="ltr" autocomplete="off" autocapitalize="off" spellcheck="false">
      <div class="special">${['å', 'ä', 'ö'].map(c => `<button data-c="${c}">${c}</button>`).join('')}</div>
      <button class="btn primary wide" id="go">${t('check')}</button>`;
    const input = el.querySelector('input');
    el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { input.value += b.dataset.c; input.focus(); });
    const check = () => {
      const given = input.value;
      if (!given.trim()) return;
      input.disabled = true;
      el.querySelector('#go').disabled = true;
      const exact = normalize(given) === normalize(item.sv);
      const close = similarity(given, item.sv) >= 0.85;
      answer(exact || close, given, close && !exact ? { typo: true } : {});
    };
    el.querySelector('#go').onclick = check;
    input.onkeydown = e => { if (e.key === 'Enter') check(); };
    setTimeout(() => input.focus(), 50);
  },

  build(el, ex, answer) {
    const { item } = ex;
    const target = words(item.sv);
    const pool = shuffle(target.map((w, i) => ({ w, i })));
    const chosen = [];
    el.innerHTML = `
      <p class="ex-title">${t('build')}</p>
      <div class="prompt"><div class="ar-big">${esc(item.ar)}</div>${audioBtns(item.sv)}</div>
      <div class="build-line" dir="ltr" lang="sv"></div>
      <div class="build-pool" dir="ltr" lang="sv"></div>
      <button class="btn primary wide" id="go" disabled>${t('check')}</button>`;
    wireAudio(el);
    const line = el.querySelector('.build-line');
    const poolEl = el.querySelector('.build-pool');
    const go = el.querySelector('#go');
    const draw = () => {
      line.innerHTML = chosen.map((c, k) => `<button class="tile" data-k="${k}">${esc(c.w)}</button>`).join('');
      poolEl.innerHTML = pool.map((c, k) => `<button class="tile" data-k="${k}" ${chosen.includes(c) ? 'disabled' : ''}>${esc(c.w)}</button>`).join('');
      line.querySelectorAll('.tile').forEach(b => b.onclick = () => { chosen.splice(+b.dataset.k, 1); draw(); });
      poolEl.querySelectorAll('.tile').forEach(b => b.onclick = () => { chosen.push(pool[+b.dataset.k]); draw(); });
      go.disabled = chosen.length !== target.length;
    };
    draw();
    go.onclick = () => {
      go.disabled = true;
      el.querySelectorAll('.tile').forEach(b => b.disabled = true);
      const given = chosen.map(c => c.w).join(' ');
      answer(normalize(given) === normalize(target.join(' ')), given);
    };
  },

  speak(el, ex, answer) {
    const { item } = ex;
    if (!canListen()) return answer(null);
    el.innerHTML = `
      <p class="ex-title">${t('sayIt')}</p>
      <div class="prompt">${sv(item.sv, 'big')}<div class="ar">${esc(item.ar)}</div>${audioBtns(item.sv)}</div>
      <button class="btn mic" id="mic">🎤 ${t('speak')}</button>
      <p class="heard" id="heard"></p>
      <button class="btn ghost wide" id="skip">${t('cantSpeak')}</button>`;
    wireAudio(el);
    const mic = el.querySelector('#mic');
    let tries = 0;
    mic.onclick = async () => {
      mic.classList.add('on');
      mic.disabled = true;
      try {
        const heard = await listen();
        const best = heard.reduce((m, h) => Math.max(m, similarity(h, item.sv)), 0);
        el.querySelector('#heard').innerHTML = heard.length ? `${t('heard')} ${sv(heard[0])}` : '…';
        tries++;
        if (best >= 0.75 || tries >= 3) answer(best >= 0.75, heard[0] || '');
      } catch {
        el.querySelector('#heard').textContent = '…';
      }
      mic.classList.remove('on');
      mic.disabled = false;
    };
    el.querySelector('#skip').onclick = () => answer(null);
  },

  match(el, ex, answer) {
    el.innerHTML = `<p class="ex-title">${t('match')}</p><div class="match-grid"></div>`;
    matchBoard(el.querySelector('.match-grid'), ex.items, () => answer(true, null, { silent: true }));
  },
};

// Pairs board shared by the lesson exercise and the match game.
export function matchBoard(grid, items, onDone, onMiss = () => {}) {
  const left = shuffle(items).map(i => ({ i, side: 'sv' }));
  const right = shuffle(items).map(i => ({ i, side: 'ar' }));
  grid.innerHTML = left.map((c, k) =>
    `<button class="pair" data-s="sv" data-k="${k}" lang="sv" dir="ltr">${esc(c.i.sv)}</button>` +
    `<button class="pair" data-s="ar" data-k="${k}">${esc(right[k].i.ar)}</button>`).join('');
  let sel = null;
  let left_ = items.length;
  grid.querySelectorAll('.pair').forEach(b => b.onclick = () => {
    const card = (b.dataset.s === 'sv' ? left : right)[+b.dataset.k];
    if (card.side === 'sv') say(card.i.sv);
    if (!sel || sel.card.side === card.side) {
      sel?.b.classList.remove('sel');
      sel = { b, card };
      b.classList.add('sel');
      return;
    }
    if (sel.card.i === card.i) {
      sel.b.classList.remove('sel');
      sel.b.classList.add('gone'); b.classList.add('gone');
      sel.b.disabled = b.disabled = true;
      sel = null;
      if (--left_ === 0) setTimeout(onDone, 300);
    } else {
      const s = sel.b;
      s.classList.add('bad'); b.classList.add('bad');
      setTimeout(() => { s.classList.remove('bad', 'sel'); b.classList.remove('bad'); }, 400);
      sel = null;
      onMiss();
    }
  });
}
