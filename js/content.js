// Course content. Each unit has words (and short phrases) plus sentences.
// Lessons are made automatically: words are split into groups of about five,
// and the last lesson of a unit practises its sentences.
// Fields: sv = Swedish, ar = Arabic, e = emoji (optional), n = note in Arabic (optional).

export const PHASES = [
  { id: 1, ar: 'المرحلة 1: الأصوات وأول الكلمات', sv: 'Fas 1: Ljud och första orden' },
  { id: 2, ar: 'المرحلة 2: جمل بسيطة', sv: 'Fas 2: Enkla meningar' },
  { id: 3, ar: 'المرحلة 3: القراءة والمحادثة', sv: 'Fas 3: Läsa och prata' },
];

export const UNITS = [
  {
    id: 'u0', phase: 1, e: '🔊',
    ar: 'الأصوات السويدية', sv: 'Svenska ljud',
    tip: 'في السويدية 9 حروف متحرّكة: a e i o u y å ä ö. استمعي جيداً، فالحرف الطويل والقصير يغيّران المعنى.',
    words: [
      { sv: 'a', ar: 'حرف a، مثل "آ" مفتوحة', e: '🅰️', n: 'مثل: dag (يوم)' },
      { sv: 'å', ar: 'حرف å، بين "أو" و"آ"', e: '⭕', n: 'مثل: båt (قارب)' },
      { sv: 'ä', ar: 'حرف ä، مثل "إي" مفتوحة', e: '😮', n: 'مثل: äta (يأكل)' },
      { sv: 'ö', ar: 'حرف ö، بشفاه مدوّرة', e: '😗', n: 'مثل: ö (جزيرة)، röd (أحمر)' },
      { sv: 'y', ar: 'حرف y، "إي" بشفاه مدوّرة', e: '😙', n: 'مثل: ny (جديد)' },
      { sv: 'u', ar: 'حرف u، صوت سويدي خاص', e: '🌀', n: 'مثل: hus (بيت)' },
      { sv: 'sjuk', ar: 'مريض (صوت sj)', e: '🤒', n: 'sj صوت خاص يشبه "خ" ناعمة مع "ف"' },
      { sv: 'glas', ar: 'كأس (a طويلة)', e: '🥛' },
      { sv: 'glass', ar: 'بوظة / آيس كريم (a قصيرة)', e: '🍦' },
      { sv: 'packa', ar: 'يحزم الحقيبة (p)', e: '🧳', n: 'انتبهي: p ليست b' },
      { sv: 'backa', ar: 'يرجع للخلف (b)', e: '↩️' },
      { sv: 'vår', ar: 'ربيع (v)', e: '🌷', n: 'v مثل الفاء لكن مع صوت' },
      { sv: 'får', ar: 'خروف (f)', e: '🐑' },
    ],
    sentences: [],
  },
  {
    id: 'u1', phase: 1, e: '👋',
    ar: 'التحيّات', sv: 'Hälsningar',
    tip: 'السويديون يقولون "hej" للجميع، حتى للمدير. و"tack" تُقال كثيراً جداً!',
    words: [
      { sv: 'hej', ar: 'مرحباً', e: '👋' },
      { sv: 'hej då', ar: 'مع السلامة', e: '🚪' },
      { sv: 'tack', ar: 'شكراً', e: '🙏' },
      { sv: 'ja', ar: 'نعم', e: '✅' },
      { sv: 'nej', ar: 'لا', e: '❌' },
      { sv: 'förlåt', ar: 'آسف / عفواً', e: '😔' },
      { sv: 'varsågod', ar: 'تفضّل', e: '🤲' },
      { sv: 'god morgon', ar: 'صباح الخير', e: '🌅' },
      { sv: 'god natt', ar: 'تصبح على خير', e: '🌙' },
      { sv: 'bra', ar: 'جيد / بخير', e: '👍' },
    ],
    sentences: [
      { sv: 'Hur mår du?', ar: 'كيف حالك؟' },
      { sv: 'Jag mår bra.', ar: 'أنا بخير.' },
      { sv: 'Vad heter du?', ar: 'ما اسمك؟' },
      { sv: 'Jag heter Tala.', ar: 'اسمي تالة.' },
      { sv: 'Tack så mycket!', ar: 'شكراً جزيلاً!' },
    ],
  },
  {
    id: 'u2', phase: 1, e: '🧑',
    ar: 'أنا وأنت', sv: 'Jag och du',
    tip: 'الفعل في السويدية لا يتغيّر مع الضمير: jag är، du är، hon är. أسهل من العربية!',
    words: [
      { sv: 'jag', ar: 'أنا', e: '🙋‍♀️' },
      { sv: 'du', ar: 'أنتَ / أنتِ', e: '👉' },
      { sv: 'han', ar: 'هو', e: '👨' },
      { sv: 'hon', ar: 'هي', e: '👩' },
      { sv: 'vi', ar: 'نحن', e: '👨‍👩‍👧' },
      { sv: 'ni', ar: 'أنتم', e: '👥' },
      { sv: 'de', ar: 'هم', e: '🧑‍🤝‍🧑', n: 'تُنطق "دوم"' },
      { sv: 'är', ar: 'يكون (is / am / are)', e: '🟰' },
      { sv: 'Sverige', ar: 'السويد', e: '🇸🇪' },
      { sv: 'Syrien', ar: 'سوريا', e: '🇸🇾' },
      { sv: 'svenska', ar: 'اللغة السويدية', e: '💬' },
      { sv: 'arabiska', ar: 'اللغة العربية', e: '🗣️' },
    ],
    sentences: [
      { sv: 'Jag är från Syrien.', ar: 'أنا من سوريا.' },
      { sv: 'Jag bor i Syrien.', ar: 'أنا أسكن في سوريا.' },
      { sv: 'Jag talar arabiska.', ar: 'أنا أتكلم العربية.' },
      { sv: 'Jag lär mig svenska.', ar: 'أنا أتعلّم السويدية.' },
      { sv: 'Han bor i Sverige.', ar: 'هو يسكن في السويد.' },
    ],
  },
  {
    id: 'u3', phase: 1, e: '🔢',
    ar: 'الأرقام', sv: 'Siffror',
    tip: 'تعلّمي الأرقام بصوت عالٍ. انتبهي: sju (7) و tjugo (20) فيهما أصوات خاصة.',
    words: [
      { sv: 'noll', ar: 'صفر', e: '0️⃣' },
      { sv: 'ett', ar: 'واحد', e: '1️⃣' },
      { sv: 'två', ar: 'اثنان', e: '2️⃣' },
      { sv: 'tre', ar: 'ثلاثة', e: '3️⃣' },
      { sv: 'fyra', ar: 'أربعة', e: '4️⃣' },
      { sv: 'fem', ar: 'خمسة', e: '5️⃣' },
      { sv: 'sex', ar: 'ستة', e: '6️⃣' },
      { sv: 'sju', ar: 'سبعة', e: '7️⃣' },
      { sv: 'åtta', ar: 'ثمانية', e: '8️⃣' },
      { sv: 'nio', ar: 'تسعة', e: '9️⃣' },
      { sv: 'tio', ar: 'عشرة', e: '🔟' },
      { sv: 'tjugo', ar: 'عشرون', e: '2️⃣0️⃣' },
      { sv: 'hundra', ar: 'مئة', e: '💯' },
    ],
    sentences: [
      { sv: 'Jag är tjugo år.', ar: 'عمري عشرون سنة.' },
      { sv: 'Hur gammal är du?', ar: 'كم عمرك؟' },
      { sv: 'Det kostar tio kronor.', ar: 'هذا يكلّف عشر كرونات.' },
    ],
  },
  {
    id: 'u4', phase: 1, e: '👨‍👩‍👧',
    ar: 'العائلة', sv: 'Familjen',
    tip: 'كل اسم معه en أو ett. احفظي الكلمة دائماً مع أداتها: en mamma، ett barn.',
    words: [
      { sv: 'en familj', ar: 'عائلة', e: '👨‍👩‍👧' },
      { sv: 'en mamma', ar: 'أم', e: '👩' },
      { sv: 'en pappa', ar: 'أب', e: '👨' },
      { sv: 'en bror', ar: 'أخ', e: '👦' },
      { sv: 'en syster', ar: 'أخت', e: '👧' },
      { sv: 'ett barn', ar: 'طفل', e: '👶' },
      { sv: 'en son', ar: 'ابن', e: '🧒' },
      { sv: 'en dotter', ar: 'ابنة', e: '👧' },
      { sv: 'en vän', ar: 'صديق', e: '🤝' },
      { sv: 'en man', ar: 'رجل / زوج', e: '🧔' },
      { sv: 'en kvinna', ar: 'امرأة', e: '👩‍🦱' },
    ],
    sentences: [
      { sv: 'Det här är min mamma.', ar: 'هذه أمي.' },
      { sv: 'Jag har en bror.', ar: 'عندي أخ.' },
      { sv: 'Har du syskon?', ar: 'هل عندك إخوة؟' },
      { sv: 'Min syster heter Sara.', ar: 'أختي اسمها سارة.' },
    ],
  },
  {
    id: 'u5', phase: 1, e: '🍞',
    ar: 'الطعام والشراب', sv: 'Mat och dryck',
    tip: 'الفعل في المضارع ينتهي دائماً بـ r: äter (يأكل)، dricker (يشرب).',
    words: [
      { sv: 'ett bröd', ar: 'خبز', e: '🍞' },
      { sv: 'ett äpple', ar: 'تفاحة', e: '🍎' },
      { sv: 'en ost', ar: 'جبنة', e: '🧀' },
      { sv: 'mjölk', ar: 'حليب', e: '🥛' },
      { sv: 'vatten', ar: 'ماء', e: '💧' },
      { sv: 'kaffe', ar: 'قهوة', e: '☕' },
      { sv: 'te', ar: 'شاي', e: '🍵' },
      { sv: 'ris', ar: 'رز', e: '🍚' },
      { sv: 'kyckling', ar: 'دجاج', e: '🍗' },
      { sv: 'äter', ar: 'يأكل', e: '🍽️' },
      { sv: 'dricker', ar: 'يشرب', e: '🥤' },
      { sv: 'gott', ar: 'لذيذ', e: '😋' },
    ],
    sentences: [
      { sv: 'Jag äter bröd.', ar: 'أنا آكل خبزاً.' },
      { sv: 'Hon dricker kaffe.', ar: 'هي تشرب قهوة.' },
      { sv: 'Jag tycker om te.', ar: 'أنا أحب الشاي.' },
      { sv: 'Det är gott!', ar: 'هذا لذيذ!' },
      { sv: 'Kan jag få vatten?', ar: 'هل يمكنني الحصول على ماء؟' },
    ],
  },
  {
    id: 'u6', phase: 1, e: '🏠',
    ar: 'في البيت', sv: 'Hemma',
    tip: 'en و ett ليس لهما قاعدة سهلة. معظم الكلمات (حوالي 75%) تأخذ en.',
    words: [
      { sv: 'ett hus', ar: 'بيت', e: '🏠' },
      { sv: 'en lägenhet', ar: 'شقة', e: '🏢' },
      { sv: 'ett rum', ar: 'غرفة', e: '🚪' },
      { sv: 'ett kök', ar: 'مطبخ', e: '🍳' },
      { sv: 'en säng', ar: 'سرير', e: '🛏️' },
      { sv: 'ett bord', ar: 'طاولة', e: '🪑' },
      { sv: 'en stol', ar: 'كرسي', e: '💺' },
      { sv: 'en dörr', ar: 'باب', e: '🚪' },
      { sv: 'ett fönster', ar: 'نافذة', e: '🪟' },
      { sv: 'en telefon', ar: 'هاتف', e: '📱' },
    ],
    sentences: [
      { sv: 'Jag bor i en lägenhet.', ar: 'أنا أسكن في شقة.' },
      { sv: 'Huset är stort.', ar: 'البيت كبير.' },
      { sv: 'Var är köket?', ar: 'أين المطبخ؟' },
      { sv: 'Telefonen ligger på bordet.', ar: 'الهاتف موجود على الطاولة.' },
    ],
  },
  {
    id: 'u7', phase: 1, e: '📅',
    ar: 'الأيام والوقت', sv: 'Dagar och tid',
    tip: 'قاعدة V2: الفعل دائماً في المكان الثاني. "Idag är det måndag" وليس "Idag det är måndag".',
    words: [
      { sv: 'måndag', ar: 'الإثنين', e: '1️⃣' },
      { sv: 'tisdag', ar: 'الثلاثاء', e: '2️⃣' },
      { sv: 'onsdag', ar: 'الأربعاء', e: '3️⃣' },
      { sv: 'torsdag', ar: 'الخميس', e: '4️⃣' },
      { sv: 'fredag', ar: 'الجمعة', e: '5️⃣' },
      { sv: 'lördag', ar: 'السبت', e: '6️⃣' },
      { sv: 'söndag', ar: 'الأحد', e: '7️⃣' },
      { sv: 'idag', ar: 'اليوم', e: '📍' },
      { sv: 'imorgon', ar: 'غداً', e: '➡️' },
      { sv: 'igår', ar: 'أمس', e: '⬅️' },
      { sv: 'nu', ar: 'الآن', e: '⏱️' },
    ],
    sentences: [
      { sv: 'Idag är det måndag.', ar: 'اليوم هو الإثنين.' },
      { sv: 'Imorgon jobbar jag.', ar: 'غداً أعمل.' },
      { sv: 'Igår var det söndag.', ar: 'أمس كان الأحد.' },
      { sv: 'Nu lär jag mig svenska.', ar: 'الآن أتعلّم السويدية.' },
    ],
  },
  {
    id: 'u8', phase: 1, e: '🏃‍♀️',
    ar: 'أفعال يومية', sv: 'Vardagsverb',
    tip: 'النفي: inte تأتي بعد الفعل. Jag dricker inte kaffe = أنا لا أشرب القهوة.',
    words: [
      { sv: 'läser', ar: 'يقرأ', e: '📖' },
      { sv: 'skriver', ar: 'يكتب', e: '✍️' },
      { sv: 'lyssnar', ar: 'يستمع', e: '🎧' },
      { sv: 'pratar', ar: 'يتكلّم', e: '💬' },
      { sv: 'arbetar', ar: 'يعمل', e: '💼' },
      { sv: 'sover', ar: 'ينام', e: '😴' },
      { sv: 'går', ar: 'يمشي / يذهب', e: '🚶‍♀️' },
      { sv: 'kommer', ar: 'يأتي', e: '🏃' },
      { sv: 'förstår', ar: 'يفهم', e: '💡' },
      { sv: 'inte', ar: 'لا (للنفي)', e: '🚫' },
    ],
    sentences: [
      { sv: 'Jag läser en bok.', ar: 'أنا أقرأ كتاباً.' },
      { sv: 'Hon pratar svenska.', ar: 'هي تتكلّم السويدية.' },
      { sv: 'Jag förstår inte.', ar: 'أنا لا أفهم.' },
      { sv: 'Vi sover inte nu.', ar: 'نحن لا ننام الآن.' },
      { sv: 'Kan du prata långsamt?', ar: 'هل يمكنك أن تتكلّم ببطء؟' },
    ],
  },
  {
    id: 'u9', phase: 1, e: '🎨',
    ar: 'الألوان والصفات', sv: 'Färger och adjektiv',
    tip: 'الصفة تتغيّر: en stor bil، ett stort hus، stora hus. مع ett نضيف t.',
    words: [
      { sv: 'röd', ar: 'أحمر', e: '🔴' },
      { sv: 'blå', ar: 'أزرق', e: '🔵' },
      { sv: 'grön', ar: 'أخضر', e: '🟢' },
      { sv: 'gul', ar: 'أصفر', e: '🟡' },
      { sv: 'svart', ar: 'أسود', e: '⚫' },
      { sv: 'vit', ar: 'أبيض', e: '⚪' },
      { sv: 'stor', ar: 'كبير', e: '🐘' },
      { sv: 'liten', ar: 'صغير', e: '🐭' },
      { sv: 'ny', ar: 'جديد', e: '🆕' },
      { sv: 'gammal', ar: 'قديم / كبير في العمر', e: '👵' },
    ],
    sentences: [
      { sv: 'Huset är rött.', ar: 'البيت أحمر.' },
      { sv: 'Jag har en ny telefon.', ar: 'عندي هاتف جديد.' },
      { sv: 'Bilen är liten.', ar: 'السيارة صغيرة.' },
      { sv: 'Himlen är blå.', ar: 'السماء زرقاء.' },
    ],
  },
  {
    id: 'u10', phase: 1, e: '🇸🇪',
    ar: 'الثقافة السويدية', sv: 'Svensk kultur',
    tip: 'Fika ليست مجرد قهوة: هي وقت اجتماعي مهم في العمل والبيت. واللغة والثقافة يُتعلّمان معاً.',
    words: [
      { sv: 'fika', ar: 'استراحة قهوة مع حلويات', e: '☕', n: 'عادة اجتماعية مهمة جداً' },
      { sv: 'lagom', ar: 'معتدل، لا كثير ولا قليل', e: '⚖️' },
      { sv: 'midsommar', ar: 'عيد منتصف الصيف (حزيران)', e: '🌼' },
      { sv: 'jul', ar: 'عيد الميلاد', e: '🎄' },
      { sv: 'Lucia', ar: 'عيد لوسيا (13 كانون الأول)', e: '🕯️' },
      { sv: 'en kanelbulle', ar: 'كعكة القرفة', e: '🥐' },
      { sv: 'naturen', ar: 'الطبيعة', e: '🌲' },
      { sv: 'allemansrätten', ar: 'حق الجميع في الطبيعة', e: '🏕️', n: 'يمكن للجميع المشي والتخييم في الطبيعة' },
      { sv: 'i tid', ar: 'في الوقت المحدّد', e: '⏰', n: 'التأخير يُعتبر قلّة احترام' },
    ],
    sentences: [
      { sv: 'Ska vi fika?', ar: 'هل نأخذ استراحة قهوة؟' },
      { sv: 'Det är lagom varmt.', ar: 'الجو دافئ باعتدال.' },
      { sv: 'Vi firar midsommar i juni.', ar: 'نحتفل بمنتصف الصيف في حزيران.' },
      { sv: 'Jag kommer i tid.', ar: 'أنا آتي في الوقت المحدّد.' },
    ],
  },
];

// Units still to be written. Shown as locked on the map so Tala sees the road ahead.
export const COMING = [
  { phase: 2, e: '🛒', ar: 'التسوّق', sv: 'Handla' },
  { phase: 2, e: '🧥', ar: 'الملابس والطقس', sv: 'Kläder och väder' },
  { phase: 2, e: '🕐', ar: 'الساعة والمواعيد', sv: 'Klockan' },
  { phase: 2, e: '🚌', ar: 'المواصلات والمدينة', sv: 'Staden' },
  { phase: 2, e: '🩺', ar: 'الجسم والصحة', sv: 'Kroppen och hälsa' },
  { phase: 2, e: '⏮️', ar: 'الفعل الماضي', sv: 'Dåtid' },
  { phase: 3, e: '💼', ar: 'العمل والدراسة', sv: 'Jobb och skola' },
  { phase: 3, e: '🗞️', ar: 'أخبار سهلة', sv: 'Lätta nyheter' },
  { phase: 3, e: '💭', ar: 'الآراء والمشاعر', sv: 'Åsikter och känslor' },
];

export const WORDS_PER_LESSON = 5;

// Lessons of a unit: word groups, then one sentence lesson (if the unit has sentences).
export function lessonsOf(unit) {
  const out = [];
  for (let i = 0; i < unit.words.length; i += WORDS_PER_LESSON) {
    out.push({ kind: 'words', items: unit.words.slice(i, i + WORDS_PER_LESSON) });
  }
  // Fold a tiny last group into the previous lesson.
  if (out.length > 1 && out[out.length - 1].items.length < 3) {
    const last = out.pop();
    out[out.length - 1].items.push(...last.items);
  }
  if (unit.sentences.length) out.push({ kind: 'sentences', items: unit.sentences });
  return out;
}

export function itemKey(item) { return item.sv; }

export function allItems() {
  const out = [];
  for (const u of UNITS) {
    for (const w of u.words) out.push({ ...w, unit: u.id, kind: 'word' });
    for (const s of u.sentences) out.push({ ...s, unit: u.id, kind: 'sentence' });
  }
  return out;
}
