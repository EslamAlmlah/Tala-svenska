// Interface labels. The app starts in Arabic and shifts toward Swedish as Tala passes units.
import { UNITS } from './content.js';
import { getState } from './store.js';

const L = {
  appName: ['تالة تتعلّم السويدية', 'Tala lär sig svenska'],
  home: ['الرئيسية', 'Hem'],
  course: ['الدروس', 'Kurs'],
  review: ['المراجعة', 'Repetition'],
  games: ['الألعاب', 'Spel'],
  me: ['حسابي', 'Profil'],
  start: ['ابدئي', 'Börja'],
  continue: ['تابعي', 'Fortsätt'],
  check: ['تحقّقي', 'Rätta'],
  next: ['التالي', 'Nästa'],
  correct: ['صحيح!', 'Rätt!'],
  wrong: ['ليس تماماً', 'Inte riktigt'],
  rightAnswer: ['الإجابة الصحيحة:', 'Rätt svar:'],
  lesson: ['درس', 'Lektion'],
  test: ['اختبار الوحدة', 'Slutprov'],
  testInfo: ['15 سؤالاً بدون مساعدة. تحتاجين إلى 80% لفتح الوحدة التالية.', '15 frågor utan hjälp. Du behöver 80 % rätt för att låsa upp nästa avsnitt.'],
  passed: ['نجحتِ!', 'Godkänd!'],
  notPassed: ['حاولي مرة أخرى', 'Försök igen'],
  streak: ['الأيام المتتالية', 'Dagar i rad'],
  today: ['اليوم', 'Idag'],
  minutes: ['دقيقة', 'min'],
  goal: ['هدف اليوم', 'Dagens mål'],
  level: ['المستوى', 'Nivå'],
  words: ['كلمة', 'ord'],
  dueNow: ['كلمات للمراجعة الآن', 'ord att repetera nu'],
  nothingDue: ['لا يوجد ما تراجعينه الآن. أحسنتِ!', 'Inget att repetera nu. Bra jobbat!'],
  flip: ['اقلبي البطاقة', 'Vänd kortet'],
  knew: ['عرفتها', 'Jag kunde den'],
  didntKnow: ['لم أعرفها', 'Jag kunde inte'],
  listen: ['استمعي', 'Lyssna'],
  slow: ['ببطء', 'Långsamt'],
  speak: ['تكلّمي', 'Prata'],
  cantSpeak: ['لا أستطيع الكلام الآن', 'Kan inte prata nu'],
  heard: ['سمعتُ:', 'Jag hörde:'],
  locked: ['مقفلة', 'Låst'],
  soon: ['قريباً', 'Kommer snart'],
  newWord: ['كلمة جديدة', 'Nytt ord'],
  chooseMeaning: ['ما معنى هذه الكلمة؟', 'Vad betyder det?'],
  chooseSwedish: ['كيف تقولين هذا بالسويدية؟', 'Hur säger man på svenska?'],
  listenChoose: ['ماذا سمعتِ؟', 'Vad hörde du?'],
  build: ['رتّبي الكلمات', 'Bygg meningen'],
  type: ['اكتبي بالسويدية', 'Skriv på svenska'],
  sayIt: ['قولي هذا بصوت عالٍ', 'Säg det högt'],
  match: ['صِلي كل كلمة بمعناها', 'Para ihop'],
  done: ['انتهيتِ!', 'Klart!'],
  score: ['النتيجة', 'Resultat'],
  back: ['رجوع', 'Tillbaka'],
  quit: ['خروج', 'Avsluta'],
  login: ['تسجيل الدخول', 'Logga in'],
  email: ['البريد الإلكتروني', 'E-post'],
  password: ['كلمة المرور', 'Lösenord'],
  synced: ['تمّت المزامنة', 'Synkat'],
  offline: ['لا يوجد اتصال بالإنترنت، سيُحفظ تقدّمك لاحقاً', 'Offline, sparas senare'],
  noVoice: ['لا يوجد صوت سويدي على الهاتف. افتحي الإعدادات ← الإدارة العامة ← اللغة ← تحويل النص إلى كلام ← محرّك Google ← ثبّتي "السويدية" (Svenska).', 'Ingen svensk röst hittades. Installera svenska under Inställningar → Text till tal.'],
  gameMatch: ['لعبة التوصيل', 'Para ihop'],
  gameMatchInfo: ['وصّلي الكلمة بمعناها بأسرع ما يمكن', 'Para ihop orden med rätt betydelse så snabbt du kan'],
  gameListen: ['الاستماع السريع', 'Snabblyssning'],
  gameListenInfo: ['60 ثانية: اسمعي واختاري الكلمة الصحيحة', '60 sekunder: lyssna och välj rätt ord'],
  best: ['أفضل نتيجة', 'Rekord'],
  playAgain: ['العبي مرة أخرى', 'Spela igen'],
  learnWordsFirst: ['تعلّمي بعض الكلمات أولاً في الدروس', 'Lär dig några ord i kursen först'],
  tipTitle: ['نصيحة', 'Tips'],
  wordOfDay: ['كلمة اليوم', 'Dagens ord'],
  sverige: ['السويد', 'Sverige'],
  practice: ['تمرين', 'Öva'],
  story: ['قصة', 'Berättelse'],
  listenAll: ['استمعي للقصة', 'Lyssna på allt'],
  storyHelp: ['اضغطي على كلمة لمعرفة معناها. ⭐ تحفظ الجملة في بطاقاتك.', 'Tryck på ett ord för att se vad det betyder. ⭐ sparar meningen.'],
  storyQuestions: ['أجيبي عن الأسئلة', 'Svara på frågorna'],
  storyReady: ['أنهيتِ الدروس! القصة جاهزة.', 'Alla lektioner klara! Berättelsen väntar.'],
  readAgain: ['اقرئي مرة أخرى', 'Läs igen'],
  hint: ['تلميح بالعربية', 'Ledtråd på arabiska'],
  hide: ['إخفاء', 'Dölj'],
  fromEslam: ['رسالة من إسلام', 'Meddelande från Eslam'],
  lessonsWord: ['الدروس', 'Lektioner'],
  unlocksAfter: ['تُفتح بعد:', 'Öppnas efter:'],
  inARow: ['متتالية', 'i rad'],
  kind: ['لا بأس، الخطأ جزء من التعلّم 💜', 'Ingen fara, misstag hör till 💜'],
  lessonsLeft: ['الدروس المتبقية في هذه الوحدة:', 'Lektioner kvar i enheten:'],
  testReady: ['أنهيتِ كل الدروس! الاختبار جاهز.', 'Alla lektioner klara! Provet väntar.'],
  missedWords: ['كلمات تحتاج تمريناً', 'Ord att öva mer på'],
  practiceThese: ['تمرّني على أخطائي', 'Öva på mina misstag'],
  thisWeek: ['هذا الأسبوع', 'Den här veckan'],
  statWords: ['كلمات تعلّمتِها', 'Ord du övat'],
  statMastered: ['كلمات تتقنينها', 'Ord du kan'],
  statUnits: ['وحدات أنهيتِها', 'Klara enheter'],
  statMinutes: ['دقائق التعلّم', 'Minuter totalt'],
  statBestStreak: ['أطول سلسلة 🔥', 'Längsta streak 🔥'],
  lifeTitle: ['الحياة في السويد', 'Livet i Sverige'],
  lifeInfo: ['كل ما تحتاجين إلى معرفته قبل انتقالك في كانون الأول 2027', 'Allt du behöver veta inför flytten i december 2027'],
  readDone: ['قرأتُ هذا ✓', 'Klart ✓'],
  keyWords: ['كلمات مهمة', 'Viktiga ord'],
  learnWords: ['تعلّمي الكلمات', 'Lär dig orden'],
  quiz: ['اختبار قصير', 'Quiz'],
  nextTopic: ['الموضوع التالي عن السويد', 'Nästa ämne om Sverige'],
  dailyGoal: ['هدفي اليومي (بالدقائق)', 'Mitt dagliga mål (minuter)'],
  myWords: ['كل ما تعلّمتِه', 'Allt jag har lärt mig'],
  myWordsInfo: ['كل الكلمات والجمل، اضغطي على أي واحدة لمراجعتها', 'Alla ord och meningar, tryck för att repetera'],
  dueToday: ['للمراجعة اليوم', 'Repetera idag'],
  inOneDay: ['غداً', 'imorgon'],
  srsTitle: ['كيف تعمل أيام المراجعة؟', 'Hur fungerar repetitionsdagarna?'],
  srsInfo: ['كل كلمة لها موعد مراجعة خاص بها. عندما تعرفينها يبتعد الموعد: بعد يوم، ثم يومين، ثم 4 أيام، ثم أسبوع، ثم أسبوعين، ثم شهر، ثم شهرين. وإذا نسيتِها تعود قريبة. هكذا تراجعين الكلمة قبل أن تنسيها بقليل، وهذه أقوى طريقة للحفظ.', 'Varje ord har ett eget repetitionsdatum. Kan du ordet flyttas det längre fram: 1, 2, 4, 7, 15, 30 och 60 dagar. Glömmer du det kommer det tillbaka snart.'],
  filter_all: ['الكل', 'Alla'],
  filter_weak: ['تحتاج تمريناً', 'Behöver övning'],
  filter_strong: ['أتقنتُها', 'Sitter'],
  searchWords: ['ابحثي عن كلمة…', 'Sök ord…'],
  reviewThese: ['راجعي الكلمات الضعيفة', 'Repetera de svaga orden'],
  install: ['أضيفي التطبيق إلى الشاشة الرئيسية من قائمة Chrome ⋮ ← "إضافة إلى الشاشة الرئيسية"', 'Lägg till på startskärmen via Chrome-menyn'],
};

// 0 = Arabic only, 1 = Arabic with Swedish under it, 2 = Swedish with Arabic under it, 3 = Swedish only.
export function uiStage() {
  const passed = UNITS.filter(u => getState().units[u.id]?.passed).length;
  if (passed < 3) return 0;
  if (passed < 6) return 1;
  if (passed < 10) return 2;
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
