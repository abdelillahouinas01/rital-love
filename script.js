const TEXT = 'RiTal';     // غيّر الاسم من هنا
const MAX = 1500;         // أقصى عدد جزيئات (قلّله إذا بقي الجهاز بطيئاً، مثلاً 900)
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const COLORS = Array.from({ length: 8 }, (_, i) => `hsl(${305 + i * 7},100%,70%)`);
let W, H, N = 0, PS = 2, X, Y, VX, VY, TX, TY, stars = [], hearts = [];
const mouse = { x: -999, y: -999, down: false };

// قلب جاهز مرة واحدة (أسرع بكثير من رسمه كل إطار)
const spr = document.createElement('canvas'); spr.width = spr.height = 64;
(() => {
  const c = spr.getContext('2d'), x = 32, y = 14, s = 36;
  c.shadowBlur = 10; c.shadowColor = '#ff3d9a'; c.fillStyle = '#ff5fae';
  c.beginPath(); c.moveTo(x, y + s * .3);
  c.bezierCurveTo(x, y, x - s * .5, y, x - s * .5, y + s * .3);
  c.bezierCurveTo(x - s * .5, y + s * .6, x, y + s * .8, x, y + s * 1.05);
  c.bezierCurveTo(x, y + s * .8, x + s * .5, y + s * .6, x + s * .5, y + s * .3);
  c.bezierCurveTo(x + s * .5, y, x, y, x, y + s * .3);
  c.fill();
})();

function resize() {
  W = cv.width = innerWidth; H = cv.height = innerHeight;
  stars = Array.from({ length: Math.min(80, W * H / 14000 | 0) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + .6 }));
  buildText();
}

function buildText() {
  const o = document.createElement('canvas'); o.width = W; o.height = H;
  const x = o.getContext('2d'), fs = Math.min(W / 3.6, H / 3);
  x.font = `${fs}px Pacifico, cursive`;
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(TEXT, W / 2, H * .42);
  const d = x.getImageData(0, 0, W, H).data;
  let g = W < 600 ? 4 : 5, pts;
  do {
    pts = [];
    for (let y = 0; y < H; y += g) for (let i = 0; i < W; i += g) if (d[(y * W + i) * 4 + 3] > 128) pts.push(i, y);
    g++;
  } while (pts.length / 2 > MAX);
  N = pts.length / 2; PS = Math.max(2, (g - 1) * .5);
  // خلط النقاط ليبقى الشكل كاملاً عند تقليل العدد تلقائياً
  for (let i = N - 1; i > 0; i--) {
    const j = Math.random() * (i + 1) | 0;
    [pts[2 * i], pts[2 * j]] = [pts[2 * j], pts[2 * i]];
    [pts[2 * i + 1], pts[2 * j + 1]] = [pts[2 * j + 1], pts[2 * i + 1]];
  }
  X = new Float32Array(N); Y = new Float32Array(N); VX = new Float32Array(N); VY = new Float32Array(N);
  TX = new Float32Array(N); TY = new Float32Array(N);
  for (let i = 0; i < N; i++) { TX[i] = pts[2 * i]; TY[i] = pts[2 * i + 1]; X[i] = Math.random() * W; Y[i] = Math.random() * H; }
}

function spawn(x, y, burst) {
  if (hearts.length > 40) return;
  hearts.push({
    x, y, s: burst ? 10 + Math.random() * 12 : 12 + Math.random() * 20,
    vx: burst ? (Math.random() - .5) * 5 : 0,
    vy: burst ? -Math.random() * 4 - 1 : -(.5 + Math.random() * .8),
    life: 1, burst, sw: Math.random() * 6.28
  });
}

let last = 0, slow = 0, lastPulse = 0, lastHeart = 0;
function loop(t) {
  const dt = t - last; last = t;
  // جودة تلقائية: إذا تأخر الجهاز نقلّل الجزيئات
  if (dt > 26) { if (++slow > 40 && N > 500) { N = N * .8 | 0; slow = 0; } } else if (slow > 0) slow--;

  ctx.clearRect(0, 0, W, H);

  // نجوم
  ctx.globalAlpha = .35 + .35 * Math.abs(Math.sin(t / 900));
  ctx.fillStyle = '#ffdcf0'; ctx.beginPath();
  for (const s of stars) ctx.rect(s.x, s.y, s.r, s.r);
  ctx.fill();

  // نبضة كل 2.6 ثانية
  let pulse = 0;
  if (t - lastPulse > 2600) { lastPulse = t; pulse = 2.4; }
  const cx = W / 2, cy = H * .42, mx = mouse.x, my = mouse.y, R2 = 12000, dir = mouse.down ? -1 : 1;
  const wob = Math.sin(t / 700) * .8;

  for (let i = 0; i < N; i++) {
    const px = X[i], py = Y[i];
    let dx = px - mx, dy = py - my, d = dx * dx + dy * dy;
    if (d < R2 && d > 1) { const f = (1 - d / R2) * 2.4 * dir / Math.sqrt(d); VX[i] += dx * f; VY[i] += dy * f; }
    if (pulse) { dx = px - cx; dy = py - cy; const l = Math.sqrt(dx * dx + dy * dy) || 1; VX[i] += dx / l * pulse; VY[i] += dy / l * pulse; }
    VX[i] = (VX[i] + (TX[i] + wob * ((i & 3) - 1.5) - px) * .04) * .85;
    VY[i] = (VY[i] + (TY[i] + wob * ((i & 3) - 1.5) - py) * .04) * .85;
    X[i] = px + VX[i]; Y[i] = py + VY[i];
  }

  // رسم الجزيئات: 8 مجموعات لونية فقط = 8 عمليات رسم
  for (let b = 0; b < 8; b++) {
    ctx.globalAlpha = .55 + .4 * Math.abs(Math.sin(t / 400 + b));
    ctx.fillStyle = COLORS[b]; ctx.beginPath();
    for (let i = b; i < N; i += 8) ctx.rect(X[i], Y[i], PS, PS);
    ctx.fill();
  }

  // قلوب
  if (t - lastHeart > 600) { lastHeart = t; spawn(Math.random() * W, H + 20, false); }
  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i];
    h.x += h.vx + Math.sin(t / 600 + h.sw) * .5; h.y += h.vy; h.vx *= .98;
    h.life -= h.burst ? .012 : .003;
    if (h.life <= 0 || h.y < -40) { hearts.splice(i, 1); continue; }
    const sz = h.s * 1.8;
    ctx.globalAlpha = Math.min(1, h.life) * .85;
    ctx.drawImage(spr, h.x - sz / 2, h.y - sz / 2, sz, sz);
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(loop);
}

// تفاعل
const move = e => { mouse.x = e.clientX; mouse.y = e.clientY; };
addEventListener('pointermove', move, { passive: true });
addEventListener('pointerdown', e => { move(e); mouse.down = true; for (let i = 0; i < 8; i++) spawn(e.clientX, e.clientY, true); });
addEventListener('pointerup', e => {
  mouse.down = false;
  const R = 260, R2 = R * R;
  for (let i = 0; i < N; i++) {
    const dx = X[i] - e.clientX, dy = Y[i] - e.clientY, d = dx * dx + dy * dy;
    if (d < R2) { const l = Math.sqrt(d) || 1, f = (1 - l / R) * 26; VX[i] += dx / l * f; VY[i] += dy / l * f; }
  }
  if (e.pointerType === 'touch') mouse.x = mouse.y = -999;
});
document.addEventListener('mouseleave', () => { mouse.x = mouse.y = -999; });

addEventListener('resize', () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 250); });
Promise.race([document.fonts.load('100px Pacifico'), new Promise(r => setTimeout(r, 1500))])
  .then(() => { resize(); requestAnimationFrame(loop); });