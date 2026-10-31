// Interface labels. The app starts in Arabic and shifts toward Swedish as Tala passes units.
import { UNITS } from './content.js';
import { getState } from './store.js';

const L = {
  appName: ['تالة تتعلّم السويدية', 'Tala lär sig svenska'],
  home: ['الرئيسية', 'Hem'],
  course: ['الدروس', 'Kursen'],
  review: ['المراجعة', 'Repetition'],
  games: ['الألعاب', 'Spel'],
  me: ['أنا', 'Jag'],
  start: ['ابدئي', 'Börja'],
  continue: ['تابعي', 'Fortsätt'],
  check: ['تحقّقي', 'Kolla'],
  next: ['التالي', 'Nästa'],
  correct: ['صحيح!', 'Rätt!'],
  wrong: ['ليس تماماً', 'Inte riktigt'],
  rightAnswer: ['الإجابة الصحيحة:', 'Rätt svar:'],
  lesson: ['درس', 'Lektion'],
  test: ['اختبار الوحدة', 'Enhetsprov'],
  testInfo: ['15 سؤالاً بدون مساعدة. تحتاجين 80% لفتح الوحدة التالية.', '15 frågor utan hjälp. Du behöver 80 % för nästa enhet.'],
  passed: ['نجحتِ!', 'Godkänd!'],
  notPassed: ['حاولي مرة أخرى', 'Försök igen'],
  streak: ['أيام متتالية', 'dagar i rad'],
  today: ['اليوم', 'Idag'],
  minutes: ['دقيقة', 'min'],
  goal: ['هدف اليوم', 'Dagens mål'],
  level: ['المستوى', 'Nivå'],
  words: ['كلمة', 'ord'],
  dueNow: ['كلمات للمراجعة الآن', 'ord att repetera nu'],
  nothingDue: ['لا توجد مراجعة الآن. أحسنتِ!', 'Inget att repetera nu. Bra jobbat!'],
  flip: ['اقلبي البطاقة', 'Vänd kortet'],
  knew: ['عرفتها', 'Kunde'],
  didntKnow: ['لم أعرفها', 'Kunde inte'],
  listen: ['استمعي', 'Lyssna'],
  slow: ['ببطء', 'Långsamt'],
  speak: ['تكلّمي', 'Prata'],
  cantSpeak: ['لا أستطيع الكلام الآن', 'Kan inte prata nu'],
  heard: ['سمعتُ:', 'Jag hörde:'],
  locked: ['مقفلة', 'Låst'],
  soon: ['قريباً', 'Kommer snart'],
  newWord: ['كلمة جديدة', 'Nytt ord'],
  chooseMeaning: ['ما معنى هذه الكلمة؟', 'Vad betyder det?'],
  chooseSwedish: ['كيف تقولين بالسويدية؟', 'Hur säger man på svenska?'],
  listenChoose: ['ماذا سمعتِ؟', 'Vad hörde du?'],
  build: ['رتّبي الكلمات', 'Bygg meningen'],
  type: ['اكتبي بالسويدية', 'Skriv på svenska'],
  sayIt: ['قولي هذا بصوت عالٍ', 'Säg det högt'],
  match: ['وصّلي الأزواج', 'Para ihop'],
  done: ['انتهى!', 'Klart!'],
  score: ['النتيجة', 'Resultat'],
  back: ['رجوع', 'Tillbaka'],
  quit: ['خروج', 'Avsluta'],
  login: ['تسجيل الدخول', 'Logga in'],
  email: ['البريد الإلكتروني', 'E-post'],
  password: ['كلمة المرور', 'Lösenord'],
  synced: ['تمت المزامنة', 'Synkad'],
  offline: ['بدون إنترنت، سيتم الحفظ لاحقاً', 'Offline, sparas senare'],
  noVoice: ['لا يوجد صوت سويدي على الهاتف. افتحي الإعدادات ← الإدارة العامة ← اللغة ← تحويل النص إلى كلام ← محرك Google ← ثبّتي "Svenska".', 'Ingen svensk röst. Installera svenska i Googles text-till-tal.'],
  gameMatch: ['لعبة الأزواج', 'Para ihop'],
  gameMatchInfo: ['وصّلي الكلمة بمعناها بأسرع ما يمكن', 'Para ihop ord och betydelse så snabbt du kan'],
  gameListen: ['الاستماع السريع', 'Snabblyssning'],
  gameListenInfo: ['60 ثانية: اسمعي واختاري الكلمة الصحيحة', '60 sekunder: lyssna och välj rätt ord'],
  best: ['أفضل نتيجة', 'Bästa'],
  playAgain: ['العبي مرة أخرى', 'Spela igen'],
  learnWordsFirst: ['تعلّمي بعض الكلمات أولاً في الدروس', 'Lär dig några ord i kursen först'],
  tipTitle: ['نصيحة', 'Tips'],
  wordOfDay: ['كلمة اليوم', 'Dagens ord'],
  sverige: ['السويد', 'Sverige'],
  lifeTitle: ['الحياة في السويد', 'Livet i Sverige'],
  lifeInfo: ['كل ما تحتاجين معرفته قبل الانتقال في ديسمبر 2027', 'Allt du behöver veta inför flytten i december 2027'],
  readDone: ['قرأتُ هذا ✓', 'Jag har läst ✓'],
  keyWords: ['كلمات مهمة', 'Viktiga ord'],
  learnWords: ['تعلّمي الكلمات', 'Lär dig orden'],
  quiz: ['اختبار قصير', 'Quiz'],
  nextTopic: ['الموضوع التالي عن السويد', 'Nästa ämne om Sverige'],
  dailyGoal: ['هدفي اليومي (بالدقائق)', 'Mitt dagliga mål (minuter)'],
  install: ['أضيفي التطبيق إلى الشاشة الرئيسية من قائمة Chrome ⋮ ← "إضافة إلى الشاشة الرئيسية"', 'Lägg till på hemskärmen via Chrome-menyn'],
};

// 0 = Arabic only, 1 = Arabic with Swedish under it, 2 = Swedish with Arabic under it, 3 = Swedish only.
export function uiStage() {
  const passed = UNITS.filter(u => getState().units[u.id]?.passed).length;
  if (passed < 3) return 0;
  if (passed < 7) return 1;
  if (passed < 15) return 2;
  return 3;
}

const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// HTML label for the current stage.
export function t(key) {
  const [ar, sv] = L[key];
  switch (uiStage()) {
    case 0: return esc(ar);
    case 1: return `${esc(ar)}<small class="sub" lang="sv" dir="ltr">${esc(sv)}</small>`;
    case 2: return `<span lang="sv" dir="ltr">${esc(sv)}</span><small class="sub">${esc(ar)}</small>`;
    default: return `<span lang="sv" dir="ltr">${esc(sv)}</span>`;
  }
}

// Plain-text label (for attributes), main language only.
export function tp(key) {
  return uiStage() >= 2 ? L[key][1] : L[key][0];
}

export { esc };
