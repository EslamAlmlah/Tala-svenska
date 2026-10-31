// Tala's app: screens and navigation.
import { UNITS, COMING, PHASES, lessonsOf } from './content.js';
import * as S from './store.js';
import { cloudEnabled, currentUser, signIn } from './cloud.js';
import { lessonQueue, testQueue, RENDER, itemBySv, shuffle, matchBoard } from './exercises.js';
import { say, hasSwedishVoice } from './speech.js';
import { t, tp, esc } from './i18n.js';
import { greeting, cheer, wordOfDay, confetti } from './greet.js';
import { LIFE } from './life.js';

const $ = sel => document.querySelector(sel);
const main = $('#main');
const svs = s => `<span class="sv" lang="sv" dir="ltr">${esc(s)}</span>`;

// ---- Router ----
const routes = {
  home: renderHome,
  course: renderCourse,
  lesson: (u, l) => runSession('lesson', UNITS.find(x => x.id === u), +l),
  test: u => runSession('test', UNITS.find(x => x.id === u)),
  review: renderReview,
  games: renderGames,
  game: id => (id === 'match' ? gameMatch() : gameListen()),
  me: renderMe,
  sverige: renderLife,
  life: renderTopic,
  lifewords: id => runSession('lesson', lifeUnit(id), 0),
  lifequiz: runQuiz,
  login: renderLogin,
};

function route() {
  if (cloudEnabled() && !currentUser()) return renderLogin();
  const [name, ...args] = (location.hash.slice(2) || 'home').split('/');
  scrollTo(0, 0);
  (routes[name] || renderHome)(...args);
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.dataset.r === name));
  const inSession = ['lesson', 'test', 'game', 'lifewords', 'lifequiz'].includes(name);
  $('nav').hidden = inSession;
  $('header').hidden = inSession;
}
const go = path => { location.hash = '#/' + path; };
addEventListener('hashchange', route);

function renderChrome() {
  $('nav').innerHTML = [
    ['home', '🏠'], ['course', '🗺️'], ['sverige', '🇸🇪'], ['review', '🃏'], ['games', '🎮'], ['me', '👤'],
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
  const nextLabel = p.lessonsDone >= lessons.length ? t('test') : `${t('lesson')} ${p.lessonsDone + 1}`;
  const g = greeting();
  const [cheerSv, cheerAr] = cheer();
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
        <div><b>${mins}</b><small>/ ${goal} ${t('minutes')}</small></div>
      </div>
      <div>
        <h1>${t('goal')}</h1>
        <p class="muted">🔥 ${st.streak.count} ${t('streak')}</p>
      </div>
    </section>
    <section class="card next">
      <div class="unit-emoji">${unit.e}</div>
      <div class="grow">
        <h2>${esc(unit.ar)}</h2>
        <p>${svs(unit.sv)} · ${nextLabel}</p>
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
    ${hasSwedishVoice() ? '' : `<section class="card warn">${t('noVoice')}</section>`}`;
  $('#cont').onclick = () => go(p.lessonsDone >= lessons.length ? `test/${unit.id}` : `lesson/${unit.id}/${p.lessonsDone}`);
  $('#rev').onclick = () => go('review');
  $('#sayHi').onclick = () => say(g.svText);
  $('#wod').onclick = () => say(wod.sv);
  if (nextLife) $('#life').onclick = () => go(`life/${nextLife.id}`);
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
      html += `
        <div class="unit ${open ? '' : 'locked'} ${p.passed ? 'passed' : ''}">
          <div class="unit-head">
            <span class="unit-emoji">${open ? u.e : '🔒'}</span>
            <div class="grow"><h3>${esc(u.ar)}</h3>${svs(u.sv)}</div>
            ${p.passed ? `<span class="crown">👑 ${p.testBest}%</span>` : ''}
          </div>
          ${open ? `<div class="lessons">
            ${ls.map((l, k) => `<button class="dot ${k < p.lessonsDone ? 'done' : ''}" data-go="lesson/${u.id}/${k}"
              ${k > p.lessonsDone ? 'disabled' : ''}>${k < p.lessonsDone ? '✓' : k + 1}</button>`).join('')}
            <button class="dot test ${p.passed ? 'done' : ''}" data-go="test/${u.id}" ${p.lessonsDone < ls.length ? 'disabled' : ''}>🏆</button>
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
  if (!unit) return go('course');
  const queue = kind === 'lesson' ? lessonQueue(unit, lessonIndex) : testQueue(unit);
  const graded = new Set();
  let firstTry = 0, gradedCount = 0, i = 0;
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
        S.recordAnswer(ex.item, ex.type, ok, given);
      }
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
        <b>${ok ? '✅ ' + t('correct') : '❌ ' + t('wrong')}</b>
        ${!ok || opts.typo ? `<p>${t('rightAnswer')} ${svs(item.sv)}</p>` : ''}
        <p class="muted">${esc(item.ar)}</p>
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
    if (unit.life) {
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
    if (passed && score >= 70) setTimeout(confetti, 150);
    main.innerHTML = `
      <div class="done-screen">
        <div class="big-emoji">${passed ? (score >= 90 ? '🏆' : '🎉') : '💪'}</div>
        <h1>${kind === 'test' ? (passed ? t('passed') : t('notPassed')) : t('done')}</h1>
        <p class="score">${t('score')}: <b>${score}%</b></p>
        <p class="muted">${firstTry} / ${gradedCount} · ⏱️ ${Math.max(1, Math.round(secs / 60))} ${t('minutes')}</p>
        <button class="btn primary wide" id="home">${t('continue')}</button>
      </div>`;
    $('#home').onclick = () => go(unit.life ? `life/${unit.id}` : 'course');
  };

  next();
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
      <p class="line"><b>${done} / ${LIFE.length}</b> ✓</p>
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
    <button class="btn ghost back" id="back">→ ${t('back')}</button>
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
      <div class="options">${q.a.map((a, k) => `<button class="opt" data-k="${k}">${esc(a)}</button>`).join('')}</div>
      <p class="explain" hidden></p>
      <button class="btn primary wide" id="nx" hidden>${t('continue')}</button>`;
    el.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const k = +b.dataset.k;
      const ok = k === q.c;
      if (ok) right++;
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
    main.innerHTML = `<div class="empty"><div class="big-emoji">🌟</div><p>${t('nothingDue')}</p></div>`;
    return;
  }
  const cards = shuffle(due).slice(0, 20);
  let k = 0, known = 0;
  S.log('review_start', { count: cards.length });
  const show = () => {
    if (k >= cards.length) {
      S.addXp(known);
      S.save();
      S.log('review_done', { count: cards.length, known });
      main.innerHTML = `<div class="done-screen"><div class="big-emoji">🃏</div><h1>${t('done')}</h1>
        <p class="score">${known} / ${cards.length}</p><button class="btn primary wide" id="h">${t('continue')}</button></div>`;
      $('#h').onclick = () => go('home');
      return;
    }
    const c = cards[k];
    main.innerHTML = `
      <p class="muted center">${k + 1} / ${cards.length}</p>
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

// ---- Games ----
const learnedItems = () => Object.keys(S.getState().words).map(itemBySv).filter(i => i && i.kind === 'word');

function renderGames() {
  renderChrome();
  const g = S.getState().games;
  main.innerHTML = `
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

function gameShell(title) {
  main.innerHTML = `
    <div class="session">
      <div class="bar-top"><button class="x" id="quit">✕</button><b class="grow center">${title}</b><span class="pill" id="clock"></span></div>
      <div id="board"></div>
    </div>`;
  $('#quit').onclick = () => go('games');
}

function gameOver(id, score) {
  S.finishGame(id, score);
  S.addXp(Math.round(score / 10));
  S.save();
  main.innerHTML = `<div class="done-screen"><div class="big-emoji">🎮</div><h1>${t('done')}</h1>
    <p class="score">${score}</p><p class="muted">${t('best')}: ${S.getState().games[id].best}</p>
    <div class="row"><button class="btn" id="b">${t('back')}</button><button class="btn primary" id="a">${t('playAgain')}</button></div></div>`;
  $('#a').onclick = () => routes.game(id);
  $('#b').onclick = () => go('games');
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
    $('#board').innerHTML = `<p class="muted center">${round} / 3</p><div class="match-grid"></div>`;
    matchBoard($('#board .match-grid'), shuffle(pool).slice(0, 5), play, () => misses++);
  };
  play();
}

function gameListen() {
  const pool = learnedItems();
  if (pool.length < 4) { renderChrome(); main.innerHTML = `<div class="empty"><p>${t('learnWordsFirst')}</p></div>`; return; }
  gameShell(t('gameListen'));
  let score = 0, left = 60;
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
  main.innerHTML = `
    <section class="stats">
      <div class="stat"><b>${Object.keys(st.words).length}</b><span>${t('words')}</span></div>
      <div class="stat"><b>${known}</b><span>✓ ${t('words')}</span></div>
      <div class="stat"><b>${passed}/${UNITS.length}</b><span>👑</span></div>
      <div class="stat"><b>${totalMin}</b><span>${t('minutes')}</span></div>
      <div class="stat"><b>${st.streak.best}</b><span>🔥 max</span></div>
      <div class="stat"><b>${S.level()}</b><span>${t('level')}</span></div>
    </section>
    <section class="card">
      <label>${t('dailyGoal')}</label>
      <div class="row">${[15, 30, 45, 60].map(m => `<button class="btn ${st.dailyGoalMin === m ? 'primary' : ''}" data-m="${m}">${m}</button>`).join('')}</div>
    </section>
    <section class="card muted">
      ${user ? `☁️ ${esc(user.email)} · ${S.syncStatus === 'error' ? t('offline') : t('synced')}` : '📱 local'}
    </section>
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
