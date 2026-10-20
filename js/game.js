// =============================================
//  シインクラッド  試作・第1層（この端末だけ）
//  ・キューブで右へ進む。死ぬとその場所に屍が残って足場になる
//  ・穴に落ちれば底に積もり、トゲの上ならトゲをふさぐ
//  ・敵は1段の屍なら登るが、2段以上は越えられずに引き返す
//  ・屍の列には積める高さの上限がある（こえた屍は消える）
// =============================================
(function () {
  const $ = id => document.getElementById(id);
  const cv = $('cv'), g = cv.getContext('2d');
  // ---------- 第1層の地図（15行。上が0行目） ----------
  const ROWS = 15, GROUND = 11, CAP = 4;   // CAP：1つの列に積める屍の数
  const W = 128;
  const map = [];   // map[y][x]：' ' 空、'#' 地面、'^' トゲ
  for (let y = 0; y < ROWS; y++) map.push(new Array(W).fill(y >= GROUND ? '#' : ' '));
  const fill = (x0, x1, y0, y1, c) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) map[y][x] = c; };
  // 小さな穴（とべる）
  fill(10, 11, GROUND, 13, ' '); map[14][10] = map[14][11] = '#'; fill(10, 11, 13, 13, '^');
  // トゲ3つ（とべる）
  fill(20, 22, GROUND - 1, GROUND - 1, '^');
  // 広い穴（6マス・底はトゲ）：屍で埋める
  fill(32, 37, GROUND, 13, ' '); fill(32, 37, 13, 13, '^');
  // 長いトゲ（7マス・とべない）：屍でふさぐ
  fill(40, 46, GROUND - 1, GROUND - 1, '^');
  // 高い壁（5段）：敵に倒された屍を2段積んで登る
  fill(61, 70, GROUND - 5, GROUND - 1, '#');
  // 大きな穴（8マス・深い・底はトゲ）
  fill(80, 87, GROUND, 13, ' '); fill(80, 87, 13, 13, '^');
  // トゲの野原（とび石）
  for (const [a, b] of [[96, 98], [100, 102], [104, 107]]) fill(a, b, GROUND - 1, GROUND - 1, '^');
  // 最後の段
  fill(112, 114, GROUND - 2, GROUND - 1, '#');
  const GOAL_X = 122;
  const ENEMIES = [[26, 24, 31], [52, 47, 60], [57, 47, 60], [117, 115, 121]];   // [はじめのx, 左のはし, 右のはし]
  // ---------- 屍（この端末に保存） ----------
  const KEY = 'shiin_f1';
  let save = load();
  function load() { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && v.cells) return v; } catch (e) { } return { cells: {}, dead: 0, best: 0, clear: 0 }; }
  function store() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { } }
  const ck = (x, y) => x + ',' + y;
  const corpseAt = (x, y) => save.cells[ck(x, y)];
  const colCount = x => { let n = 0; for (let y = 0; y < ROWS; y++) if (corpseAt(x, y)) n++; return n; };
  // その場所に固いものがあるか（地面・屍）
  const solid = (x, y) => { if (x < 0) return true; if (x >= W || y < 0) return false; if (y >= ROWS) return true; return map[y][x] === '#' || !!corpseAt(x, y); };
  const spike = (x, y) => x >= 0 && x < W && y >= 0 && y < ROWS && map[y][x] === '^' && !corpseAt(x, y);
  // ---------- 名前（毎回ちがう名前） ----------
  const PRE = ['さびた', '七番目の', '名もなき', 'はぐれ', 'ねむれる', 'しろい', 'くろい', 'ちいさな', 'さいごの', 'まよえる', 'はじめての', 'かけだしの', 'うつろな', 'とおくの', 'ひとりの', 'のろわれた', 'ほこりの', 'わすれられた', 'かなしき', 'あおい'];
  const NAME = ['ノルド', 'ミナ', 'カイ', 'ルカ', 'トト', 'ハル', 'シノ', 'ユウ', 'レン', 'アオ', 'ソラ', 'イオ', 'ナギ', 'リク', 'コハ', 'セツ', 'ウタ', 'ロイ', 'マオ', 'キリ', '旅人', '剣士', '番兵', '巡礼者', '見習い'];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const newName = () => pick(PRE) + pick(NAME);
  const hue = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 360; };
  // ---------- 状態 ----------
  const P = { x: 2, y: GROUND - 1, vx: 0, vy: 0, w: 0.8, h: 0.8, on: false, face: 1, alive: true, name: '', t: 0, dead: 0 };
  let enemies = [], fx = [], started = false, cam = 0, T = 32, oy = 0, flash = 0, clearT = 0;
  const keys = { l: false, r: false, j: false };
  function spawn() {
    P.x = 2.1; P.y = GROUND - P.h; P.vx = 0; P.vy = 0; P.on = false; P.alive = true; P.face = 1; P.t = 0; P.name = newName(); P.jBuf = 0; P.coyote = 0;
    enemies = ENEMIES.map(([x, a, b]) => ({ x, y: GROUND - 0.9, w: 0.9, h: 0.9, vx: -2, a, b, vy: 0 }));
    $('h-name').textContent = P.name; clearT = 0;
  }
  // ---------- 動き ----------
  const G = 40, JV = 16, SPD = 6.2, ACC = 60, DT = 1 / 120;
  function collideX(o) {
    const y0 = Math.floor(o.y + 0.01), y1 = Math.floor(o.y + o.h - 0.01);
    if (o.vx > 0) { const x = Math.floor(o.x + o.w); for (let y = y0; y <= y1; y++) if (solid(x, y)) { o.x = x - o.w; o.vx = 0; return true; } }
    else if (o.vx < 0) { const x = Math.floor(o.x); for (let y = y0; y <= y1; y++) if (solid(x, y)) { o.x = x + 1; o.vx = 0; return true; } }
    return false;
  }
  function collideY(o) {
    const x0 = Math.floor(o.x + 0.01), x1 = Math.floor(o.x + o.w - 0.01); o.on = false;
    if (o.vy > 0) { const y = Math.floor(o.y + o.h); for (let x = x0; x <= x1; x++) if (solid(x, y)) { o.y = y - o.h; o.vy = 0; o.on = true; return; } }
    else if (o.vy < 0) { const y = Math.floor(o.y); for (let x = x0; x <= x1; x++) if (solid(x, y)) { o.y = y + 1; o.vy = 0; return; } }
  }
  function step() {
    if (!P.alive) return;
    P.t += DT;
    const dir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
    if (dir) P.face = dir;
    const target = dir * SPD; P.vx += Math.sign(target - P.vx) * Math.min(Math.abs(target - P.vx), ACC * DT * (P.on ? 1 : 0.7));
    // ジャンプ（押した少し前・地面をはなれた少しあとでもとべる）
    P.jBuf = keys.j ? (P.jHeld ? P.jBuf : 0.1) : Math.max(0, P.jBuf - DT); P.jHeld = keys.j; if (!keys.j) P.jBuf = Math.max(0, P.jBuf - DT);
    P.coyote = P.on ? 0.08 : Math.max(0, P.coyote - DT);
    if (P.jBuf > 0 && P.coyote > 0) { P.vy = -JV; P.jBuf = 0; P.coyote = 0; P.on = false; sfx('jump'); }
    if (!keys.j && P.vy < -5) P.vy = -5;   // 早くはなすと低いジャンプ
    P.vy = Math.min(22, P.vy + G * DT);
    P.x += P.vx * DT; collideX(P);
    P.y += P.vy * DT; collideY(P);
    if (P.x < 0) P.x = 0;
    // トゲ（下の6割に当たったら）
    const x0 = Math.floor(P.x + 0.05), x1 = Math.floor(P.x + P.w - 0.05), yb = P.y + P.h;
    for (let x = x0; x <= x1; x++) for (let y = Math.floor(P.y); y <= Math.floor(yb - 0.01); y++) if (spike(x, y) && yb > y + 0.4) return die();
    if (P.y > ROWS + 2) return die();
    // 敵
    for (const e of enemies) {
      walkEnemy(e);
      if (P.x < e.x + e.w - 0.12 && P.x + P.w > e.x + 0.12 && P.y < e.y + e.h - 0.1 && P.y + P.h > e.y + 0.15) return die();
    }
    save.best = Math.max(save.best, P.x);
    if (P.x + P.w >= GOAL_X) clear();
  }
  // 敵：1段の段差（屍1つ）なら登る。2段以上・穴のふち・持ち場のはしで引き返す
  function walkEnemy(e) {
    const d = Math.sign(e.vx), fx0 = d > 0 ? Math.floor(e.x + e.w + 0.02) : Math.floor(e.x - 0.02), footY = Math.floor(e.y + e.h - 0.01);
    let turn = false;
    if (solid(fx0, footY)) {
      if (!solid(fx0, footY - 1) && !solid(fx0, footY - 2) && !solid(Math.floor(e.x + 0.45), footY - 1)) { e.y -= 1; e.x += d * 0.05; }
      else turn = true;
    } else if (!solid(fx0, footY + 1) && !solid(fx0, footY + 2)) turn = true;   // 先が深い穴
    const nx = e.x + e.vx * DT;
    if (nx < e.a || nx + e.w > e.b + 1) turn = true;
    if (turn) e.vx = -e.vx; else e.x = nx;
    // 足もとがなくなったら1段おりる
    const cx = Math.floor(e.x + e.w / 2);
    if (!solid(cx, Math.floor(e.y + e.h + 0.02)) && solid(cx, Math.floor(e.y + e.h + 1.02))) e.y += 1;
  }
  function die() {
    P.alive = false; P.dead++; save.dead++;
    let cx = Math.floor(P.x + P.w / 2), cy = Math.floor(P.y + P.h / 2);
    if (cx >= W) cx = W - 1;
    cy = Math.max(0, Math.min(ROWS - 1, cy));
    while (cy > 0 && solid(cx, cy)) cy--;
    while (cy < ROWS - 1 && !solid(cx, cy + 1)) cy++;   // 下へ落ちて積もる（トゲの上ならトゲをふさぐ）
    let vanish = false;
    if (colCount(cx) >= CAP) vanish = true;
    else { const k = ck(cx, cy), c = save.cells[k]; save.cells[k] = { n: (c ? c.n : 0) + 1, last: P.name }; }
    // 同じマスにすでに屍がある場合（上にずらせないとき）は、そのマスの数だけ増やす
    store();
    fx.push({ x: cx + 0.5, y: cy + 0.5, t: 0, vanish });
    flash = 0.25; sfx(vanish ? 'vanish' : 'die');
    toast(`${P.name} は屍になった`, vanish ? 'この列はもう積めない（上限' + CAP + '）' : `この層の屍 ${save.dead}人目`);
    setTimeout(() => { if (started) spawn(); }, 900);
    hud();
  }
  function clear() {
    P.alive = false; save.clear++; store(); sfx('clear');
    toast('第1層 突破！', `${P.name}（${P.t.toFixed(1)}秒）`); clearT = 1;
    setTimeout(() => { if (started) spawn(); }, 2600);
  }
  // ---------- 表示 ----------
  function resize() {
    const w = innerWidth, h = innerHeight, d = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(w * d); cv.height = Math.round(h * d);
    T = Math.max(12, Math.floor(Math.min(cv.height / (ROWS + 0.5), cv.width / 15)));
    oy = Math.round((cv.height - ROWS * T) * 0.55);
  }
  addEventListener('resize', resize);
  const PAL = { sky0: '#1b1830', sky1: '#3a2c4a', far: '#2a2338', far2: '#231d30', rock: '#5a4d5e', rockD: '#3e3445', rockL: '#7a6a78', moss: '#6f9a4e', mossD: '#4c7038', spike: '#d9d2c4', spikeD: '#8a8090', corpse: '#6e6a74', corpseD: '#46424c', enemy: '#8a3a7a', enemyD: '#5a2050', flag: '#ffd25a' };
  function px(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h)); }
  function draw(dt) {
    const vw = cv.width / T;
    const want = P.x - vw * 0.35; cam += (Math.max(0, Math.min(W - vw, want)) - cam) * Math.min(1, dt * 8);
    // 空と遠くの塔
    const gr = g.createLinearGradient(0, 0, 0, cv.height); gr.addColorStop(0, PAL.sky0); gr.addColorStop(1, PAL.sky1); g.fillStyle = gr; g.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < 40; i++) { const sx = ((i * 97.3) % 1) * 0 + ((i * 137) % 997) / 997 * cv.width * 1.6 - cam * T * 0.05; const sy = ((i * 71) % 389) / 389 * oy * 1.6; px(((sx % (cv.width * 1.6)) + cv.width * 1.6) % (cv.width * 1.6) - cv.width * 0.3, sy, T * 0.08, T * 0.08, 'rgba(255,240,210,.5)'); }
    for (let i = 0; i < 9; i++) {   // 遠くの柱
      const bx = (i * 9.5 - cam * 0.25) * T, bw = T * 2.2, bh = T * (6 + (i * 7) % 5);
      const xx = ((bx % (cv.width + bw * 4)) + cv.width + bw * 4) % (cv.width + bw * 4) - bw * 2;
      px(xx, oy + GROUND * T - bh, bw, bh, i % 2 ? PAL.far : PAL.far2);
      px(xx + bw * 0.2, oy + GROUND * T - bh + T * 0.6, bw * 0.15, T * 0.5, 'rgba(255,210,90,.25)');
    }
    g.save(); g.translate(-Math.round(cam * T), oy);
    const x0 = Math.max(0, Math.floor(cam) - 1), x1 = Math.min(W - 1, Math.ceil(cam + vw) + 1);
    // 地面の下（画面の下まで）
    px(x0 * T, ROWS * T, (x1 - x0 + 1) * T, cv.height, PAL.rockD);
    for (let x = x0; x <= x1; x++) for (let y = 0; y < ROWS; y++) {
      const c = map[y][x], X = x * T, Y = y * T;
      if (c === '#') {
        px(X, Y, T, T, PAL.rock);
        const s = (x * 7 + y * 13) % 5; px(X + T * (0.15 + s * 0.12), Y + T * 0.55, T * 0.18, T * 0.12, PAL.rockD); px(X + T * 0.6, Y + T * (0.2 + s * 0.08), T * 0.12, T * 0.12, PAL.rockL);
        if (y === 0 || map[y - 1][x] !== '#') { px(X, Y, T, T * 0.22, PAL.moss); px(X, Y + T * 0.22, T, T * 0.08, PAL.mossD); for (let k = 0; k < 3; k++) px(X + T * (0.1 + k * 0.33), Y + T * 0.3, T * 0.1, T * 0.1, PAL.mossD); }
      } else if (c === '^' && !corpseAt(x, y)) {
        for (let k = 0; k < 2; k++) { g.fillStyle = PAL.spike; g.beginPath(); g.moveTo(X + k * T / 2, Y + T); g.lineTo(X + k * T / 2 + T / 4, Y + T * 0.38); g.lineTo(X + (k + 1) * T / 2, Y + T); g.fill(); g.fillStyle = PAL.spikeD; g.fillRect(X + k * T / 2 + T / 4, Y + T * 0.6, T * 0.06, T * 0.4); }
      }
      const cp = corpseAt(x, y);
      if (cp) drawCorpse(X, Y, cp);
    }
    // 積める高さの上限（その列が上限なら赤い線）
    for (let x = x0; x <= x1; x++) { const n = colCount(x); if (n >= CAP) { let top = 0; for (let y = 0; y < ROWS; y++) if (corpseAt(x, y)) { top = y; break; } px(x * T + T * 0.1, top * T - T * 0.18, T * 0.8, T * 0.08, '#e0503a'); } else if (n >= CAP - 1) { let top = 0; for (let y = 0; y < ROWS; y++) if (corpseAt(x, y)) { top = y; break; } px(x * T + T * 0.25, top * T - T * 0.16, T * 0.5, T * 0.06, 'rgba(224,80,58,.55)'); } }
    // ゴールの旗
    const GX = GOAL_X * T, GY = GROUND * T;
    px(GX, GY - T * 4, T * 0.15, T * 4, '#cfc6b8');
    const wv = Math.sin(performance.now() / 200) * T * 0.08;
    g.fillStyle = PAL.flag; g.beginPath(); g.moveTo(GX + T * 0.15, GY - T * 4); g.lineTo(GX + T * 1.3, GY - T * 3.6 + wv); g.lineTo(GX + T * 0.15, GY - T * 3.1); g.fill();
    // 敵
    for (const e of enemies) {
      const X = e.x * T, Y = e.y * T, s = e.w * T;
      px(X, Y + s * 0.15, s, s * 0.85, PAL.enemy); px(X + s * 0.1, Y, s * 0.8, s * 0.2, PAL.enemy); px(X, Y + s * 0.8, s, s * 0.2, PAL.enemyD);
      const ex = e.vx > 0 ? 0.5 : 0.15; px(X + s * ex, Y + s * 0.35, s * 0.14, s * 0.18, '#ffe9a8'); px(X + s * (ex + 0.22), Y + s * 0.35, s * 0.14, s * 0.18, '#ffe9a8');
    }
    // プレイヤー
    if (P.alive || clearT) {
      const X = P.x * T, Y = P.y * T, s = P.w * T, h = hue(P.name);
      px(X, Y, s, s, `hsl(${h},55%,58%)`); px(X, Y + s * 0.8, s, s * 0.2, `hsl(${h},50%,40%)`); px(X, Y, s, s * 0.12, `hsl(${h},65%,72%)`);
      const ex = P.face > 0 ? 0.5 : 0.12; px(X + s * ex, Y + s * 0.3, s * 0.14, s * 0.22, '#1a1520'); px(X + s * (ex + 0.24), Y + s * 0.3, s * 0.14, s * 0.22, '#1a1520');
    }
    // 屍になる瞬間
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i]; f.t += dt; if (f.t > 0.8) { fx.splice(i, 1); continue; }
      const k = f.t / 0.8;
      g.strokeStyle = f.vanish ? `rgba(224,80,58,${1 - k})` : `rgba(255,240,210,${1 - k})`; g.lineWidth = Math.max(2, T * 0.08);
      g.strokeRect(f.x * T - T * (0.5 + k), f.y * T - T * (0.5 + k), T * (1 + 2 * k), T * (1 + 2 * k));
    }
    g.restore();
    if (flash > 0) { flash -= dt; g.fillStyle = `rgba(224,80,58,${Math.max(0, flash) * 1.2})`; g.fillRect(0, 0, cv.width, cv.height); }
  }
  function drawCorpse(X, Y, cp) {
    const h = hue(cp.last);
    px(X + 1, Y + 1, T - 2, T - 2, `hsl(${h},12%,38%)`); px(X + 1, Y + T * 0.78, T - 2, T * 0.2, `hsl(${h},10%,26%)`); px(X + 1, Y + 1, T - 2, T * 0.1, `hsl(${h},14%,48%)`);
    // ×の目
    const e = (cx, cy) => { const a = T * 0.1; g.strokeStyle = '#1a1520'; g.lineWidth = Math.max(1.5, T * 0.06); g.beginPath(); g.moveTo(cx - a, cy - a); g.lineTo(cx + a, cy + a); g.moveTo(cx + a, cy - a); g.lineTo(cx - a, cy + a); g.stroke(); };
    e(X + T * 0.33, Y + T * 0.4); e(X + T * 0.67, Y + T * 0.4);
    if (cp.n > 1) { g.fillStyle = '#ffd25a'; g.font = `${Math.round(T * 0.3)}px DotGothic16, monospace`; g.textAlign = 'center'; g.fillText(cp.n > 99 ? '99+' : String(cp.n), X + T / 2, Y + T * 0.72); }
  }
  // ---------- 画面の文字 ----------
  function hud() {
    $('h-dead').textContent = save.dead;
    $('h-prog').style.width = Math.min(100, P.x / GOAL_X * 100) + '%';
    $('h-best').style.left = Math.min(100, save.best / GOAL_X * 100) + '%';
    $('h-time').textContent = P.t.toFixed(1) + '秒';
  }
  let toastT = 0;
  function toast(a, b) { const e = $('toast'); e.innerHTML = a + (b ? `<small>${b}</small>` : ''); e.classList.add('in'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('in'), 1500); }
  // 屍をタップ：名前とそのマスの死亡数
  cv.addEventListener('pointerdown', ev => {
    const d = cv.width / cv.clientWidth, x = Math.floor((ev.clientX * d + cam * T) / T), y = Math.floor((ev.clientY * d - oy) / T);
    const cp = corpseAt(x, y), pop = $('pop');
    if (!cp) { pop.style.display = 'none'; return; }
    pop.innerHTML = `<b>${cp.last}</b>の屍<br>ここで${cp.n}人死亡`; pop.style.left = ev.clientX + 'px'; pop.style.top = ev.clientY + 'px'; pop.style.display = 'block';
    clearTimeout(pop._t); pop._t = setTimeout(() => pop.style.display = 'none', 2200);
  });
  // ---------- 操作 ----------
  const KM = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', ArrowUp: 'j', KeyW: 'j', Space: 'j', KeyZ: 'j' };
  addEventListener('keydown', e => { const k = KM[e.code]; if (k) { keys[k] = true; e.preventDefault(); } if (!started && (e.code === 'Enter' || e.code === 'Space')) begin(); });
  addEventListener('keyup', e => { const k = KM[e.code]; if (k) keys[k] = false; });
  for (const [id, k] of [['bl', 'l'], ['br', 'r'], ['bj', 'j']]) {
    const b = $(id);
    const on = e => { e.preventDefault(); keys[k] = true; b.classList.add('on'); sfxUnlock(); }, off = e => { e.preventDefault(); keys[k] = false; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
  }
  // ---------- 音（その場で作る） ----------
  let ac = null;
  function sfxUnlock() { if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (C) try { ac = new C(); } catch (e) { } } if (ac && ac.state === 'suspended') ac.resume(); }
  function sfx(k) {
    if (!ac || ac.state !== 'running') return; const t = ac.currentTime;
    const tone = (f0, f1, d, type, v) => { const o = ac.createOscillator(), gg = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d); gg.gain.setValueAtTime(v, t); gg.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(gg); gg.connect(ac.destination); o.start(t); o.stop(t + d + 0.02); };
    if (k === 'jump') tone(420, 760, 0.12, 'square', 0.06);
    else if (k === 'die') { tone(300, 60, 0.35, 'square', 0.09); tone(160, 40, 0.4, 'triangle', 0.12); }
    else if (k === 'vanish') tone(500, 90, 0.4, 'sawtooth', 0.06);
    else if (k === 'clear') { [523, 659, 784, 1047].forEach((f, i) => { const o = ac.createOscillator(), gg = ac.createGain(); o.type = 'square'; o.frequency.value = f; gg.gain.setValueAtTime(0.0001, t + i * 0.1); gg.gain.exponentialRampToValueAtTime(0.06, t + i * 0.1 + 0.01); gg.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.1 + 0.3); o.connect(gg); gg.connect(ac.destination); o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.35); }); }
  }
  // ---------- はじめ ----------
  function begin() { sfxUnlock(); started = true; $('msg').classList.add('hide'); spawn(); }
  $('go').onclick = begin;
  $('reset').onclick = () => { save = { cells: {}, dead: 0, best: 0, clear: 0 }; store(); toast('屍をぜんぶ消しました'); hud(); };
  window.SHIIN = { P, save: () => save, keys, step, die, map, solid, en: () => enemies, noEnemy: () => { enemies = []; } };   // テスト用
  resize(); spawn();
  let last = performance.now(), acc = 0;
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (started) { acc += dt; while (acc >= DT) { step(); acc -= DT; } }
    draw(dt); if (started) hud();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
