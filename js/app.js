// Tala's app: screens and navigation.
import { UNITS, COMING, PHASES, lessonsOf } from './content.js';
import * as S from './store.js';
import { cloudEnabled, currentUser, signIn } from './cloud.js';
import { lessonQueue, testQueue, RENDER, itemBySv, shuffle, matchBoard } from './exercises.js';
import { say, sayQueued, stopSpeaking, hasSwedishVoice } from './speech.js';
import { t, tp, esc, uiStage } from './i18n.js';
import { greeting, cheer, wordOfDay, confetti } from './greet.js';
import { LIFE } from './life.js';
import { STORIES, COMMON } from './stories.js';

const $ = sel => document.querySelector(sel);
const main = $('#main');
const svs = s => `<span class="sv" lang="sv" dir="ltr">${esc(s)}</span>`;
// Counters like "3 / 15" must stay left-to-right inside Arabic text.
const frac = (a, b) => `<bdi dir="ltr">${a} / ${b}</bdi>`;

// ---- Router ----
const routes = {
  home: renderHome,
  course: renderCourse,
  lesson: (u, l) => runSession('lesson', UNITS.find(x => x.id === u), +l),
  test: u => runSession('test', UNITS.find(x => x.id === u)),
  review: renderReview,
  mywords: renderMyWords,
  reviewset: reviewSet,
  games: renderGames,
  game: id => (id === 'match' ? gameMatch() : gameListen()),
  me: renderMe,
  practice: renderPractice,
  practicewords: () => runSession('lesson', practiceUnit(), 0),
  sverige: renderLife,
  life: renderTopic,
  lifewords: id => runSession('lesson', lifeUnit(id), 0),
  lifequiz: runQuiz,
  story: renderStory,
  login: renderLogin,
};

function route() {
  if (cloudEnabled() && !currentUser()) return renderLogin();
  const [name, ...args] = (location.hash.slice(2) || 'home').split('/');
  scrollTo(0, 0);
  (routes[name] || renderHome)(...args);
  const tab = ['review', 'games', 'mywords', 'reviewset'].includes(name) ? 'practice' : name;
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.dataset.r === tab));
  const inSession = ['lesson', 'test', 'game', 'lifewords', 'lifequiz', 'practicewords', 'story'].includes(name);
  $('nav').hidden = inSession;
  $('header').hidden = inSession;
}
const go = path => { location.hash = '#/' + path; };
addEventListener('hashchange', route);

function renderChrome() {
  $('nav').innerHTML = [
    ['home', '🏠'], ['course', '🗺️'], ['practice', '🎯'], ['sverige', '🇸🇪'], ['me', '👤'],
  ].map(([r, i]) => `<a href="#/${r}" data-r="${r}"><span class="i">${i}</span><span class="l">${t(r)}</span></a>`).join('');
  const st = S.getState();
  $('header').innerHTML = `
    <span class="pill">🔥 ${st.streak.count}</span>
    <span class="pill">⭐ ${st.xp}</span>
    <span class="pill">${t('level')} ${S.level()}</span>`;
}

// ---- Home ----
function renderHome() {
  renderChrome();
  const st = S.getState();
  const mins = Math.floor(S.secondsToday() / 60);
  const goal = st.dailyGoalMin;
  const pct = Math.min(100, Math.round((mins / goal) * 100));
  const unit = UNITS.find(u => u.id === st.position.unit) || UNITS[0];
  const due = S.dueWords().length;
  const lessons = lessonsOf(unit);
  const p = S.unitProgress(unit.id);
  const nextStep = unitNextStep(unit);
  const nextLabel = nextStep.kind === 'test' ? t('test') : nextStep.kind === 'story' ? `📖 ${t('story')}` : `${t('lesson')} ${p.lessonsDone + 1}`;
  const g = greeting();
  const [cheerSv, cheerAr] = cheer(st);
  const wod = wordOfDay();
  const nextLife = LIFE.find(l => { const p = S.lifeProgress(l.id); return !(p.read && p.quizBest != null); });
  main.innerHTML = `
    <section class="greet" style="--sky:${g.sky}">
      <span class="sym">${g.sym}</span>
      <div class="hello" lang="sv" dir="ltr">${esc(g.svText)}</div>
      <div class="hello-ar">${esc(g.arText)}</div>
      <button class="say" id="sayHi">🔊 ${svs(g.sv)}</button>
      <p class="line">✨ ${svs(cheerSv)} · ${esc(cheerAr)}</p>
    </section>
    <section class="hero">
      <div class="ring" style="--p:${pct}">
        <div><b>${mins}</b><small><bdi>/ ${goal}</bdi> ${t('minutes')}</small></div>
      </div>
      <div>
        <h1>${t('goal')}</h1>
        <p class="muted">🔥 ${t('streak')}: <b>${st.streak.count}</b></p>
      </div>
    </section>
    <section class="card next">
      <div class="unit-emoji">${unit.e}</div>
      <div class="grow">
        <h2>${esc(unit.ar)}</h2>
        <p>${svs(unit.sv)}</p>
        <span class="chip">${nextLabel}</span>
      </div>
      <button class="btn primary" id="cont">${t('continue')}</button>
    </section>
    <section class="card tap" id="rev">
      <div class="unit-emoji">🃏</div>
      <div class="grow"><h2>${due}</h2><p>${t('dueNow')}</p></div>
    </section>
    <section class="card tap word-day" id="wod">
      <b>📌 ${t('wordOfDay')}</b>
      <p>${wod.e || ''} ${svs(wod.sv)} · ${esc(wod.ar)}</p>
    </section>
    ${nextLife ? `<section class="card tap" id="life">
      <div class="unit-emoji">${nextLife.e}</div>
      <div class="grow"><p class="muted">${t('nextTopic')}</p><h2>${esc(nextLife.ar)}</h2>${svs(nextLife.sv)}</div>
    </section>` : ''}
    <section class="card tip"><b>💡 ${t('tipTitle')}</b><p>${esc(unit.tip)}</p></section>
    ${hasSwedishVoice() || voiceDismissed() ? '' : `<section class="card warn" id="voice">${t('noVoice')}
      <button class="btn ghost" id="voiceOk">✕ ${t('hide')}</button></section>`}`;
  if ($('#voiceOk')) $('#voiceOk').onclick = () => { try { localStorage.setItem('ts_voice_ok', '1'); } catch {} $('#voice').remove(); };
  showNote();
  $('#cont').onclick = () => go(nextStep.path);
  $('#rev').onclick = () => go('review');
  $('#sayHi').onclick = () => say(g.svText);
  $('#wod').onclick = () => say(wod.sv);
  if (nextLife) $('#life').onclick = () => go(`life/${nextLife.id}`);
}

// Lessons first, then the unit's story, then the test.
function unitNextStep(unit) {
  const p = S.unitProgress(unit.id);
  const n = lessonsOf(unit).length;
  if (p.lessonsDone < n) return { kind: 'lesson', path: `lesson/${unit.id}/${p.lessonsDone}` };
  if (STORIES[unit.id] && !S.storyProgress(unit.id).done) return { kind: 'story', path: `story/${unit.id}` };
  return { kind: 'test', path: `test/${unit.id}` };
}

const voiceDismissed = () => { try { return localStorage.getItem('ts_voice_ok') === '1'; } catch { return false; } };

// Latest message from Eslam, shown at the top of Home.
async function showNote() {
  const note = await S.latestNote().catch(() => null);
  if (!note || !$('.greet')) return;
  const el = document.createElement('section');
  el.className = 'card note-card';
  el.innerHTML = `<div class="unit-emoji">💌</div><div class="grow"><p class="muted">${t('fromEslam')}</p><p class="note-text" dir="auto">${esc(note.text)}</p></div>`;
  $('.greet').after(el);
}

// ---- Course map ----
function renderCourse() {
  renderChrome();
  let html = '';
  for (const ph of PHASES) {
    const units = UNITS.map((u, i) => ({ u, i })).filter(x => x.u.phase === ph.id);
    const coming = COMING.filter(c => c.phase === ph.id);
    html += `<h2 class="phase">${esc(ph.ar)}<small class="sub" lang="sv" dir="ltr">${esc(ph.sv)}</small></h2>`;
    for (const { u, i } of units) {
      const open = S.isUnitOpen(i);
      const p = S.unitProgress(u.id);
      const ls = lessonsOf(u);
      const hasStory = Boolean(STORIES[u.id]);
      const steps = Math.min(p.lessonsDone, ls.length) + (p.passed ? 1 : 0) + (hasStory && S.storyProgress(u.id).done ? 1 : 0);
      const pct = Math.round((steps / (ls.length + 1 + (hasStory ? 1 : 0))) * 100);
      html += `
        <div class="unit ${open ? '' : 'locked'} ${p.passed ? 'passed' : ''} ${u.id === S.getState().position.unit ? 'current' : ''}">
          <div class="unit-head">
            <span class="unit-emoji">${open ? u.e : '🔒'}</span>
            <div class="grow"><h3>${esc(u.ar)}</h3>${svs(u.sv)}</div>
            ${p.passed ? `<span class="crown">👑 ${p.testBest}%</span>` : ''}
          </div>
          ${open ? `<div class="unit-bar"><div style="width:${pct}%"></div></div>
            <p class="muted small">${t('lessonsWord')} ${frac(Math.min(p.lessonsDone, ls.length), ls.length)} · ${pct}%</p>`
            : `<p class="muted small">${t('unlocksAfter')} ${esc(UNITS[i - 1].ar)}</p>`}
          ${open ? `<div class="lessons">
            ${ls.map((l, k) => `<button class="dot ${k < p.lessonsDone ? 'done' : ''}" data-go="lesson/${u.id}/${k}"
              ${k > p.lessonsDone ? 'disabled' : ''}>${k < p.lessonsDone ? '✓' : k + 1}</button>`).join('')}
            ${STORIES[u.id] ? `<button class="dot story ${S.storyProgress(u.id).done ? 'done' : ''}" data-go="story/${u.id}" ${p.lessonsDone < ls.length ? 'disabled' : ''}>📖</button>` : ''}
            <button class="dot test ${p.passed ? 'done' : ''}" data-go="test/${u.id}" ${unitNextStep(u).kind !== 'test' ? 'disabled' : ''}>🏆</button>
          </div>` : ''}
        </div>`;
    }
    for (const c of coming) {
      html += `<div class="unit locked"><div class="unit-head"><span class="unit-emoji">${c.e}</span>
        <div class="grow"><h3>${esc(c.ar)}</h3>${svs(c.sv)}</div><span class="muted">${t('soon')}</span></div></div>`;
    }
  }
  main.innerHTML = html;
  main.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
}

// ---- Lesson / test session ----
function runSession(kind, unit, lessonIndex = 0) {
  if (!unit || (kind === 'lesson' && !lessonsOf(unit)[+lessonIndex])) return go('course');
  const queue = kind === 'lesson' ? lessonQueue(unit, lessonIndex) : testQueue(unit);
  const graded = new Set();
  let firstTry = 0, gradedCount = 0, i = 0, combo = 0;
  const missed = new Set();
  const started = Date.now();
  const total = queue.length;
  S.log(kind === 'lesson' ? 'lesson_start' : 'test_start', { unit: unit.id, lesson: lessonIndex });

  main.innerHTML = `
    <div class="session">
      <div class="bar-top">
        <button class="x" id="quit" aria-label="${tp('quit')}">✕</button>
        <div class="progress"><div id="prog"></div></div>
      </div>
      <div id="ex"></div>
      <div id="fb" class="feedback" hidden></div>
    </div>`;
  $('#quit').onclick = () => { S.log('quit', { unit: unit.id, kind, at: i }); go(unit.life ? `life/${unit.id}` : 'course'); };

  const next = () => {
    $('#fb').hidden = true;
    $('#prog').style.width = `${Math.round((i / queue.length) * 100)}%`;
    if (i >= queue.length) return finish();
    const ex = queue[i++];
    const el = $('#ex');
    el.className = `ex ex-${ex.type}`;
    RENDER[ex.type](el, ex, (ok, given, opts = {}) => {
      if (ok === null) return next(); // skipped (e.g. microphone unavailable)
      if (opts.silent) return next();
      const key = `${ex.type}:${ex.item.sv}`;
      if (!graded.has(key)) {
        graded.add(key);
        gradedCount++;
        if (ok) firstTry++;
        else missed.add(ex.item.sv);
        S.recordAnswer(ex.item, ex.type, ok, given);
      }
      combo = ok ? combo + 1 : 0;
      ok ? ding() : buzz();
      // In lessons, a wrong answer comes back later. Tests are one shot.
      // A second miss on typing, speaking or building comes back as an easier choice question.
      if (!ok && kind === 'lesson') {
        const hard = ['type', 'build', 'speak'].includes(ex.type);
        queue.push(ex.retry && hard ? { type: 'chooseSwedish', item: ex.item, retry: 1 } : { ...ex, retry: (ex.retry || 0) + 1 });
      }
      feedback(ok, ex.item, opts);
    });
  };

  const feedback = (ok, item, opts) => {
    const fb = $('#fb');
    fb.className = `feedback ${ok ? 'good' : 'bad'}`;
    fb.innerHTML = `
      <div class="fb-text">
        <b>${ok ? '✅ ' + t('correct') : '❌ ' + t('wrong')}${ok && combo >= 3 ? ` <span class="combo">🔥 ${combo} ${t('inARow')}</span>` : ''}</b>
        ${!ok || opts.typo ? `<p>${t('rightAnswer')}</p>` : ''}
        <p class="fb-answer">${svs(item.sv)} = ${esc(item.ar)}</p>
        ${!ok ? `<p class="muted">${t('kind')}</p>` : ''}
      </div>
      <button class="btn ${ok ? 'primary' : 'danger'} wide" id="nx">${t('continue')}</button>`;
    fb.hidden = false;
    say(item.sv);
    $('#nx').onclick = next;
  };

  const finish = () => {
    const score = gradedCount ? Math.round((firstTry / gradedCount) * 100) : 100;
    const secs = Math.round((Date.now() - started) / 1000);
    let passed = true;
    const xpBefore = S.getState().xp;
    const streakBefore = S.getState().streak.count;
    if (unit.practice) {
      S.addXp(5 + firstTry);
    } else if (unit.life) {
      S.updateLife(unit.id, { wordsDone: true }, { type: 'life_words_done', data: { score, secs } });
      S.addXp(10 + firstTry);
    } else if (kind === 'lesson') {
      S.finishLesson(unit, lessonIndex, score, secs);
      S.addXp(10 + firstTry);
    } else {
      passed = S.finishTest(unit, score, secs);
      S.addXp(passed ? 30 : 5);
    }
    S.save();
    const st = S.getState();
    const gained = st.xp - xpBefore;
    const goalPct = Math.min(100, Math.round((S.secondsToday() / 60 / st.dailyGoalMin) * 100));
    const left = unit.life || unit.practice ? 0 : lessonsOf(unit).length - S.unitProgress(unit.id).lessonsDone;
    if (passed) setTimeout(confetti, 150);
    S.setLastMissed([...missed]);
    main.innerHTML = `
      <div class="done-screen">
        <div class="big-emoji">${passed ? (score >= 90 ? '🏆' : '🎉') : '💪'}</div>
        <h1>${kind === 'test' ? (passed ? t('passed') : t('notPassed')) : t('done')}</h1>
        <div class="rewards">
          <div class="reward"><b class="countup" data-to="${gained}">+0</b><span>XP ⭐</span></div>
          <div class="reward"><b>${st.streak.count}</b><span>🔥 ${t('streak')}${st.streak.count > streakBefore ? ' ⬆️' : ''}</span></div>
          <div class="reward"><b>${score}%</b><span>${t('score')}</span></div>
        </div>
        <div class="goal-bar"><div style="width:${goalPct}%"></div></div>
        <p class="muted">${t('goal')}: ${goalPct}%${goalPct >= 100 ? ' ✅' : ''}</p>
        ${kind === 'lesson' && left > 0 ? `<p>${t('lessonsLeft')} <b>${left}</b></p>` : ''}
        ${kind === 'lesson' && left === 0 && !unit.life && !unit.practice ? `<p>${STORIES[unit.id] && !S.storyProgress(unit.id).done ? `📖 ${t('storyReady')}` : `🏆 ${t('testReady')}`}</p>` : ''}
        ${missed.size ? `<div class="missed card">
          <b>${t('missedWords')}</b>
          ${[...missed].map(sv => `<button class="word-row" data-say="${esc(sv)}">${svs(sv)}<span class="muted grow">${esc(itemBySv(sv)?.ar || '')}</span>🔊</button>`).join('')}
          <button class="btn wide" id="again">🎯 ${t('practiceThese')}</button>
        </div>` : ''}
        <button class="btn primary wide" id="home">${t('continue')}</button>
      </div>`;
    main.querySelectorAll('[data-say]').forEach(b => b.onclick = () => say(b.dataset.say));
    if ($('#again')) $('#again').onclick = () => go('practicewords');
    countUp();
    $('#home').onclick = () => go(unit.life ? `life/${unit.id}` : unit.practice ? 'practice' : 'home');
  };

  next();
}

// ---- Story / dialogue ----
function renderStory(unitId) {
  const story = STORIES[unitId];
  const unit = UNITS.find(u => u.id === unitId);
  if (!story || !unit) return go('course');
  const known = new Map([...unit.words, ...UNITS.slice(0, UNITS.indexOf(unit)).flatMap(u => u.words)]
    .map(w => [w.sv.replace(/^(en|ett) /, '').toLowerCase().replace(/[.,!?"]/g, ''), w.ar]));
  const gloss = new Map(Object.entries(story.gloss || {}));
  const meaning = w => gloss.get(w) || known.get(w) || COMMON[w];
  // Longest match first, so "god morgon" and "det här" glide together as one tap.
  const clean = w => w.toLowerCase().replace(/[.,!?"]/g, '');
  const tokens = sv => {
    const parts = sv.split(' '), html = [];
    for (let i = 0; i < parts.length;) {
      let n = 3;
      while (n > 1 && !(i + n <= parts.length && meaning(parts.slice(i, i + n).map(clean).join(' ')))) n--;
      const text = parts.slice(i, i + n).join(' '), w = parts.slice(i, i + n).map(clean).join(' ');
      html.push(meaning(w) ? `<button class="tok" data-w="${esc(w)}">${esc(text)}</button>` : esc(text));
      i += n;
    }
    return html.join(' ');
  };
  S.log('story_open', { unit: unitId });
  let playing = false;
  main.innerHTML = `
    <div class="session story">
      <div class="bar-top"><button class="x" id="quit">✕</button><b class="grow center">📖 ${t('story')}</b></div>
      <section class="topic-head"><div class="emoji">${story.e}</div><h1 lang="sv" dir="ltr">${esc(story.sv)}</h1><p class="muted">${esc(story.ar)}</p></section>
      <div class="row">
        <button class="btn primary" id="play">▶️ ${t('listenAll')}</button>
        <button class="btn" id="slow">🐢 ${t('slow')}</button>
      </div>
      <p class="muted small center">${t('storyHelp')}</p>
      <section class="card article lines">
        ${story.lines.map((l, k) => `
          <div class="line ${l.who === 'B' ? 'b' : ''}" data-k="${k}">
            ${l.who ? `<span class="who">${esc(story.people[l.who])}</span>` : ''}
            <p class="sv-line" lang="sv" dir="ltr">${tokens(l.sv)}</p>
            <p class="ar-line" hidden>${esc(l.ar)}</p>
            <div class="line-tools">
              <button class="mini" data-act="say">🔊</button>
              <button class="mini" data-act="ar">ع</button>
              <button class="mini" data-act="save">⭐</button>
            </div>
          </div>`).join('')}
      </section>
      <div id="wordtip" class="wordtip" hidden></div>
      <button class="btn primary wide" id="toQ">✅ ${t('storyQuestions')}</button>
    </div>`;
  $('#quit').onclick = () => { stopSpeaking(); go('course'); };
  const lineEl = k => main.querySelector(`.line[data-k="${k}"]`);
  const playAll = async slow => {
    if (playing) { playing = false; stopSpeaking(); return; }
    playing = true;
    stopSpeaking();
    for (let k = 0; k < story.lines.length && playing; k++) {
      lineEl(k).classList.add('now');
      lineEl(k).scrollIntoView({ behavior: 'smooth', block: 'center' });
      await sayQueued(story.lines[k].sv, slow, story.lines[k].who === 'B' ? 1.25 : 1);
      lineEl(k)?.classList.remove('now');
    }
    playing = false;
    S.log('story_listened', { unit: unitId, slow });
  };
  $('#play').onclick = () => playAll(false);
  $('#slow').onclick = () => playAll(true);
  main.querySelectorAll('.line').forEach(el => {
    const l = story.lines[+el.dataset.k];
    el.querySelector('[data-act="say"]').onclick = () => say(l.sv, false, l.who === 'B' ? 1.25 : 1);
    el.querySelector('[data-act="ar"]').onclick = () => { const a = el.querySelector('.ar-line'); a.hidden = !a.hidden; };
    el.querySelector('[data-act="save"]').onclick = e => {
      if (S.mineSentence(l)) { S.save(); e.target.textContent = '✅'; ding(); }
    };
  });
  main.querySelectorAll('.tok').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const tip = $('#wordtip');
    tip.innerHTML = `<b lang="sv" dir="ltr">${esc(b.textContent)}</b> = ${esc(meaning(b.dataset.w))}`;
    tip.hidden = false;
    say(b.textContent);
    clearTimeout(tip._t); tip._t = setTimeout(() => { tip.hidden = true; }, 2500);
  });
  $('#toQ').onclick = () => { stopSpeaking(); scrollTo(0, 0); storyQuestions(unitId, story); };
}

function storyQuestions(unitId, story) {
  let i = 0, right = 0;
  main.innerHTML = `
    <div class="session">
      <div class="bar-top"><button class="x" id="quit">✕</button><div class="progress"><div id="prog"></div></div></div>
      <div id="ex"></div>
    </div>`;
  $('#quit').onclick = () => go(`story/${unitId}`);
  const show = () => {
    if (i >= story.questions.length) {
      const score = Math.round((right / story.questions.length) * 100);
      S.finishStory(unitId, score);
      S.addXp(10 + right * 3);
      S.save();
      if (score >= 60) setTimeout(confetti, 150);
      main.innerHTML = `<div class="done-screen"><div class="big-emoji">${score >= 60 ? '📖🎉' : '💪'}</div>
        <h1>${t('done')}</h1><p class="score">${t('score')}: <b>${score}%</b></p>
        <p>🏆 ${t('testReady')}</p>
        <div class="row"><button class="btn" id="again">📖 ${t('readAgain')}</button><button class="btn primary" id="h">${t('continue')}</button></div></div>`;
      $('#again').onclick = () => go(`story/${unitId}`);
      $('#h').onclick = () => go('home');
      return;
    }
    const q = story.questions[i];
    const el = $('#ex');
    el.className = 'ex';
    el.innerHTML = `
      <p class="ex-title" lang="sv" dir="ltr">${esc(q.q)}</p>
      <button class="btn ghost" id="hint">ع ${t('hint')}</button>
      <p class="muted" id="qa" hidden>${esc(q.qa)}</p>
      <div class="options">${shuffle(q.a.map((a, k) => k)).map(k => `<button class="opt" data-k="${k}" lang="sv" dir="ltr">${esc(q.a[k])}</button>`).join('')}</div>
      <button class="btn primary wide" id="nx" hidden>${t('continue')}</button>`;
    say(q.q);
    $('#hint').onclick = () => { $('#qa').hidden = false; };
    el.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const ok = +b.dataset.k === q.c;
      if (ok) right++;
      ok ? ding() : buzz();
      S.log('story_answer', { unit: unitId, q: i, ok });
      el.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (+x.dataset.k === q.c) x.classList.add('right'); });
      if (!ok) b.classList.add('bad');
      $('#prog').style.width = `${Math.round(((i + 1) / story.questions.length) * 100)}%`;
      $('#nx').hidden = false;
      $('#nx').onclick = () => { i++; show(); };
    });
  };
  show();
}

// Mistakes from the last session, practised again as a short lesson.
const practiceUnit = () => {
  const items = S.getState().lastMissed.map(itemBySv).filter(Boolean);
  return items.length ? { id: 'practice', practice: true, words: items, sentences: [] } : null;
};

let audioCtx = null;
function tone(freqs, type = 'sine') {
  try {
    audioCtx ||= new AudioContext();
    freqs.forEach((f, k) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = type; o.frequency.value = f;
      const t0 = audioCtx.currentTime + k * 0.09;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.15, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
      o.connect(g).connect(audioCtx.destination);
      o.start(t0); o.stop(t0 + 0.3);
    });
  } catch {}
}
const ding = () => { tone([660, 880]); navigator.vibrate?.(25); };
const buzz = () => { tone([220], 'triangle'); navigator.vibrate?.([40, 40, 40]); };

function countUp() {
  document.querySelectorAll('.countup').forEach(el => {
    const to = +el.dataset.to; let n = 0;
    const step = () => { n = Math.min(to, n + Math.max(1, Math.ceil(to / 20))); el.textContent = `+${n}`; if (n < to) requestAnimationFrame(step); };
    step();
  });
}

// ---- Life in Sweden ----
const lifeUnit = id => {
  const l = LIFE.find(x => x.id === id);
  return l && { id: l.id, life: true, words: l.words, sentences: [] };
};
// The texts use **bold** and *italic*.
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');

function renderLife() {
  renderChrome();
  const done = LIFE.filter(l => S.lifeProgress(l.id).quizBest != null).length;
  main.innerHTML = `
    <section class="greet" style="--sky:linear-gradient(135deg,#006aa7,#4fa3e0)">
      <span class="sym">🇸🇪</span>
      <div class="hello">${t('lifeTitle')}</div>
      <p class="line">${t('lifeInfo')}</p>
      <p class="line"><b>${frac(done, LIFE.length)}</b> ✓</p>
    </section>
    ${LIFE.map(l => {
      const p = S.lifeProgress(l.id);
      const marks = [p.read ? '📖' : '', p.wordsDone ? '🔤' : '', p.quizBest != null ? `🏆 ${p.quizBest}%` : ''].filter(Boolean).join(' ');
      return `<section class="card tap" data-go="life/${l.id}">
        <div class="unit-emoji">${l.e}</div>
        <div class="grow"><h2>${esc(l.ar)}</h2>${svs(l.sv)}</div>
        <span class="muted">${marks}</span>
      </section>`;
    }).join('')}`;
  main.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
}

function renderTopic(id) {
  const l = LIFE.find(x => x.id === id);
  if (!l) return go('sverige');
  renderChrome();
  const p = S.lifeProgress(id);
  main.innerHTML = `
    <button class="btn ghost back-btn" id="back">→ ${t('back')}</button>
    <section class="topic-head"><div class="emoji">${l.e}</div><h1>${esc(l.ar)}</h1>${svs(l.sv)}</section>
    <section class="card article">${l.text.map(p => `<p>${md(p)}</p>`).join('')}</section>
    <button class="btn ${p.read ? '' : 'primary'} wide" id="read">${t('readDone')}</button>
    <section class="card article">
      <h2>${t('keyWords')}</h2>
      ${l.words.map(w => `<button class="word-row" data-say="${esc(w.sv)}"><span>${w.e || ''}</span>${svs(w.sv)}<span class="muted grow">${esc(w.ar)}</span>🔊</button>`).join('')}
    </section>
    <div class="row">
      <button class="btn" id="words">🔤 ${t('learnWords')}${p.wordsDone ? ' ✓' : ''}</button>
      <button class="btn primary" id="quiz">🏆 ${t('quiz')}${p.quizBest != null ? ` ${p.quizBest}%` : ''}</button>
    </div>`;
  $('#back').onclick = () => go('sverige');
  main.querySelectorAll('[data-say]').forEach(b => b.onclick = () => say(b.dataset.say));
  $('#read').onclick = () => {
    if (!p.read) { S.updateLife(id, { read: true }, { type: 'life_read', data: {} }); S.addXp(5); S.save(); }
    $('#read').classList.remove('primary');
    $('#words').scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  $('#words').onclick = () => go(`lifewords/${id}`);
  $('#quiz').onclick = () => go(`lifequiz/${id}`);
  S.log('life_open', { topic: id });
}

function runQuiz(id) {
  const l = LIFE.find(x => x.id === id);
  if (!l) return go('sverige');
  let i = 0, right = 0;
  main.innerHTML = `
    <div class="session">
      <div class="bar-top"><button class="x" id="quit">✕</button><div class="progress"><div id="prog"></div></div></div>
      <div id="ex"></div>
    </div>`;
  $('#quit').onclick = () => go(`life/${id}`);
  const show = () => {
    $('#prog').style.width = `${Math.round((i / l.quiz.length) * 100)}%`;
    if (i >= l.quiz.length) {
      const score = Math.round((right / l.quiz.length) * 100);
      const p = S.lifeProgress(id);
      S.updateLife(id, { quizBest: Math.max(p.quizBest ?? 0, score), quizTries: p.quizTries + 1 }, { type: 'life_quiz_done', data: { score } });
      S.addXp(right * 3);
      S.save();
      if (score >= 70) setTimeout(confetti, 150);
      main.innerHTML = `<div class="done-screen"><div class="big-emoji">${score === 100 ? '🏆' : score >= 70 ? '🎉' : '💪'}</div>
        <h1>${t('done')}</h1><p class="score">${t('score')}: <b>${score}%</b></p>
        <button class="btn primary wide" id="h">${t('continue')}</button></div>`;
      $('#h').onclick = () => go('sverige');
      return;
    }
    const q = l.quiz[i];
    const el = $('#ex');
    el.className = 'ex';
    el.innerHTML = `
      <p class="ex-title">${esc(q.q)}</p>
      <div class="options">${q.a.map((a, k) => `<button class="opt" data-k="${k}" dir="auto">${esc(a)}</button>`).join('')}</div>
      <p class="explain" hidden></p>
      <button class="btn primary wide" id="nx" hidden>${t('continue')}</button>`;
    el.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const k = +b.dataset.k;
      const ok = k === q.c;
      if (ok) right++;
      ok ? ding() : buzz();
      $('#prog').style.width = `${Math.round(((i + 1) / l.quiz.length) * 100)}%`;
      S.log('life_answer', { topic: id, q: i, ok });
      el.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (+x.dataset.k === q.c) x.classList.add('right'); });
      if (!ok) b.classList.add('bad');
      const ex = el.querySelector('.explain');
      ex.textContent = `${ok ? '✅' : '❌'} ${q.x}`;
      ex.hidden = false;
      $('#nx').hidden = false;
      $('#nx').onclick = () => { i++; show(); };
    });
  };
  show();
}

// ---- Flashcard review ----
function renderReview() {
  renderChrome();
  const due = S.dueWords().map(itemBySv).filter(Boolean);
  if (!due.length) {
    main.innerHTML = `<div class="empty"><div class="big-emoji">🌟</div><p>${t('nothingDue')}</p>
      <button class="btn primary" id="mw">📚 ${t('myWords')}</button></div>`;
    $('#mw').onclick = () => go('mywords');
    return;
  }
  flashcards(shuffle(due).slice(0, 12), 'practice');
}

// Flashcards for any list of items; every answer moves the card's next review date.
function flashcards(cards, backTo) {
  let k = 0, known = 0;
  S.log('review_start', { count: cards.length });
  const show = () => {
    if (k >= cards.length) {
      S.addXp(known);
      S.save();
      S.log('review_done', { count: cards.length, known });
      main.innerHTML = `<div class="done-screen"><div class="big-emoji">🃏</div><h1>${t('done')}</h1>
        <p class="score">${frac(known, cards.length)}</p><button class="btn primary wide" id="h">${t('continue')}</button></div>`;
      if (known >= cards.length * 0.7) setTimeout(confetti, 150);
      $('#h').onclick = () => go(backTo);
      return;
    }
    const c = cards[k];
    main.innerHTML = `
      <p class="muted center">${frac(k + 1, cards.length)}</p>
      <div class="flash" id="card">
        <div class="face front">${c.e ? `<div class="emoji">${c.e}</div>` : ''}${svs(c.sv)}</div>
        <div class="face back"><div class="ar-big">${esc(c.ar)}</div>${svs(c.sv)}</div>
      </div>
      <button class="btn wide" id="flip">${t('flip')}</button>
      <div class="row" id="grade" hidden>
        <button class="btn danger" id="no">${t('didntKnow')}</button>
        <button class="btn primary" id="yes">${t('knew')}</button>
      </div>`;
    say(c.sv);
    const flip = () => { $('#card').classList.add('flipped'); $('#flip').hidden = true; $('#grade').hidden = false; };
    $('#card').onclick = flip;
    $('#flip').onclick = flip;
    $('#yes').onclick = () => { S.recordAnswer(c, 'flashcard', true); known++; k++; S.save(); show(); };
    $('#no').onclick = () => { S.recordAnswer(c, 'flashcard', false); k++; S.save(); show(); };
  };
  show();
}

// ---- Everything learned so far ----
const learnedList = () => Object.entries(S.getState().words)
  .map(([sv, w]) => ({ item: itemBySv(sv), w }))
  .filter(x => x.item && x.w.seen);

// Days until the next review, as a short label.
function dueLabel(w) {
  const days = Math.round((new Date(w.due) - new Date(new Date().toLocaleDateString('sv-SE'))) / 864e5);
  if (days <= 0) return `<span class="tag due">${t('dueToday')}</span>`;
  if (days === 1) return `<span class="tag">${tp('inOneDay')}</span>`;
  // Arabic counts: 2 has its own form, 3-10 take a plural, 11+ a singular.
  const ar = days === 2 ? 'بعد يومين' : days <= 10 ? `بعد <bdi>${days}</bdi> أيام` : `بعد <bdi>${days}</bdi> يوماً`;
  return `<span class="tag">${uiStage() >= 2 ? `om <bdi>${days}</bdi> dagar` : ar}</span>`;
}

let wordFilter = 'all';
function renderMyWords() {
  renderChrome();
  const list = learnedList();
  if (!list.length) {
    main.innerHTML = `<div class="empty"><div class="big-emoji">📚</div><p>${t('learnWordsFirst')}</p></div>`;
    return;
  }
  const mastered = list.filter(x => S.strength(x.w) >= 60).length;
  const due = list.filter(x => x.w.due <= new Date().toLocaleDateString('sv-SE')).length;
  const groups = [...UNITS, ...LIFE, { id: 'mined', e: '⭐', ar: 'جمل حفظتِها من القصص', sv: 'Sparade meningar' }]
    .map(u => ({ u, rows: list.filter(x => x.item.unit === u.id) }))
    .filter(g => g.rows.length);
  main.innerHTML = `
    <section class="topic-head"><div class="emoji">📚</div><h1>${t('myWords')}</h1></section>
    <section class="stat-row">
      <div class="stat"><b><bdi>${list.length}</bdi></b><span>${t('statWords')}</span></div>
      <div class="stat"><b><bdi>${mastered}</bdi></b><span>${t('statMastered')}</span></div>
      <div class="stat"><b><bdi>${due}</bdi></b><span>${t('dueToday')}</span></div>
    </section>
    <details class="card srs-info"><summary>🗓️ ${t('srsTitle')}</summary><p>${t('srsInfo')}</p></details>
    <div class="row fchips">
      ${['all', 'weak', 'strong'].map(f => `<button class="fchip ${wordFilter === f ? 'on' : ''}" data-f="${f}">${t('filter_' + f)}</button>`).join('')}
    </div>
    <input id="wq" class="wsearch" dir="auto" placeholder="${tp('searchWords')}">
    ${groups.map(g => `
      <section class="card word-group" data-unit="${g.u.id}">
        <div class="row-between"><h2>${g.u.e} ${esc(g.u.ar)} <small class="sub" lang="sv" dir="ltr">${esc(g.u.sv)}</small></h2>
          <button class="btn primary btn-sm" data-rev="${g.u.id}">🃏 ${t('review')}</button></div>
        <ul class="word-list">${g.rows.sort((a, b) => S.strength(a.w) - S.strength(b.w)).map(({ item, w }) => {
          const st = S.strength(w);
          const cls = st >= 60 ? 'strong' : st < 30 ? 'weak' : 'mid';
          return `<li class="word-row" data-sv="${esc(item.sv)}" data-cls="${cls}" data-q="${esc((item.sv + ' ' + item.ar).toLowerCase())}">
            <span class="w-emoji">${item.e || '💬'}</span>
            <span class="grow"><b lang="sv" dir="ltr">${esc(item.sv)}</b><br><span class="muted">${esc(item.ar)}</span></span>
            <span class="w-side"><span class="wmeter ${cls}"><span style="width:${Math.max(st, 6)}%"></span></span>${dueLabel(w)}</span>
          </li>`;
        }).join('')}</ul>
      </section>`).join('')}
    <div class="sticky-bottom"><button class="btn primary wide" data-rev="weak">🃏 ${t('reviewThese')}</button></div>`;
  const applyFilter = () => {
    const q = $('#wq').value.trim().toLowerCase();
    main.querySelectorAll('.word-row').forEach(r => {
      const okF = wordFilter === 'all' || (wordFilter === 'weak' ? r.dataset.cls !== 'strong' : r.dataset.cls === 'strong');
      r.hidden = !(okF && (!q || r.dataset.q.includes(q)));
    });
    main.querySelectorAll('.word-group').forEach(g => { g.hidden = !g.querySelector('.word-row:not([hidden])'); });
  };
  main.querySelectorAll('.fchip').forEach(b => b.onclick = () => { wordFilter = b.dataset.f; renderMyWords(); });
  $('#wq').oninput = applyFilter;
  applyFilter();
  main.querySelectorAll('.word-row').forEach(r => r.onclick = () => openWord(itemBySv(r.dataset.sv)));
  main.querySelectorAll('[data-rev]').forEach(b => b.onclick = e => { e.stopPropagation(); go(`reviewset/${b.dataset.rev}`); });
}

// One word up close: hear it, flip it, and say whether she knew it.
function openWord(item) {
  const sheet = document.createElement('div');
  sheet.className = 'sheet-bg';
  sheet.innerHTML = `<div class="sheet">
    <div class="flash" id="one">
      <div class="face front">${item.e ? `<div class="emoji">${item.e}</div>` : ''}${svs(item.sv)}</div>
      <div class="face back"><div class="ar-big">${esc(item.ar)}</div>${svs(item.sv)}${item.n ? `<p class="muted small">${esc(item.n)}</p>` : ''}</div>
    </div>
    <div class="row"><button class="btn" id="s1">🔊</button><button class="btn" id="s2">🐢</button><button class="btn" id="fl">${t('flip')}</button></div>
    <div class="row" id="gr" hidden><button class="btn danger" id="no">${t('didntKnow')}</button><button class="btn primary" id="yes">${t('knew')}</button></div>
    <button class="btn ghost wide" id="cl">${t('back')}</button></div>`;
  document.body.append(sheet);
  const q = sel => sheet.querySelector(sel);
  const close = () => { sheet.remove(); renderMyWords(); };
  const flip = () => { q('#one').classList.add('flipped'); q('#fl').hidden = true; q('#gr').hidden = false; };
  say(item.sv);
  q('#s1').onclick = () => say(item.sv);
  q('#s2').onclick = () => say(item.sv, true);
  q('#one').onclick = flip;
  q('#fl').onclick = flip;
  q('#yes').onclick = () => { S.recordAnswer(item, 'flashcard', true); S.addXp(1); S.save(); ding(); close(); };
  q('#no').onclick = () => { S.recordAnswer(item, 'flashcard', false); S.save(); close(); };
  q('#cl').onclick = () => { sheet.remove(); };
  sheet.onclick = e => { if (e.target === sheet) sheet.remove(); };
}

// Review a chosen set: a unit, the weak words, or everything.
function reviewSet(key) {
  renderChrome();
  let list = learnedList();
  if (key === 'weak') list = list.filter(x => S.strength(x.w) < 60).length ? list.filter(x => S.strength(x.w) < 60) : list;
  else if (key !== 'all') list = list.filter(x => x.item.unit === key);
  if (!list.length) return go('mywords');
  const cards = shuffle(list.sort((a, b) => S.strength(a.w) - S.strength(b.w)).slice(0, 20)).map(x => x.item);
  S.log('review_set', { set: key, count: cards.length });
  flashcards(cards, 'mywords');
}

// ---- Games ----
const learnedItems = () => Object.keys(S.getState().words).map(itemBySv).filter(i => i && i.kind === 'word');

function renderPractice() {
  renderChrome();
  const g = S.getState().games;
  const due = S.dueWords().length;
  const missed = S.getState().lastMissed.length;
  main.innerHTML = `
    <section class="card tap" data-go="review">
      <div class="unit-emoji">🃏</div>
      <div class="grow"><h2>${t('review')}</h2><p><b>${due}</b> ${t('dueNow')}</p></div>
    </section>
    <section class="card tap" data-go="mywords">
      <div class="unit-emoji">📚</div>
      <div class="grow"><h2>${t('myWords')}</h2><p class="muted">${t('myWordsInfo')}</p></div>
    </section>
    ${missed ? `<section class="card tap" data-go="practicewords">
      <div class="unit-emoji">🎯</div>
      <div class="grow"><h2>${t('practiceThese')}</h2><p class="muted">${missed} ${t('words')}</p></div>
    </section>` : ''}
    <section class="card tap" data-go="game/match">
      <div class="unit-emoji">🧩</div>
      <div class="grow"><h2>${t('gameMatch')}</h2><p>${t('gameMatchInfo')}</p>
      <p class="muted">${t('best')}: ${g.match?.best ?? 0}</p></div>
    </section>
    <section class="card tap" data-go="game/listen">
      <div class="unit-emoji">👂</div>
      <div class="grow"><h2>${t('gameListen')}</h2><p>${t('gameListenInfo')}</p>
      <p class="muted">${t('best')}: ${g.listen?.best ?? 0}</p></div>
    </section>`;
  main.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
}

function renderGames() { renderPractice(); }


function gameShell(title) {
  main.innerHTML = `
    <div class="session">
      <div class="bar-top"><button class="x" id="quit">✕</button><b class="grow center">${title}</b><span class="pill" id="clock">⏱️ 0</span></div>
      <div id="board"></div>
    </div>`;
  $('#quit').onclick = () => go('practice');
}

function gameOver(id, score) {
  S.finishGame(id, score);
  S.addXp(Math.round(score / 10));
  S.save();
  main.innerHTML = `<div class="done-screen"><div class="big-emoji">🎮</div><h1>${t('done')}</h1>
    <p class="score">${score}</p><p class="muted">${t('best')}: ${S.getState().games[id].best}</p>
    <div class="row"><button class="btn" id="b">${t('back')}</button><button class="btn primary" id="a">${t('playAgain')}</button></div></div>`;
  $('#a').onclick = () => routes.game(id);
  $('#b').onclick = () => go('practice');
}

function gameMatch() {
  const pool = learnedItems();
  if (pool.length < 5) { renderChrome(); main.innerHTML = `<div class="empty"><p>${t('learnWordsFirst')}</p></div>`; return; }
  gameShell(t('gameMatch'));
  let round = 0, misses = 0;
  const start = Date.now();
  const tick = setInterval(() => { const c = $('#clock'); c ? c.textContent = `⏱️ ${Math.round((Date.now() - start) / 1000)}` : clearInterval(tick); }, 500);
  const play = () => {
    if (round === 3) {
      clearInterval(tick);
      const secs = (Date.now() - start) / 1000;
      return gameOver('match', Math.max(0, Math.round(1000 - secs * 10 - misses * 25)));
    }
    round++;
    $('#board').innerHTML = `<p class="muted center">${frac(round, 3)}</p><div class="match-grid"></div>`;
    matchBoard($('#board .match-grid'), shuffle(pool).slice(0, 5), play, () => misses++);
  };
  play();
}

function gameListen() {
  const pool = learnedItems();
  if (pool.length < 4) { renderChrome(); main.innerHTML = `<div class="empty"><p>${t('learnWordsFirst')}</p></div>`; return; }
  gameShell(t('gameListen'));
  let score = 0, left = 60;
  $('#clock').textContent = '⏱️ 60';
  const tick = setInterval(() => {
    left--;
    const c = $('#clock');
    if (!c) return clearInterval(tick);
    c.textContent = `⏱️ ${left}`;
    if (left <= 0) { clearInterval(tick); gameOver('listen', score); }
  }, 1000);
  const q = () => {
    const opts = shuffle(pool).slice(0, 4);
    const ans = opts[0];
    const shown = shuffle(opts);
    $('#board').innerHTML = `
      <p class="center score">${score}</p>
      <div class="prompt"><button class="btn-audio" id="again">🔊</button></div>
      <div class="options">${shown.map((o, k) => `<button class="opt" data-k="${k}">${svs(o.sv)}</button>`).join('')}</div>`;
    say(ans.sv);
    $('#again').onclick = () => say(ans.sv);
    $('#board').querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const ok = shown[+b.dataset.k] === ans;
      b.classList.add(ok ? 'right' : 'bad');
      if (ok) score += 10;
      S.recordAnswer(ans, 'game_listen', ok, shown[+b.dataset.k].sv);
      ok ? ding() : buzz();
      setTimeout(() => left > 0 && q(), ok ? 250 : 700);
    });
  };
  q();
}

// ---- Me ----
function renderMe() {
  renderChrome();
  const st = S.getState();
  const known = Object.values(st.words).filter(w => S.strength(w) >= 60).length;
  const totalMin = Math.round(Object.values(st.daily).reduce((a, b) => a + b, 0) / 60);
  const passed = UNITS.filter(u => st.units[u.id]?.passed).length;
  const user = currentUser();
  const DAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  const week = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - k));
    const key = d.toLocaleDateString('sv-SE');
    return { on: (st.daily[key] || 0) >= 60, today: k === 6, label: DAYS[d.getDay()] };
  });
  main.innerHTML = `
    <section class="card week">
      <b>${t('thisWeek')}</b>
      <div class="days">${week.map(d => `<div class="day ${d.on ? 'on' : ''} ${d.today ? 'today' : ''}"><span>${d.on ? '🔥' : '·'}</span><small>${d.label}</small></div>`).join('')}</div>
    </section>
    <section class="stats">
      <div class="stat"><b>${Object.keys(st.words).length}</b><span>${t('statWords')}</span></div>
      <div class="stat"><b>${known}</b><span>${t('statMastered')}</span></div>
      <div class="stat"><b>${frac(passed, UNITS.length)}</b><span>${t('statUnits')}</span></div>
      <div class="stat"><b>${totalMin}</b><span>${t('statMinutes')}</span></div>
      <div class="stat"><b>${st.streak.best}</b><span>${t('statBestStreak')}</span></div>
      <div class="stat"><b>${S.level()}</b><span>${t('level')}</span></div>
    </section>
    <section class="card">
      <label>${t('dailyGoal')}</label>
      <div class="row">${[10, 15, 20, 30].map(m => `<button class="btn ${st.dailyGoalMin === m ? 'primary' : ''}" data-m="${m}">${m}</button>`).join('')}</div>
    </section>
    ${user ? `<section class="card muted">
      ☁️ ${esc(user.email)} · ${S.syncStatus === 'error' ? t('offline') : t('synced')}
    </section>` : ''}
    <section class="card muted">📲 ${t('install')}</section>`;
  main.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
    st.dailyGoalMin = +b.dataset.m;
    S.log('goal_set', { minutes: st.dailyGoalMin });
    S.save();
    renderMe();
  });
}

// ---- Login (only when sync is configured) ----
function renderLogin() {
  $('nav').hidden = true;
  $('header').hidden = true;
  main.innerHTML = `
    <form class="card login" id="f">
      <div class="big-emoji">🇸🇪</div>
      <h1>${t('appName')}</h1>
      <label>${t('email')}<input type="email" name="email" required dir="ltr" autocomplete="username"></label>
      <label>${t('password')}<input type="password" name="password" required dir="ltr" autocomplete="current-password"></label>
      <p class="err" id="err"></p>
      <button class="btn primary wide">${t('login')}</button>
    </form>`;
  $('#f').onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await signIn(f.get('email'), f.get('password'));
      await S.pullState().catch(() => {});
      S.log('login', {});
      await S.sync();
      location.hash = '#/home';
      route();
    } catch (err) {
      $('#err').textContent = err.message;
    }
  };
}

// ---- Boot ----
S.startClock();
S.log('app_open', { ua: navigator.userAgent.slice(0, 120) });
route();
S.sync();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
