// =============================================
//  シインクラッド  動きの計算（決まった答え）
//  ・1/120秒ずつ進める。同じ層・同じ屍・同じ操作なら、どの端末でも必ず同じ結果
//    （Math.sin などは使わず、表をひいて計算する）
//  ・死ぬとその場所に屍。穴の底に積もり、トゲ・溶岩をふさぎ、水に浮き、流砂に沈み、毒で溶ける
//  ・屍の列には積める上限がある（こえた屍は消える）
// =============================================
(function (G) {
  const SH = G.SH = G.SH || {};
  // ---------- マスの種類 ----------
  const T = SH.T = { AIR: 0, ROCK: 1, SPIKE: 2, WATER: 3, LAVA: 4, SAND: 5, ICE: 6, VANISH: 7, TRAP: 8, POISON: 9, BELT_R: 10, BELT_L: 11, FLIP: 12, WIND_R: 13, WIND_L: 14, UP: 15, CLOUD: 16, DEEP: 17 };
  const DT = SH.DT = 1 / 120;
  // 決まった答えの sin（表）
  const SIN = new Float64Array(1024);
  { // テイラー展開で作る（端末で答えが変わらない）
    for (let i = 0; i < 1024; i++) { let x = i / 1024 * 6.283185307179586; if (x > 3.141592653589793) x -= 6.283185307179586; const x2 = x * x; SIN[i] = x * (1 - x2 / 6 * (1 - x2 / 20 * (1 - x2 / 42 * (1 - x2 / 72 * (1 - x2 / 110 * (1 - x2 / 156)))))); }
  }
  const dsin = p => SIN[((Math.floor(p * 1024) % 1024) + 1024) % 1024];   // p：1で1周
  const dcos = p => dsin(p + 0.25);
  SH.dsin = dsin; SH.dcos = dcos;
  const tri = p => { const f = p - Math.floor(p); return f < 0.5 ? f * 2 : 2 - f * 2; };   // 0→1→0
  // ---------- 物の大きさ・動き ----------
  const PW = 0.8, PH = 0.8;
  const ZAP2 = SH.ZAP2 = 74;   // 新しい電気の梯子にする層（越えた層・挑戦中の層は、前の決まりのまま）
  const GRAV = 40, JV = 16, SPD = 6.2, ACC = 60, MAXF = 22;
  SH.PHYS = { GRAV, JV, SPD, PW, PH };
  // ---------- 1回の挑戦 ----------
  // lv：層（levels.js が作る）、corpses：Map(key → {n,last})、opt.input(tick)→ビット（1左 2右 4ジャンプ）
  class Run {
    constructor(lv, corpses) {
      this.lv = lv; this.W = lv.w; this.H = lv.h; this.tiles = lv.tiles; this.cap = lv.cap;
      this.cor = corpses;                 // 共有の屍（このRunでは読むだけ。死んだときに外で足す）
      this.col = new Int16Array(this.W);  // 列ごとの屍の数
      for (const k of corpses.keys()) { const x = k % this.W; if (x >= 0 && x < this.W) this.col[x]++; }
      this.t = 0; this.over = false; this.dead = null; this.clear = false;
      this.trap = new Map();             // 開いた落とし戸（このRunだけ）
      this.p = { x: lv.start.x, y: lv.start.y, vx: 0, vy: 0, on: false, face: 1, jb: 0, coy: 0, jh: false, g: 1, plat: -1, maxX: lv.start.x };
      this.ents = lv.ents.map(e => Object.assign({}, e, { st: {} }));
      this.events = [];                   // 音・見た目用（計算には使わない）
    }
    key(x, y) { return y * this.W + x; }
    tile(x, y) { if (x < 0 || x >= this.W) return T.ROCK; if (y < 0) return T.AIR; if (y >= this.H) return T.DEEP; return this.tiles[y * this.W + x]; }
    hasCorpse(x, y) { return x >= 0 && x < this.W && y >= 0 && y < this.H && this.cor.has(y * this.W + x); }
    vanishOn(x) { const per = 300, on = 190, off = (x * 37) % per; return ((this.t + off) % per) < on; }
    // 人にとって固いか
    solid(x, y) {
      if (this.hasCorpse(x, y)) return true;
      const c = this.tile(x, y);
      if (c === T.ROCK || c === T.ICE || c === T.BELT_R || c === T.BELT_L) return true;
      if (c === T.VANISH) return this.vanishOn(x);
      if (c === T.TRAP) return !this.trap.has(y * this.W + x);
      return false;
    }
    // ---------- 1つ進める ----------
    step(inp) {
      if (this.over) return;
      this.t++;
      const p = this.p, lv = this.lv;
      this.moveEnts();
      const L = inp & 1, R = (inp >> 1) & 1, J = (inp >> 2) & 1;
      const dir = R - L; if (dir) p.face = dir;
      // 足もと・まわりのマス
      const cx = Math.floor(p.x + PW / 2), cy = Math.floor(p.y + PH / 2), footY = p.g > 0 ? Math.floor(p.y + PH + 0.05) : Math.floor(p.y - 0.05);
      const under = p.on ? this.tile(cx, footY) : T.AIR, here = this.tile(cx, cy);
      const inWater = here === T.WATER || this.tile(cx, Math.floor(p.y + 0.1)) === T.WATER;
      const inSand = here === T.SAND || this.tile(cx, Math.floor(p.y + PH - 0.1)) === T.SAND;
      // 重力の向き（上下さかさまのマス）
      p.g = here === T.FLIP ? -1 : 1;
      // 横の動き
      const ice = p.on && under === T.ICE && !this.hasCorpse(cx, footY);
      const acc = ice ? 9 : (p.on ? ACC : ACC * 0.7);
      const top = dir * SPD * (inWater ? 0.6 : inSand ? 0.45 : 1);
      p.vx += Math.sign(top - p.vx) * Math.min(Math.abs(top - p.vx), acc * DT);
      // ベルト・風
      let push = 0;
      if (p.on && !this.hasCorpse(cx, footY)) { if (under === T.BELT_R) push = 3.2; else if (under === T.BELT_L) push = -3.2; }
      if (here === T.WIND_R) p.vx += 26 * DT; else if (here === T.WIND_L) p.vx -= 26 * DT;
      // ジャンプ（押した少し前・地面をはなれた少しあと、でもとべる）
      if (J && !p.jh) p.jb = 12; else if (p.jb > 0) p.jb--;
      p.jh = !!J;
      p.coy = p.on ? 10 : Math.max(0, p.coy - 1);
      if (p.jb > 0 && p.coy > 0 && !inWater) { p.vy = -JV * p.g * (inWater ? 0.62 : inSand ? 0.55 : 1); p.jb = 0; p.coy = 0; p.on = false; this.ev('jump'); }
      if (!J && p.vy * p.g < -5) p.vy = -5 * p.g;
      // 重力
      let gr = GRAV * p.g, mf = MAXF;
      if (inWater) { gr *= 0.32; mf = 3.2; } else if (inSand) { gr *= 0.25; mf = 1.1; }
      if (here === T.UP) gr -= 62;
      p.vy += gr * DT; if (p.vy > mf) p.vy = mf; if (p.vy < -mf * 1.2 && !inWater) p.vy = Math.max(p.vy, -26);
      // はしご（第25層から）：屍で止まった天井の下にかかる。ジャンプを押している間は登る、はなすとゆっくり下りる
      if (p.g > 0 && this.ladderAt()) { p.lad = true; if (J) { p.vy = -4.5; p.on = false; } else if (p.vy > 2) p.vy = 2; } else p.lad = false;
      // 動く床に乗っている
      let ride = 0, rideY = 0;
      if (p.plat >= 0) { const e = this.ents[p.plat]; ride = e.dx || 0; rideY = e.dy || 0; }
      // 動かす
      const wasBottom = p.y + PH;
      p.x += (p.vx + push + ride) * DT; this.colX();
      p.y += (p.vy) * DT + rideY * DT; this.colY(wasBottom);
      if (p.x < 0) p.x = 0;
      if (p.x > p.maxX) p.maxX = p.x;
      // 落とし戸：上に乗ると少しして開く
      if (p.on && p.g > 0) {
        for (const fx of [Math.floor(p.x + 0.1), Math.floor(p.x + PW - 0.1)]) {
          const fy = Math.floor(p.y + PH + 0.05), k = fy * this.W + fx;
          if (this.tile(fx, fy) === T.TRAP && !this.trap.has(k) && !this.hasCorpse(fx, fy)) { const st = this.ents.length; this.trapT = this.trapT || new Map(); const c = (this.trapT.get(k) || 0) + 1; this.trapT.set(k, c); if (c > 18) { this.trap.set(k, this.t); this.ev('trap'); } }
        }
      }
      // ---------- 死ぬもの ----------
      const k = this.hazard(); if (k) return this.die(k);
      if (p.y > this.H + 2 || p.y < -6) return this.die('pit');
      if (p.x + PW >= lv.goal) { this.clear = true; this.over = true; this.ev('clear'); }
    }
    ev(k, a) { this.events.push({ k, t: this.t, a }); }
    // 電気の梯子（第74層から）：電気の玉が梯子の上をゆっくり上下する
    //  ・天井から下へ、1秒に2マスで下りる → 梯子の下の近く（頭より上）で1.2秒消えて休む → 1秒に3マスで昇る → また下りる
    //  ・休みの直前0.5秒は点滅して知らせる。梯子の下で待っていれば、しびれない
    //  ・玉は梯子1マスぶん。玉に触れるとしびれる（屍はふつうに残る）
    zap2(e, t) {
      const top = e.y + e.h;
      let gy = this.H;
      for (let x = Math.floor(e.x); x < Math.ceil(e.x + e.w - 0.01); x++) for (let y = Math.floor(top); y < this.H; y++) if (this.solid(x, y)) { if (y < gy) gy = y; break; }
      const lo = gy - 1.5, hi = top + 0.5, L = lo - hi;
      if (!(L > 0)) { e.zon = false; e.zwarn = false; e.zb = null; e.st.z = 0; return; }
      const dD = Math.max(1, Math.round(L / 2 * 120)), dR = 144, dU = Math.max(1, Math.round(L / 3 * 120)), P = dD + dR + dU;
      const f = (t + (e.zo || 0)) % P;
      if (f < dD) { e.zb = hi + L * (f / dD); e.zon = true; e.zdir = 1; }
      else if (f < dD + dR) { e.zb = lo; e.zon = false; e.zdir = 0; }
      else { e.zb = lo - L * ((f - dD - dR) / dU); e.zon = true; e.zdir = -1; }
      e.zwarn = f >= dD - 60 && f < dD;
      if (e.zon && !e.st.z) { e.st.z = 1; this.ev('zap', e.x); } if (!e.zon) e.st.z = 0;
    }
    // はしごにさわっているか（止まった天井の下、天井の下はしから地面まで）
    ladderAt() {
      const p = this.p;
      for (const e of this.ents) {
        if (e.k !== 'crush' || !e.lad || !e.jammed) continue;
        if (p.x + PW > e.x + 0.2 && p.x < e.x + e.w - 0.2 && p.y + PH > e.y + e.h - 0.1 && p.y < this.H) {
          if (p.y + PH * 0.5 > e.y + e.h - 0.6) return true;
        }
      }
      return false;
    }
    colX() {
      const p = this.p, y0 = Math.floor(p.y + 0.02), y1 = Math.floor(p.y + PH - 0.02);
      if (p.vx + 0 > 0 || true) {
        const xr = Math.floor(p.x + PW);
        for (let y = y0; y <= y1; y++) if (this.solid(xr, y)) { p.x = xr - PW; if (p.vx > 0) p.vx = 0; break; }
        const xl = Math.floor(p.x);
        for (let y = y0; y <= y1; y++) if (this.solid(xl, y)) { p.x = xl + 1; if (p.vx < 0) p.vx = 0; break; }
      }
      // 動く床の横
      for (let i = 0; i < this.ents.length; i++) {
        const e = this.ents[i]; if (e.k !== 'plat') continue;
        if (p.y + PH > e.y + 0.05 && p.y < e.y + e.h - 0.05 && p.x + PW > e.x && p.x < e.x + e.w) {
          if (p.x + PW / 2 < e.x + e.w / 2) p.x = e.x - PW; else p.x = e.x + e.w;
          p.vx = 0;
        }
      }
    }
    colY(wasBottom) {
      const p = this.p, x0 = Math.floor(p.x + 0.02), x1 = Math.floor(p.x + PW - 0.02);
      p.on = false; p.plat = -1;
      const down = p.vy * p.g >= 0;
      if (p.g > 0) {
        if (p.vy >= 0) {
          const y = Math.floor(p.y + PH);
          for (let x = x0; x <= x1; x++) {
            const c = this.tile(x, y);
            const cloud = c === T.CLOUD && wasBottom <= y + 0.05 && !this.hasCorpse(x, y);
            if (this.solid(x, y) || cloud) { p.y = y - PH; p.vy = 0; p.on = true; break; }
          }
        } else {
          const y = Math.floor(p.y);
          for (let x = x0; x <= x1; x++) if (this.solid(x, y)) { p.y = y + 1; p.vy = 0; break; }
        }
      } else {
        if (p.vy <= 0) {
          const y = Math.floor(p.y);
          for (let x = x0; x <= x1; x++) if (this.solid(x, y)) { p.y = y + 1; p.vy = 0; p.on = true; break; }
        } else {
          const y = Math.floor(p.y + PH);
          for (let x = x0; x <= x1; x++) if (this.solid(x, y)) { p.y = y - PH; p.vy = 0; break; }
        }
      }
      // 動く床の上
      if (p.g > 0 && p.vy >= 0) for (let i = 0; i < this.ents.length; i++) {
        const e = this.ents[i]; if (e.k !== 'plat') continue;
        if (p.x + PW > e.x + 0.05 && p.x < e.x + e.w - 0.05 && wasBottom <= e.y + 0.12 && p.y + PH >= e.y) { p.y = e.y - PH; p.vy = 0; p.on = true; p.plat = i; break; }
      }
      if (p.on && !this.wasOn) this.ev('land');
      this.wasOn = p.on;
      void down;
    }
    // ---------- 当たると死ぬもの ----------
    hazard() {
      const p = this.p, x0 = Math.floor(p.x + 0.06), x1 = Math.floor(p.x + PW - 0.06), y0 = Math.floor(p.y + 0.06), y1 = Math.floor(p.y + PH - 0.06);
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
        if (this.hasCorpse(x, y)) continue;
        const c = this.tile(x, y);
        if (c === T.SPIKE) { const bot = p.y + PH, topY = p.y; if (p.g > 0 ? bot > y + 0.42 : topY < y + 0.58) return 'spike'; }
        else if (c === T.POISON) { if (p.y + PH > y + 0.4) return 'poison'; }
        else if (c === T.LAVA) { if (p.y + PH > y + 0.3) return 'lava'; }
      }
      // 流砂：頭まで沈んだら
      if (this.tile(Math.floor(p.x + PW / 2), Math.floor(p.y + 0.15)) === T.SAND) return 'sand';
      // しかけ・敵・ボス
      for (const e of this.ents) { const h = this.entHit(e); if (h) return h; }
      return null;
    }
    // 長方形が人に重なるか
    hitRect(x, y, w, h, m) { const p = this.p; m = m || 0.1; return p.x + PW - m > x && p.x + m < x + w && p.y + PH - m > y && p.y + m < y + h; }
    // ---------- しかけ・敵・ボスを動かす（時刻だけで決まるものと、屍で止まるもの） ----------
    moveEnts() {
      const t = this.t;
      for (const e of this.ents) {
        switch (e.k) {
          case 'plat': {   // 2点の間を行ったり来たり
            const ph = tri(t / e.per + (e.off || 0)), nx = e.x0 + (e.x1 - e.x0) * ph, ny = e.y0 + (e.y1 - e.y0) * ph;
            e.dx = (nx - (e.x === undefined ? nx : e.x)) / DT; e.dy = (ny - (e.y === undefined ? ny : e.y)) / DT; e.x = nx; e.y = ny; e.h = e.h || 0.5; break;
          }
          case 'crush': {  // 落ちてくる天井：上で待つ→落ちる→下で待つ→上がる。屍があるとその上で止まる
            // jam：下の列がすべて屍で埋まる（上限まで積もる）と、屍がはさまって天井が止まる（第16層から）
            if (e.jam) { const jx = e.hx !== undefined ? e.hx : e.x; let full = true, any = false; for (let x = Math.floor(jx); x < Math.ceil(jx + e.w - 0.01); x++) { if (this.cap[x] > 0) { any = true; if (this.col[x] < this.cap[x]) full = false; } } if (any && full) {
              e.jammed = true; e.x = jx; e.y = e.y0; e.falling = false; e.warn = false;
              // zap（第65層から）：止まった天井の下（梯子と、その下の列ぜんぶ）に電気が流れる。1.5秒ごとに0.5秒流れる。流れる0.25秒前に知らせ
              if (e.zap && this.lv.f >= ZAP2) this.zap2(e, t);
              else if (e.zap) { const zf = (t + (e.zo || 0)) % 180; e.zon = zf < 60; e.zwarn = zf >= 150; if (e.zon && !e.st.z) { e.st.z = 1; this.ev('zap', e.x); } if (!e.zon) e.st.z = 0; }
              break;
            } }
            const per = e.per, f = ((t + (e.off || 0)) % per) / per;
            let bot = e.y0 + e.h; { // 下の限界：その下でいちばん上の固いもの
              let lim = this.H; for (let x = Math.floor(e.x); x < Math.ceil(e.x + e.w - 0.01); x++) { for (let y = Math.floor(e.y0 + e.h); y < this.H; y++) if (this.solid(x, y)) { lim = Math.min(lim, y); break; } }
              bot = lim;
            }
            const fall = bot - e.h - e.y0; let y;
            if (e.v2) {
              // 第21層から：上で長く待つ → 落ちる → 下で少し待つ → すばやく上がる（上がる間は当たらない）。落ちる前に知らせる
              //  第28層から：up（上で待つ割合）と wt（知らせの長さ）が層ごとに短くなる
              //  fe：フェイント（知らせの前に途中まで下りて戻る）　tr：追いかけ（知らせのときのプレイヤーの上へ動く）
              const up = e.up || 0.6, a1 = up + 0.08, a2 = a1 + 0.12, a3 = a2 + 0.1, wt = (e.wt || 60) / per;
              if (f < up) y = e.y0; else if (f < a1) y = e.y0 + fall * ((f - up) / 0.08); else if (f < a2) y = e.y0 + fall; else if (f < a3) y = e.y0 + fall * (1 - (f - a2) / 0.1); else y = e.y0;
              if (e.fe && f >= up - wt - 0.16 && f < up - wt - 0.02) { const q = (f - (up - wt - 0.16)) / 0.14; y = e.y0 + fall * 0.4 * (q < 0.5 ? q * 2 : 2 - q * 2); }
              e.falling = f >= up && f < a1; e.kill = f >= up && f < a2; e.warn = f >= up - wt && f < up; e.y = y;
              if (e.tr) {
                const hx = e.hx !== undefined ? e.hx : (e.hx = e.x);
                if (e.warn && e.st.tx === undefined) { const px = this.p.x + PW / 2 - e.w / 2; e.st.tx = Math.max(hx - e.tr, Math.min(hx + e.tr, px)); }
                if (f >= a3 || f < up - wt) e.st.tx = undefined;
                const tx = e.st.tx === undefined ? hx : e.st.tx, dx = tx - e.x, sp = 8 * DT;
                e.x += Math.abs(dx) <= sp ? dx : Math.sign(dx) * sp;
              }
              if (f >= a1 && f < a1 + 0.01 && !e.st.boom) { e.st.boom = 1; this.ev('crush', e.x); } if (f < up) e.st.boom = 0;
            } else {
              if (f < 0.45) y = e.y0; else if (f < 0.55) y = e.y0 + fall * ((f - 0.45) / 0.1); else if (f < 0.7) y = e.y0 + fall; else y = e.y0 + fall * (1 - (f - 0.7) / 0.3);
              e.falling = f >= 0.45 && f < 0.7; e.warn = f >= 0.32 && f < 0.45; e.y = y;
              if (f >= 0.55 && f < 0.56 && !e.st.boom) { e.st.boom = 1; this.ev('crush', e.x); } if (f < 0.5) e.st.boom = 0;
            }
            break;
          }
          case 'saw': { const a = t / e.per + (e.off || 0); e.x = e.cx + dcos(a) * e.r; e.y = e.cy + dsin(a) * e.r; break; }
          case 'jet': { const f = ((t + (e.off || 0)) % e.per) / e.per; e.on = f < 0.4; e.warn = f >= 0.85; break; }
          case 'bolt': { // 雷：知らせ→落ちる。屍や岩の上で止まる
            const f = ((t + (e.off || 0)) % e.per) / e.per; e.warn = f >= 0.7 && f < 0.88; e.on = f >= 0.88 && f < 0.95;
            let yb = this.H; for (let y = 0; y < this.H; y++) if (this.solid(Math.floor(e.x), y)) { yb = y; break; } e.yb = yb;
            if (e.on && !e.st.b) { e.st.b = 1; this.ev('bolt', e.x); } if (!e.on) e.st.b = 0;
            break;
          }
          case 'rise': { // 上がってくる水（毒）：時間がたつほど高くなる
            e.y = Math.max(e.top, e.y0 - (t * DT) * e.sp); break;
          }
          case 'walk': this.walkEnemy(e); break;
          case 'fly': { const a = t / e.per + (e.off || 0); e.x = e.x0 + (e.x1 - e.x0) * tri(t / e.per2 + (e.off || 0)); e.y = e.y0 + dsin(a) * e.amp; break; }
          case 'boss': this.bossMove(e); break;
        }
      }
    }
    // 歩く敵：climb 段までの段差（屍・岩）なら登る。それより高いと引き返す。持ち場（a〜b）から出ない
    walkEnemy(e) {
      const st = e.st;
      if (st.x === undefined) { st.x = e.x; st.y = e.y; st.vx = -(e.sp || 2); st.vy = 0; st.hop = 0; }
      const w = e.w || 0.9, h = e.h || 0.9, d = Math.sign(st.vx), climb = e.climb === undefined ? 1 : e.climb;
      // 下に落ちる（足もとがない）
      let onG = false;
      for (let x = Math.floor(st.x + 0.05); x <= Math.floor(st.x + w - 0.05); x++) if (this.solid(x, Math.floor(st.y + h + 0.02))) onG = true;
      if (!onG) { st.vy = Math.min(18, st.vy + GRAV * DT); st.y += st.vy * DT; const by = Math.floor(st.y + h); for (let x = Math.floor(st.x + 0.05); x <= Math.floor(st.x + w - 0.05); x++) if (this.solid(x, by)) { st.y = by - h; st.vy = 0; } if (st.y > this.H + 2) { st.dead = 1; } e.x = st.x; e.y = st.y; return; }
      st.vy = 0;
      // ときどき跳ねる敵
      if (e.hop && (this.t + (e.off || 0)) % e.hop === 0) st.hopT = 34;
      if (st.hopT > 0) st.hopT--;
      const fx = d > 0 ? Math.floor(st.x + w + 0.02) : Math.floor(st.x - 0.02), footY = Math.floor(st.y + h - 0.01);
      let turn = false;
      // 前の高さ
      let hgt = 0; while (hgt <= climb && this.solid(fx, footY - hgt)) hgt++;
      if (hgt > climb) turn = true;
      else if (hgt > 0) { // 登った先に体が入るすき間があるか
        let free = true; for (let k = 0; k < Math.ceil(h); k++) if (this.solid(fx, footY - hgt - k)) { free = false; break; }
        if (free) { st.y -= hgt; st.x += d * 0.06; } else turn = true;
      }
      else { // 先が深い穴なら引き返す（屍で埋まっていれば進む）
        let deep = 0; for (let k = 1; k <= 3; k++) if (!this.solid(fx, footY + k)) deep++; else break;
        if (deep >= 3 && !e.fall) turn = true;
      }
      const nx = st.x + st.vx * DT;
      if (nx < e.a || nx + w > e.b + 1) turn = true;
      if (turn) st.vx = -st.vx; else st.x = nx;
      e.x = st.x; e.y = st.y - (st.hopT > 0 ? tri(st.hopT / 68) * 2.6 : 0);
    }
    entHit(e) {
      switch (e.k) {
        case 'crush': if (e.jammed) { if (e.zap && this.lv.f >= ZAP2) return e.zon && e.zb !== null && e.zb !== undefined && this.hitRect(e.x + 0.2, e.zb - 0.5, e.w - 0.4, 1.0, 0.15) ? 'zap' : null; return e.zap && e.zon && this.hitRect(e.x, e.y + e.h, e.w, this.H - e.y - e.h, 0.15) ? 'zap' : null; } return (e.v2 ? e.kill : (e.falling || e.y > e.y0 + 0.05)) && this.hitRect(e.x, e.y, e.w, e.h, 0.12) ? 'crush' : null;
        case 'saw': { const p = this.p, dx = p.x + PW / 2 - e.x, dy = p.y + PH / 2 - e.y, r = (e.rad || 0.5) + 0.3; return dx * dx + dy * dy < r * r ? 'saw' : null; }
        case 'jet': if (!e.on) return null; return this.hitRect(e.x, e.dir < 0 ? e.y - e.len + 1 : e.y, 1, e.len, 0.15) ? 'fire' : null;
        case 'bolt': return e.on && this.hitRect(Math.floor(e.x), 0, 1, e.yb, 0.1) ? 'bolt' : null;
        case 'rise': return this.p.y + PH * 0.5 > e.y && this.p.x + PW > e.x0 && this.p.x < e.x1 ? 'water' : null;
        case 'walk': if (e.st.dead) return null; return this.hitRect(e.x, e.y, e.w || 0.9, e.h || 0.9, 0.14) ? 'enemy' : null;
        case 'fly': return this.hitRect(e.x, e.y, e.w || 0.8, e.h || 0.8, 0.14) ? 'enemy' : null;
        case 'boss': { for (const b of (e.hit || [])) if (this.hitRect(b[0], b[1], b[2], b[3], 0.12)) return 'boss'; return null; }
      }
      return null;
    }
    // ---------- ボス：hit に当たり判定の長方形を入れる。warn は知らせ（見た目だけ） ----------
    bossMove(e) {
      const t = this.t, st = e.st, ax = e.ax, bx = e.bx, gy = e.gy;   // 戦う場所（ax〜bx）、地面の高さ gy
      e.hit = []; e.warn = [];
      const B = SH.BOSS[e.fn || 'std']; if (B) B(this, e, t, st, ax, bx, gy);
    }
    // ---------- 死ぬ：屍の置き場所を決めて返す（共有の屍には外で足す） ----------
    die(kind) {
      this.over = true; this.dead = kind;
      const p = this.p;
      let x = Math.floor(p.x + PW / 2), y = Math.floor(p.y + PH / 2);
      x = Math.max(0, Math.min(this.W - 1, x)); y = Math.max(0, Math.min(this.H - 1, y));
      // さかさまの所で死ぬと、屍は上へ「落ちる」
      const up = p.g < 0 || this.tile(x, y) === T.FLIP;
      let vanish = null;
      if (up) {
        let guard = 0; while (y < this.H - 1 && this.solidFor(x, y) && guard++ < this.H) y++;
        for (let k = 0; k < this.H; k++) {
          if (y - 1 < 0) { vanish = 'fall'; break; }
          if (this.solidFor(x, y - 1)) break;
          y--;
        }
      } else {
        // 岩・屍の中なら上へ
        let guard = 0; while (y > 0 && this.solidFor(x, y) && guard++ < this.H) y--;
        // 下へ落ちる：トゲ・溶岩はふさぐ、水は浮く、流砂は沈む、毒は溶ける
        for (let k = 0; k < this.H; k++) {
          const c = this.tile(x, y);
          if (c === T.WATER) { while (y > 0 && this.tile(x, y - 1) === T.WATER && !this.hasCorpse(x, y - 1)) y--; break; } // 水の中なら水面まで浮く
          if (y + 1 >= this.H) { if (c !== T.SPIKE && c !== T.LAVA) vanish = 'fall'; break; } // 底のトゲ・溶岩の上には残る
          if (this.solidFor(x, y + 1)) break;
          if (this.tile(x, y + 1) === T.WATER && c !== T.SAND) { y++; break; }
          y++;
        }
      }
      if (!vanish && !up) while (y > 0 && this.tile(x, y - 1) === T.WATER && !this.hasCorpse(x, y - 1)) y--; // 水の底でも水面へ浮く
      if (this.tile(x, y) === T.POISON) vanish = 'poison';
      if (kind === 'zap' && this.lv.f < ZAP2) vanish = 'zap';   // しびれた屍は残らない（第73層まで。第74層からは、ふつうに残る）
      if (!vanish && this.col[x] >= this.cap[x]) vanish = 'cap';
      if (!vanish && this.hasCorpse(x, y)) { // 同じマス（上に積めない）
        const d = up ? 1 : -1; if (y + d >= 0 && y + d < this.H && !this.solidFor(x, y + d)) y += d; else vanish = 'cap';
      }
      this.ev('die', kind);
      this.place = { x, y, vanish };
      return this.place;
    }
    // 屍にとって固いか（屍が止まる所）。落とし戸は開いていれば通る。消える床は「ある」とみなす
    solidFor(x, y) {
      if (this.hasCorpse(x, y)) return true;
      const c = this.tile(x, y);
      if (c === T.DEEP) return false;
      if (c === T.TRAP) return !this.trap.has(y * this.W + x);
      return c === T.ROCK || c === T.ICE || c === T.BELT_R || c === T.BELT_L || c === T.VANISH || c === T.CLOUD;
    }
  }
  SH.Run = Run;
  // ---------- 入力の記録（変わった所だけ） ----------
  SH.Rec = class {
    constructor() { this.a = []; this.last = -1; }
    put(t, b) { if (b !== this.last) { this.a.push(t, b); this.last = b; } }
    str() { return this.a.map(v => v.toString(36)).join('.'); }
    static parse(s) { const a = String(s || '').split('.').filter(Boolean).map(v => parseInt(v, 36)); let i = 0, cur = 0; return t => { while (i < a.length && a[i] <= t) { cur = a[i + 1]; i += 2; } return cur; }; }
  };
  // リプレイを計算しなおして、ゴールできるか確かめる
  SH.verify = function (lv, corpses, recStr, maxT) {
    const r = new Run(lv, corpses), inp = SH.Rec.parse(recStr), lim = maxT || 120 * 60 * 6;
    while (!r.over && r.t < lim) r.step(inp(r.t + 1));
    return { ok: r.clear, t: r.t, dead: r.dead };
  };
})(typeof window !== 'undefined' ? window : globalThis);
