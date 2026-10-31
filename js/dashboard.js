// Eslam's page: exactly where Tala is in the course and how it is going.
import { UNITS, lessonsOf, allItems } from './content.js';
import { LIFE } from './life.js';
import { STORIES } from './stories.js';
import { cloudEnabled, currentUser, signIn, signOut, rest, useSessionKey } from './cloud.js';

// Separate login from the learner app, so Eslam's account never becomes the app's account on a shared phone.
useSessionKey('ts_session_viewer');

// Same formula as store.js (7 = number of Leitner boxes - 1).
const strength = w => (!w || !w.seen ? 0 : Math.round(100 * (0.7 * (w.box / 7) + 0.3 * (w.ok / w.seen))));

const main = document.getElementById('main');
let learnerId = null;
const tip = document.getElementById('tip');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ITEMS = new Map(allItems().map(i => [i.sv, i]));
const UNIT_NAME = Object.fromEntries([...UNITS, ...LIFE].map(u => [u.id, u.sv]));

const EX_NAMES = {
  chooseMeaning: 'Välj betydelse', chooseSwedish: 'Välj svenska ordet', listenChoose: 'Lyssna och välj',
  type: 'Skriva', build: 'Bygga meningar', speak: 'Uttal (prata)', flashcard: 'Flashcards', game_listen: 'Spel: lyssning',
};

function fmtTime(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });
}
function ago(iso) {
  if (!iso) return 'aldrig';
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 2) return 'just nu';
  if (m < 60) return `${m} min sedan`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} tim sedan`;
  return `${Math.round(h / 24)} dagar sedan`;
}

// ---- Data loading ----
async function loadCloud() {
  const v = await rest('viewers?select=learner_id');
  const id = v?.[0]?.learner_id;
  if (!id) throw new Error('Ditt konto är inte kopplat till Tala ännu. Kör sista raden i SQL-filen (insert into public.viewers…).');
  learnerId = id;
  const [st] = await rest(`learner_state?user_id=eq.${id}&select=state,updated_at`);
  const events = await rest(`events?user_id=eq.${id}&select=client_ts,type,data&order=client_ts.desc&limit=3000`);
  return { state: st?.state, syncedAt: st?.updated_at, events: events || [] };
}

function loadLocal() {
  // Same-device preview (?local): reads the app's own storage.
  const state = JSON.parse(localStorage.getItem('ts_state') || 'null');
  const events = JSON.parse(localStorage.getItem('ts_queue') || '[]').reverse();
  return { state, syncedAt: state?.updatedAt, events };
}

// ---- Rendering ----
function render({ state, syncedAt, events }) {
  if (!state) {
    main.innerHTML = `<h1>Talas framsteg</h1><p class="card">Tala har inte öppnat appen ännu, eller så har inget synkats än.</p>`;
    return;
  }
  const lastEvent = events[0]?.client_ts;
  const days = state.daily || {};
  const todayKey = new Date().toLocaleDateString('sv-SE');
  const totalMin = Math.round(Object.values(days).reduce((a, b) => a + b, 0) / 60);
  const words = Object.entries(state.words || {});
  const secure = words.filter(([, w]) => strength(w) >= 60).length;
  const tests = state.tests || [];
  const avgTest = tests.length ? Math.round(tests.reduce((a, t) => a + t.score, 0) / tests.length) : null;

  // Course position
  const totalSteps = UNITS.reduce((a, u) => a + lessonsOf(u).length + 1, 0);
  const doneSteps = UNITS.reduce((a, u) => {
    const p = state.units?.[u.id];
    return a + (p ? Math.min(p.lessonsDone, lessonsOf(u).length) + (p.passed ? 1 : 0) : 0);
  }, 0);
  const coursePct = Math.round((doneSteps / totalSteps) * 100);
  const posUnit = UNITS.find(u => u.id === state.position?.unit) || UNITS[0];
  const posIdx = UNITS.indexOf(posUnit);
  const posLessons = lessonsOf(posUnit).length;
  const posLesson = state.position?.lesson ?? 0;
  const posText = posLesson >= posLessons
    ? `Ska göra enhetsprovet`
    : `Lektion ${posLesson + 1} av ${posLessons}`;

  // Accuracy per exercise type from the answer log
  const answers = events.filter(e => e.type === 'answer');
  const byType = {};
  for (const a of answers) {
    const k = a.data?.ex || 'annat';
    byType[k] ||= { ok: 0, n: 0 };
    byType[k].n++;
    if (a.data?.ok) byType[k].ok++;
  }

  const hardest = words
    .filter(([, w]) => w.seen >= 2)
    .sort((a, b) => (b[1].bad / b[1].seen) - (a[1].bad / a[1].seen) || strength(a[1]) - strength(b[1]))
    .slice(0, 10);

  main.innerHTML = `
    <header class="top">
      <div>
        <h1>Talas framsteg</h1>
        <p class="muted">Senast aktiv: <b>${ago(lastEvent)}</b> (${fmtTime(lastEvent)}) · Synkad ${fmtTime(syncedAt)}</p>
      </div>
      <button class="btn" id="out">Logga ut</button>
    </header>

    ${learnerId ? `<section class="card note">
      <h2>💌 Skicka ett meddelande till Tala</h2>
      <p class="muted small">Visas överst på hennes startsida. Skriv gärna på enkel svenska, eller på arabiska.</p>
      <form id="noteForm" class="row-between"><input id="noteText" maxlength="500" class="search grow" dir="auto" placeholder="Bra jobbat idag! 💜"><button class="btn primary">Skicka</button></form>
      <p class="muted small" id="noteMsg"></p>
    </section>` : ''}

    <section class="card where">
      <div class="where-emoji">${posUnit.e}</div>
      <div class="grow">
        <p class="muted">Här är hon nu</p>
        <h2>Enhet ${posIdx}: ${esc(posUnit.sv)} <span class="muted">(${esc(posUnit.ar)})</span></h2>
        <p>${posText} · Fas ${posUnit.phase}</p>
        <div class="meter" title="${coursePct}%"><div style="width:${coursePct}%"></div></div>
        <p class="muted small">${doneSteps} av ${totalSteps} steg i den kurs som finns hittills (${coursePct} %)</p>
      </div>
    </section>

    <section class="tiles">
      ${tile('🔥', state.streak?.count ?? 0, 'dagar i rad', `bästa: ${state.streak?.best ?? 0}`)}
      ${tile('⏱️', Math.round((days[todayKey] || 0) / 60), 'min idag', `mål: ${state.dailyGoalMin} min`)}
      ${tile('📚', totalMin, 'min totalt', '')}
      ${tile('🔤', words.length, 'ord övade', `${secure} sitter säkert`)}
      ${tile('🏆', avgTest ?? '–', 'snitt på prov', `${tests.length} prov gjorda`)}
      ${tile('⭐', state.xp, 'XP', `nivå ${1 + Math.floor(Math.sqrt(state.xp / 50))}`)}
    </section>

    <section class="card">
      <h2>Tid per dag, senaste 30 dagarna</h2>
      ${timeChart(days, state.dailyGoalMin)}
    </section>

    <section class="card">
      <h2>Enheter</h2>
      <div class="scroll"><table>
        <thead><tr><th>Enhet</th><th>Lektioner</th><th>Bästa prov</th><th>Försök</th><th>Status</th></tr></thead>
        <tbody>${UNITS.map((u, i) => {
          const p = state.units?.[u.id] || { lessonsDone: 0, testTries: 0 };
          const n = lessonsOf(u).length;
          const status = p.passed ? '<span class="tag good">Godkänd</span>'
            : p.lessonsDone || p.testTries ? '<span class="tag now">Pågår</span>'
            : '<span class="tag">Ej börjad</span>';
          return `<tr ${u.id === posUnit.id ? 'class="here"' : ''}><td>${u.e} ${i}. ${esc(u.sv)}</td>
            <td>${Math.min(p.lessonsDone, n)} / ${n}</td><td>${p.testBest != null ? p.testBest + ' %' : '–'}</td>
            <td>${p.testTries || 0}</td><td>${status}</td></tr>`;
        }).join('')}</tbody>
      </table></div>
    </section>

    <section class="card">
      <h2>Livet i Sverige (${LIFE.filter(l => state.life?.[l.id]?.quizBest != null).length} av ${LIFE.length} klara)</h2>
      <div class="scroll"><table>
        <thead><tr><th>Ämne</th><th>Läst</th><th>Ord övade</th><th>Bästa quiz</th><th>Försök</th></tr></thead>
        <tbody>${LIFE.map(l => {
          const p = state.life?.[l.id] || {};
          return `<tr><td>${l.e} ${esc(l.sv)}</td><td>${p.read ? '✅' : '–'}</td><td>${p.wordsDone ? '✅' : '–'}</td>
            <td>${p.quizBest != null ? p.quizBest + ' %' : '–'}</td><td>${p.quizTries || 0}</td></tr>`;
        }).join('')}</tbody>
      </table></div>
    </section>

    <section class="card">
      <h2>Berättelser och dialoger (${Object.keys(STORIES).filter(id => state.stories?.[id]?.done).length} av ${Object.keys(STORIES).length} klara)</h2>
      <div class="scroll"><table>
        <thead><tr><th>Enhet</th><th>Berättelse</th><th>Bästa resultat</th><th>Försök</th><th>Lyssnat</th></tr></thead>
        <tbody>${Object.entries(STORIES).map(([id, st]) => {
          const p = state.stories?.[id] || {};
          const heard = events.filter(e => e.type === 'story_listened' && e.data?.unit === id).length;
          return `<tr><td>${esc(UNIT_NAME[id] || id)}</td><td>${st.e} ${esc(st.sv)}</td><td>${p.best != null ? p.best + ' %' : '–'}</td><td>${p.tries || 0}</td><td>${heard}×</td></tr>`;
        }).join('')}</tbody>
      </table></div>
      ${Object.keys(state.mined || {}).length ? `<p class="muted small">Meningar hon sparat som flashcards: ${Object.keys(state.mined).map(esc).join(' · ')}</p>` : ''}
    </section>

    <section class="grid2">
      <div class="card">
        <h2>Träffsäkerhet per övning</h2>
        ${Object.keys(byType).length ? `<table class="bars">${Object.entries(byType).sort((a, b) => b[1].n - a[1].n).map(([k, v]) => {
          const pct = Math.round((v.ok / v.n) * 100);
          return `<tr><td>${esc(EX_NAMES[k] || k)}</td><td class="barcell"><div class="hbar" style="width:${pct}%"></div></td><td class="num">${pct} %</td><td class="num muted">${v.n} svar</td></tr>`;
        }).join('')}</table>` : '<p class="muted">Inga svar ännu.</p>'}
      </div>
      <div class="card">
        <h2>Svåraste orden</h2>
        ${hardest.length ? `<table>${hardest.map(([sv, w]) => `<tr><td><b>${esc(sv)}</b></td><td class="muted" dir="rtl">${esc(ITEMS.get(sv)?.ar)}</td><td class="num">${w.bad} fel av ${w.seen}</td></tr>`).join('')}</table>` : '<p class="muted">Inget ännu.</p>'}
      </div>
    </section>

    <section class="card">
      <div class="row-between"><h2>Alla ord (${words.length})</h2><input id="q" placeholder="Sök ord…" class="search"></div>
      <div class="scroll"><table id="words">
        <thead><tr><th>Svenska</th><th>Arabiska</th><th>Enhet</th><th>Styrka</th><th>Rätt</th><th>Fel</th><th>Nästa repetition</th><th>Senast</th></tr></thead>
        <tbody>${words.sort((a, b) => strength(b[1]) - strength(a[1])).map(([sv, w]) => {
          const s = strength(w);
          return `<tr data-q="${esc((sv + ' ' + (ITEMS.get(sv)?.ar || '')).toLowerCase())}"><td><b>${esc(sv)}</b></td>
            <td dir="rtl">${esc(ITEMS.get(sv)?.ar)}</td><td>${esc(UNIT_NAME[ITEMS.get(sv)?.unit] || '')}</td>
            <td class="barcell"><div class="hbar ${s >= 60 ? 'ok' : s < 30 ? 'low' : ''}" style="width:${s}%"></div><span class="small">${s}</span></td>
            <td class="num">${w.ok}</td><td class="num">${w.bad}</td><td>${w.due || '–'}</td><td>${fmtTime(w.last)}</td></tr>`;
        }).join('')}</tbody>
      </table></div>
    </section>

    <section class="grid2">
      <div class="card">
        <h2>Provhistorik</h2>
        ${tests.length ? `<table>${[...tests].reverse().map(t => `<tr><td>${fmtTime(t.at)}</td><td>${esc(UNIT_NAME[t.unit])}</td><td class="num"><b>${t.score} %</b></td><td>${t.passed ? '<span class="tag good">Godkänd</span>' : '<span class="tag bad">Ej godkänd</span>'}</td></tr>`).join('')}</table>` : '<p class="muted">Inga prov ännu.</p>'}
      </div>
      <div class="card">
        <h2>Aktivitetslogg</h2>
        <ul class="log">${events.filter(e => e.type !== 'answer' && e.type !== 'life_answer').slice(0, 80).map(e => `<li><span class="muted">${fmtTime(e.client_ts)}</span> ${describe(e)}</li>`).join('') || '<li class="muted">Inget ännu.</li>'}</ul>
      </div>
    </section>

    <section class="card">
      <h2>Senaste svaren</h2>
      <div class="scroll"><table>
        <thead><tr><th>Tid</th><th>Ord</th><th>Övning</th><th>Svar</th><th></th></tr></thead>
        <tbody>${answers.slice(0, 60).map(a => `<tr><td>${fmtTime(a.client_ts)}</td><td><b>${esc(a.data?.sv)}</b></td>
          <td>${esc(EX_NAMES[a.data?.ex] || a.data?.ex)}</td><td>${esc(a.data?.given ?? '')}</td>
          <td>${a.data?.ok ? '✅' : '❌'}</td></tr>`).join('')}</tbody>
      </table></div>
    </section>`;

  document.getElementById('out').onclick = () => { signOut(); location.reload(); };
  const nf = document.getElementById('noteForm');
  if (nf) nf.onsubmit = async e => {
    e.preventDefault();
    const text = document.getElementById('noteText').value.trim();
    if (!text) return;
    try {
      await rest('notes', { method: 'POST', body: { learner_id: learnerId, text } });
      document.getElementById('noteText').value = '';
      document.getElementById('noteMsg').textContent = 'Skickat ✓';
    } catch (err) { document.getElementById('noteMsg').textContent = err.message; }
  };
  document.getElementById('q').oninput = e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#words tbody tr').forEach(tr => { tr.hidden = q && !tr.dataset.q.includes(q); });
  };
  wireChartHover();
}

const tile = (icon, value, label, sub) => `
  <div class="tile"><span class="ti">${icon}</span><b>${esc(value)}</b><span>${esc(label)}</span>${sub ? `<small class="muted">${esc(sub)}</small>` : ''}</div>`;

function describe(e) {
  const d = e.data || {};
  const u = esc(UNIT_NAME[d.unit || d.topic] || d.unit || d.topic || '');
  switch (e.type) {
    case 'app_open': return 'Öppnade appen';
    case 'login': return 'Loggade in';
    case 'lesson_start': return `Började lektion ${d.lesson + 1} i <b>${u}</b>`;
    case 'lesson_done': return `Klarade lektion ${d.lesson + 1} i <b>${u}</b>: ${d.score} % rätt direkt, ${Math.round(d.secs / 60)} min`;
    case 'test_start': return `Började provet i <b>${u}</b>`;
    case 'test_done': return `Prov <b>${u}</b>: ${d.score} % ${d.passed ? '✅ godkänd' : '❌ ej godkänd'}`;
    case 'review_start': return `Började repetera ${d.count} flashcards`;
    case 'review_done': return `Repeterade ${d.count} flashcards, kunde ${d.known}`;
    case 'game_done': return `Spelade ${d.game === 'match' ? 'Para ihop' : 'Snabblyssning'}: ${d.score} poäng`;
    case 'quit': return `Avbröt ${d.kind === 'test' ? 'provet' : 'lektionen'} i <b>${u}</b>`;
    case 'life_open': return `Öppnade Livet i Sverige: <b>${u}</b>`;
    case 'life_read': return `Läste klart <b>${u}</b>`;
    case 'life_words_done': return `Övade orden i <b>${u}</b>: ${d.score} %`;
    case 'life_quiz_done': return `Quiz <b>${u}</b>: ${d.score} %`;
    case 'life_answer': return `Quizfråga ${d.q + 1} i <b>${UNIT_NAME[d.topic] || ''}</b>: ${d.ok ? '✅' : '❌'}`;
    case 'story_open': return `Öppnade berättelsen i <b>${u}</b>`;
    case 'story_listened': return `Lyssnade på berättelsen i <b>${u}</b>${d.slow ? ' (långsamt)' : ''}`;
    case 'story_done': return `Berättelse <b>${u}</b>: ${d.score} % rätt på frågorna`;
    case 'story_answer': return `Fråga ${d.q + 1} om berättelsen i <b>${u}</b>: ${d.ok ? '✅' : '❌'}`;
    case 'sentence_saved': return `Sparade meningen <b lang="sv">${esc(d.sv || '')}</b> som flashcard ⭐`;
    case 'goal_set': return `Satte dagligt mål till ${d.minutes} min`;
    default: return esc(e.type);
  }
}

// Single-series bar chart: minutes per day, with the daily goal as a reference line.
function timeChart(days, goal) {
  const W = 640, H = 200, pad = { l: 34, r: 8, t: 12, b: 24 };
  const list = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('sv-SE');
    list.push({ key, min: Math.round((days[key] || 0) / 60) });
  }
  const max = Math.max(goal, ...list.map(d => d.min), 10);
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const bw = iw / list.length;
  const y = v => pad.t + ih - (v / max) * ih;
  const ticks = [0, Math.round(max / 2), max];
  return `
    <svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Minuter per dag">
      ${ticks.map(t => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}" class="grid"/>
        <text x="${pad.l - 6}" y="${y(t) + 4}" class="axis" text-anchor="end">${t}</text>`).join('')}
      ${list.map((d, i) => {
        const h = Math.max(0, ih - (y(d.min) - pad.t));
        const x = pad.l + i * bw + 1;
        return `<g class="bar" data-tip="${d.key}: ${d.min} min">
          <rect x="${pad.l + i * bw}" y="${pad.t}" width="${bw}" height="${ih}" class="hit"/>
          ${d.min ? `<path d="${roundTop(x, y(d.min), bw - 2, h)}" class="mark"/>` : ''}</g>`;
      }).join('')}
      <line x1="${pad.l}" x2="${W - pad.r}" y1="${y(goal)}" y2="${y(goal)}" class="goal"/>
      <text x="${W - pad.r}" y="${y(goal) - 4}" class="axis" text-anchor="end">mål ${goal} min</text>
      ${list.filter((_, i) => (29 - i) % 7 === 0).map(d => {
        const i = list.indexOf(d);
        return `<text x="${pad.l + i * bw + bw / 2}" y="${H - 6}" class="axis" text-anchor="middle">${d.key.slice(5)}</text>`;
      }).join('')}
    </svg>`;
}

function roundTop(x, y, w, h) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

function wireChartHover() {
  document.querySelectorAll('.bar').forEach(g => {
    g.onpointerenter = g.onpointermove = e => {
      tip.textContent = g.dataset.tip;
      tip.hidden = false;
      tip.style.left = `${e.clientX + 12}px`;
      tip.style.top = `${e.clientY - 30}px`;
      g.classList.add('on');
    };
    g.onpointerleave = () => { tip.hidden = true; g.classList.remove('on'); };
  });
}

function renderLogin(msg = '') {
  main.innerHTML = `
    <form class="card login" id="f">
      <h1>Talas framsteg</h1>
      <p class="muted">Logga in med ditt eget konto (inte Talas).</p>
      <label>E-post<input type="email" name="email" required autocomplete="username"></label>
      <label>Lösenord<input type="password" name="password" required autocomplete="current-password"></label>
      <p class="err">${esc(msg)}</p>
      <button class="btn primary">Logga in</button>
    </form>`;
  document.getElementById('f').onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    try { await signIn(f.get('email'), f.get('password')); start(); } catch (err) { renderLogin(err.message); }
  };
}

async function start() {
  if (new URLSearchParams(location.search).has('local') || !cloudEnabled()) return render(loadLocal());
  if (!currentUser()) return renderLogin();
  try {
    render(await loadCloud());
  } catch (err) {
    main.innerHTML = `<div class="card"><p class="err">${esc(err.message)}</p><button class="btn" id="out">Logga ut</button></div>`;
    document.getElementById('out').onclick = () => { signOut(); location.reload(); };
  }
}

start();
setInterval(() => { if (currentUser() && document.visibilityState === 'visible' && !document.getElementById('q')?.value && !document.getElementById('noteText')?.value) start(); }, 120_000);
