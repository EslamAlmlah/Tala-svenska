// Personal touches: greeting by time of day, a daily word, encouragement, confetti.
import { allItems } from './content.js';

const NAME = 'Tala';
const NAME_AR = 'تالة';

const TIMES = [
  { from: 5, sv: 'God morgon', ar: 'صباح الخير', sym: '☀️', sky: 'linear-gradient(135deg, #ffb648, #ff7eb3)' },
  { from: 10, sv: 'Hej', ar: 'مرحباً', sym: '🌸', sky: 'linear-gradient(135deg, #ff7eb3, #9b6bff)' },
  { from: 14, sv: 'God eftermiddag', ar: 'طاب يومك', sym: '🌤️', sky: 'linear-gradient(135deg, #5ec8ff, #9b6bff)' },
  { from: 18, sv: 'God kväll', ar: 'مساء الخير', sym: '🌆', sky: 'linear-gradient(135deg, #7c4dff, #ff5fa2)' },
  { from: 22, sv: 'God natt', ar: 'تصبحين على خير', sym: '🌙', sky: 'linear-gradient(135deg, #2b1d63, #7c4dff)' },
];

export function greeting(date = new Date()) {
  const h = date.getHours();
  const g = [...TIMES].reverse().find(x => h >= x.from) || TIMES[TIMES.length - 1]; // 0-4 → God natt
  return { ...g, svText: `${g.sv}, ${NAME}!`, arText: `${g.ar} يا ${NAME_AR}` };
}

const CHEERS = [
  ['Du är grym!', 'أنتِ رائعة!'],
  ['Lite varje dag gör stor skillnad.', 'القليل كل يوم يصنع فرقاً كبيراً.'],
  ['Bra jobbat igår!', 'عمل رائع أمس!'],
  ['Varje ord räknas.', 'كل كلمة لها قيمة.'],
  ['Du kan mer än du tror.', 'أنتِ تعرفين أكثر مما تظنّين.'],
  ['Snart pratar du som en svensk!', 'قريباً ستتكلّمين مثل السويديين!'],
  ['Ett steg i taget.', 'خطوة خطوة.'],
];

const dayNumber = () => Math.floor(Date.now() / 86_400_000);

export function cheer() { return CHEERS[dayNumber() % CHEERS.length]; }

export function wordOfDay() {
  const words = allItems().filter(i => i.kind === 'word' && i.sv.length > 2);
  return words[(dayNumber() * 7) % words.length];
}

export function confetti() {
  const c = document.getElementById('confetti');
  if (!c || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = c.getContext('2d');
  c.width = innerWidth; c.height = innerHeight;
  const colors = ['#7c4dff', '#ff5fa2', '#ffb648', '#1fbf8f', '#5ec8ff'];
  const bits = Array.from({ length: 120 }, () => ({
    x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.5,
    r: 4 + Math.random() * 6, vy: 2 + Math.random() * 4, vx: -2 + Math.random() * 4,
    a: Math.random() * 6, c: colors[Math.floor(Math.random() * colors.length)],
  }));
  let frames = 0;
  const step = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    for (const b of bits) {
      b.x += b.vx; b.y += b.vy; b.a += 0.1;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a);
      ctx.fillStyle = b.c; ctx.fillRect(-b.r / 2, -b.r / 2, b.r, b.r * 0.6);
      ctx.restore();
    }
    if (++frames < 160) requestAnimationFrame(step); else ctx.clearRect(0, 0, c.width, c.height);
  };
  step();
}
