// =============================================
//  シインクラッド  描く（ドット絵）
//  ・20種の景色（5層ごと）。奥の景色はゆっくり動く
//  ・屍：死んだ人の色の箱に×の目。前に来たときより新しい屍は光る
//  ・上限まで積もった列は、上に赤い印
//  ・番人：わざごとに体を描く。知らせ（赤い点滅）を必ず出す
// =============================================
(function (G) {
  const SH = G.SH, T = SH.T;
  // 景色の色：空の上・空の下・遠景・近景・地面・地面のふち・アクセント
  const PAL = [
    ['#7ec8f0', '#d8f0ff', '#9dd39a', '#6fb46c', '#6b4a32', '#5fbf4a', '#ffe066'], // はじまりの草原
    ['#3d6b5a', '#9cc8a0', '#2f5d43', '#24493a', '#4a3524', '#3f8a46', '#d6f08a'], // ささやきの森
    ['#141a2c', '#2b3550', '#232b44', '#1b2236', '#3c4258', '#5a6688', '#7fd8ff'], // しずくの洞窟
    ['#f6b26b', '#ffe3b0', '#e8a55c', '#d48a43', '#b07a3e', '#e8c27a', '#fff2c0'], // さすらいの砂丘
    ['#6a5a7a', '#c8b8a0', '#7a6a60', '#5c4e48', '#4e4038', '#8a7a62', '#9fe0c0'], // ねむれる遺跡
    ['#a8d8ff', '#f0f8ff', '#8cc0e0', '#6aa8c8', '#5a6a5a', '#7ab890', '#ffffff'], // しずかな湖
    ['#2a3a4a', '#5a7a6a', '#24402e', '#18301f', '#2e2418', '#2d6b3a', '#c8a0ff'], // まよいの森
    ['#1a1a20', '#3a3a44', '#2a2a32', '#202026', '#4a4a52', '#6a6a76', '#ff6a4a'], // くろがね牢獄
    ['#8ab0e8', '#f0f4ff', '#d8e4f8', '#b8cce8', '#8090a8', '#e0e8f8', '#ffe8a0'], // 雲の回廊
    ['#3a2040', '#8a5a7a', '#4a2a4a', '#3a1f3a', '#3a2a2a', '#7a3a8a', '#b0ff60'], // 毒花の庭
    ['#9ec8e8', '#eef6ff', '#c8dcef', '#a8c4de', '#6a7a8e', '#e8f4ff', '#a0f0ff'], // 氷の峰
    ['#3a1010', '#a83a1a', '#5a1a14', '#40100c', '#3a2420', '#8a3a20', '#ffb030'], // 炎の山
    ['#10283a', '#2a5a6a', '#18384a', '#10283a', '#3a4a50', '#4a7a7a', '#60f0d0'], // 沈む水路
    ['#2a2420', '#6a5a44', '#4a3e30', '#3a3024', '#5a4a3a', '#a08050', '#ffd040'], // からくり工房
    ['#05050a', '#12121e', '#0c0c16', '#08080f', '#1c1c26', '#2c2c3e', '#8080ff'], // 闇の底
    ['#1a1a3a', '#4a4a7a', '#2a2a50', '#1e1e3e', '#3a3a50', '#5a5a80', '#fff060'], // 雷雲の道
    ['#2a2a40', '#7a7aa8', '#4a4a6a', '#3a3a58', '#50506a', '#a0a0d0', '#ff80c0'], // 鏡の間
    ['#2a0a2a', '#6a2a1a', '#3a1a3a', '#2a0f2a', '#3a2030', '#8a3a6a', '#40ffb0'], // 混沌の層
    ['#3a70d0', '#c0e0ff', '#a0c8f0', '#80b0e8', '#9a8a7a', '#e8e0d0', '#ffd860'], // 天空の橋
    ['#100818', '#5a2a4a', '#2a1430', '#1e0e24', '#2e2232', '#c8a040', '#ffe080'], // 頂の玉座
  ];
  SH.PAL = PAL;
  const hue = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 360; };
  SH.hue = hue;
  // 疑似乱数（描き分け用。計算には使わない）
  const hr = n => { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296; };

  class View {
    constructor(cv) { this.cv = cv; this.g = cv.getContext('2d'); this.camX = 0; this.camY = 0; this.shake = 0; this.fx = []; this.seen = 0; this.time = 0; }
    resize() {
      const dpr = Math.min(2, G.devicePixelRatio || 1), w = this.cv.clientWidth, h = this.cv.clientHeight;
      this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
      // 縦に16マス＋少しが入る大きさ（横長なら広く見える）
      this.S = Math.max(8, Math.min(Math.floor(this.cv.height / 16.6), Math.floor(this.cv.width / 14)));
      this.vw = this.cv.width / this.S; this.vh = this.cv.height / this.S;
    }
    // 画面の座標 → マス
    toCell(px, py) { const r = this.cv.getBoundingClientRect(), k = this.cv.width / r.width; return [Math.floor((px - r.left) * k / this.S + this.camX), Math.floor((py - r.top) * k / this.S + this.camY)]; }
    follow(x, y, snap) {
      const lv = this.lv, tx = Math.max(0, Math.min(lv.w - this.vw, x - this.vw * 0.38)), ty = this.fitY(y);
      if (snap) { this.camX = tx; this.camY = ty; } else { this.camX += (tx - this.camX) * 0.14; this.camY += (ty - this.camY) * 0.14; }
    }
    // 縦長の画面：層の下に少し地面を見せて、上は空
    fitY(y) { const lv = this.lv; if (this.vh > lv.h) return lv.h - this.vh + Math.min(3.5, (this.vh - lv.h) * 0.5); return Math.max(0, Math.min(lv.h - this.vh, y - this.vh / 2)); }
    setLevel(lv) { this.lv = lv; this.pal = PAL[lv.theme] || PAL[0]; this.bgCache = null; }
    // ---------- 1こま描く ----------
    draw(st) {
      const g = this.g, S = this.S, lv = this.lv, P = this.pal, run = st.run;
      this.time += 1 / 60;
      g.imageSmoothingEnabled = false;
      let sx = 0, sy = 0; if (this.shake > 0) { sx = (Math.random() - 0.5) * this.shake * S * 0.3; sy = (Math.random() - 0.5) * this.shake * S * 0.3; this.shake *= 0.86; if (this.shake < 0.05) this.shake = 0; }
      this.bg(g, P, lv);
      g.save(); g.translate(Math.round(-this.camX * S + sx), Math.round(-this.camY * S + sy));
      const x0 = Math.max(0, Math.floor(this.camX) - 1), x1 = Math.min(lv.w - 1, Math.ceil(this.camX + this.vw) + 1);
      if (this.camY + this.vh > lv.h) { g.fillStyle = P[4]; g.fillRect(Math.floor(this.camX) * S - S, lv.h * S, (this.vw + 3) * S, (this.camY + this.vh - lv.h + 1) * S); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(Math.floor(this.camX) * S - S, lv.h * S, (this.vw + 3) * S, (this.camY + this.vh - lv.h + 1) * S); }
      this.tiles(g, run, x0, x1);
      this.goal(g, lv);
      this.corpses(g, st, x0, x1);
      if (run) this.ents(g, run, x0, x1);
      if (st.ghost) this.cube(g, st.ghost.x, st.ghost.y, st.ghost.name, 0.45, st.ghost.face);
      if (run && !run.dead && st.showPlayer !== false) this.cube(g, run.p.x, run.p.y, st.name, 1, run.p.face, run.p.g);
      this.effects(g);
      g.restore();
      if (lv.dark) this.darkness(g, run, st);
    }
    bg(g, P, lv) {
      const W = this.cv.width, H = this.cv.height, S = this.S;
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, P[0]); gr.addColorStop(1, P[1]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const th = lv.theme, far = this.camX * S * 0.15, mid = this.camX * S * 0.35;
      // 遠くの形（景色ごとに描き分け）
      const step = S * 3;
      g.fillStyle = P[2];
      for (let i = -1; i < W / step + 2; i++) {
        const k = Math.floor(far / step) + i, x = k * step - far, r = hr(k * 7 + th);
        let hh;
        switch (th % 5) {
          case 0: hh = (0.25 + r * 0.25) * H; g.beginPath(); g.ellipse(x, H * 0.82, step * 1.1, hh, 0, Math.PI, 0); g.fill(); break;   // 丘
          case 1: hh = (0.3 + r * 0.3) * H; g.fillRect(x + step * 0.42, H - hh, step * 0.16, hh); g.beginPath(); g.moveTo(x - step * 0.1, H - hh * 0.55); g.lineTo(x + step * 0.5, H - hh - S); g.lineTo(x + step * 1.1, H - hh * 0.55); g.fill(); break; // 木
          case 2: hh = (0.15 + r * 0.25) * H; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + step * 0.5, hh); g.lineTo(x + step, 0); g.fill(); break; // つらら
          case 3: hh = (0.2 + r * 0.35) * H; g.fillRect(x + step * 0.1, H - hh, step * 0.5, hh); g.fillRect(x + step * 0.05, H - hh, step * 0.6, S * 0.4); break; // 柱・塔
          case 4: hh = (0.1 + r * 0.2) * H; g.beginPath(); g.ellipse(x, H * 0.3 + r * H * 0.2, step * 0.9, hh * 0.35, 0, 0, Math.PI * 2); g.fill(); break; // 雲
        }
      }
      g.fillStyle = P[3]; g.globalAlpha = 0.85;
      const step2 = S * 2;
      for (let i = -1; i < W / step2 + 2; i++) { const k = Math.floor(mid / step2) + i, x = k * step2 - mid, r = hr(k * 13 + th * 3); const hh = (0.08 + r * 0.14) * H; g.fillRect(Math.round(x), Math.round(H - hh - S * 4.5), Math.ceil(step2 * 0.7), Math.ceil(hh + S * 4.5)); }
      g.globalAlpha = 1;
      // ちらつく粒（星・ほたる・火の粉・雪）
      const n = [0, 18, 0, 0, 6, 0, 14, 0, 0, 20, 30, 26, 10, 0, 40, 6, 12, 22, 0, 30][th];
      for (let i = 0; i < n; i++) {
        const r1 = hr(i * 31 + th), r2 = hr(i * 17 + th * 5), sp = th === 10 ? 0.06 : th === 11 ? -0.05 : 0;
        const x = ((r1 * W - far * 0.5 + W * 4) % W), y = ((r2 * H + this.time * sp * H + H * 4) % H);
        g.globalAlpha = 0.35 + 0.35 * Math.sin(this.time * 2 + i); g.fillStyle = P[6]; g.fillRect(Math.round(x), Math.round(y), Math.max(2, S * 0.1), Math.max(2, S * 0.1));
      }
      g.globalAlpha = 1;
    }
    tiles(g, run, x0, x1) {
      const lv = this.lv, S = this.S, P = this.pal, tl = lv.tiles, W = lv.w, H = lv.h, t = this.time;
      const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x * S), Math.round(y * S), Math.ceil(w * S), Math.ceil(h * S)); };
      for (let x = x0; x <= x1; x++) {
        for (let y = 0; y < H; y++) {
          const c = tl[y * W + x]; if (!c) continue;
          const top = y === 0 || !tl[(y - 1) * W + x] || tl[(y - 1) * W + x] >= T.WIND_R;
          switch (c) {
            case T.ROCK: {
              rect(x, y, 1, 1, P[4]);
              const r = hr(x * 131 + y * 7); g.fillStyle = 'rgba(0,0,0,.18)'; if (r < 0.5) g.fillRect(Math.round((x + 0.2 + r) * S), Math.round((y + 0.3) * S), Math.ceil(S * 0.18), Math.ceil(S * 0.12));
              if (top) { rect(x, y, 1, 0.22, P[5]); if (hr(x * 3) < 0.4) rect(x + 0.3, y - 0.1, 0.12, 0.12, P[5]); }
              break;
            }
            case T.ICE: rect(x, y, 1, 1, '#bfe6f6'); rect(x, y, 1, 0.18, '#ffffff'); rect(x + 0.6, y + 0.3, 0.12, 0.4, 'rgba(255,255,255,.6)'); break;
            case T.SAND: rect(x, y, 1, 1, '#d8b26a'); rect(x + ((t * 0.6 + x * 0.3) % 1), y + 0.2, 0.15, 0.08, '#b8904a'); break;
            case T.SPIKE: {
              if (run && run.hasCorpse(x, y)) break;
              const up = !(y > 0 && (tl[(y - 1) * W + x] === T.ROCK)) || y === H - 1 || tl[(y + 1) * W + x] === T.ROCK;
              g.fillStyle = '#d8dce8';
              for (let k = 0; k < 2; k++) { g.beginPath(); const bx = (x + k * 0.5) * S; if (up) { g.moveTo(bx, (y + 1) * S); g.lineTo(bx + S * 0.25, (y + 0.3) * S); g.lineTo(bx + S * 0.5, (y + 1) * S); } else { g.moveTo(bx, y * S); g.lineTo(bx + S * 0.25, (y + 0.7) * S); g.lineTo(bx + S * 0.5, y * S); } g.fill(); }
              g.fillStyle = '#8a90a8'; if (up) g.fillRect(x * S, Math.round((y + 0.86) * S), S, Math.ceil(S * 0.14));
              break;
            }
            case T.LAVA: { if (run && run.hasCorpse(x, y)) break; rect(x, y + 0.25, 1, 0.75, '#e84a1a'); rect(x, y + 0.25 + Math.sin(t * 3 + x) * 0.05, 1, 0.12, '#ffb030'); break; }
            case T.WATER: g.globalAlpha = 0.6; rect(x, y, 1, 1, '#3a8ad8'); g.globalAlpha = 1; if (top) rect(x, y + Math.sin(t * 2 + x * 0.8) * 0.05, 1, 0.1, '#a8e0ff'); break;
            case T.POISON: rect(x + 0.15, y + 0.4, 0.7, 0.6, '#7a3a8a'); rect(x + 0.05, y + 0.3, 0.9, 0.2, '#b0ff60'); rect(x + 0.4, y + 0.15 + Math.sin(t * 4 + x) * 0.05, 0.2, 0.2, '#e080ff'); break;
            case T.VANISH: { const on = run ? run.vanishOn(x) : true, ph = run ? ((run.t + (x * 37) % 300) % 300) : 0; g.globalAlpha = on ? (ph > 160 ? 0.4 + 0.3 * Math.sin(t * 30) : 1) : 0.15; rect(x, y, 1, 0.5, '#a07ad8'); rect(x, y, 1, 0.12, '#d8c0ff'); g.globalAlpha = 1; break; }
            case T.TRAP: { const open = run && run.trap.has(y * W + x); if (!open) { rect(x, y, 1, 0.35, '#8a6a3a'); rect(x + 0.1, y + 0.1, 0.8, 0.08, '#5a3a1a'); } break; }
            case T.BELT_R: case T.BELT_L: { rect(x, y, 1, 1, '#4a4a52'); const d = c === T.BELT_R ? 1 : -1, o = ((t * 1.6 * d) % 0.5 + 0.5) % 0.5; for (let k = -1; k < 2; k++) rect(x + o + k * 0.5, y + 0.08, 0.22, 0.12, '#e8c040'); break; }
            case T.CLOUD: g.globalAlpha = 0.95; rect(x - 0.05, y, 1.1, 0.4, '#ffffff'); rect(x + 0.15, y - 0.12, 0.5, 0.15, '#ffffff'); g.globalAlpha = 1; break;
            case T.WIND_R: case T.WIND_L: { const d = c === T.WIND_R ? 1 : -1, o = (((t * 3 + hr(y * 9) * 3) * d) % 1 + 1) % 1; g.globalAlpha = 0.35; rect(x + o, y + 0.4 + hr(x + y * 5) * 0.3, 0.4, 0.05, '#ffffff'); g.globalAlpha = 1; break; }
            case T.FLIP: g.globalAlpha = 0.12 + 0.05 * Math.sin(t * 2 + x); rect(x, y, 1, 1, '#ff80c0'); g.globalAlpha = 1; break;
            case T.UP: g.globalAlpha = 0.3; rect(x + 0.4, y + ((-t * 2) % 1 + 1) % 1, 0.08, 0.3, '#ffffff'); g.globalAlpha = 1; break;
          }
        }
        // 積める上限の印（屍が上限まで積もった列）
        if (run && lv.cap[x] > 0 && run.col[x] >= lv.cap[x]) {
          let topY = H; for (let y = 0; y < H; y++) if (run.hasCorpse(x, y)) { topY = y; break; }
          g.fillStyle = 'rgba(255,60,60,' + (0.55 + 0.25 * Math.sin(t * 4)) + ')'; g.fillRect(Math.round((x + 0.1) * S), Math.round((topY - 0.3) * S), Math.ceil(S * 0.8), Math.ceil(S * 0.1));
        }
      }
    }
    goal(g, lv) {
      const S = this.S, x = lv.goal, gy = 11, t = this.time;
      g.fillStyle = '#e8e0c8'; g.fillRect(x * S, (gy - 4) * S, S * 0.25, S * 4);
      g.fillStyle = this.pal[6]; const w = Math.sin(t * 3) * 0.1;
      g.beginPath(); g.moveTo((x + 0.25) * S, (gy - 4) * S); g.lineTo((x + 1.6 + w) * S, (gy - 3.6) * S); g.lineTo((x + 0.25) * S, (gy - 3.1) * S); g.fill();
      // 光の門
      g.globalAlpha = 0.18 + 0.08 * Math.sin(t * 2); g.fillStyle = '#ffffff'; g.fillRect((x + 0.5) * S, 0, S * 3, gy * S); g.globalAlpha = 1;
    }
    corpses(g, st, x0, x1) {
      const lv = this.lv, W = lv.w, S = this.S;
      for (const [k, c] of st.cor) {
        const x = k % W; if (x < x0 || x > x1) continue; const y = Math.floor(k / W);
        this.cube(g, x + 0.04, y + 0.04, c.last || '名無し', 1, 1, 1, true, c.n, st.since && c.t > st.since);
      }
      if (st.pick) { const [px, py] = st.pick; g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(px * S + 1, py * S + 1, S - 2, S - 2); }
    }
    // 箱（人・屍）
    cube(g, x, y, name, a, face, grav, dead, n, fresh) {
      const S = this.S, s = dead ? 0.92 : SH.PHYS.PW, h = hue(name);
      const X = Math.round(x * S), Y = Math.round(y * S), w = Math.round(s * S);
      g.globalAlpha = a;
      if (fresh) { g.fillStyle = 'rgba(255,240,120,' + (0.35 + 0.25 * Math.sin(this.time * 5)) + ')'; g.fillRect(X - 3, Y - 3, w + 6, w + 6); }
      g.fillStyle = dead ? `hsl(${h},28%,42%)` : `hsl(${h},70%,58%)`; g.fillRect(X, Y, w, w);
      g.fillStyle = dead ? `hsl(${h},28%,52%)` : `hsl(${h},80%,72%)`; g.fillRect(X, Y, w, Math.max(2, Math.round(w * 0.18)));
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(X, Y + w - Math.max(2, Math.round(w * 0.14)), w, Math.max(2, Math.round(w * 0.14)));
      const ey = Y + (grav < 0 ? w * 0.6 : w * 0.38), ex = X + w * (face < 0 ? 0.3 : 0.55), e = Math.max(2, Math.round(w * 0.13));
      g.fillStyle = '#1a1520';
      if (dead) { // ×の目
        g.strokeStyle = '#1a1520'; g.lineWidth = Math.max(1.5, w * 0.07);
        for (const cx of [X + w * 0.32, X + w * 0.68]) { g.beginPath(); g.moveTo(cx - e, ey - e); g.lineTo(cx + e, ey + e); g.moveTo(cx + e, ey - e); g.lineTo(cx - e, ey + e); g.stroke(); }
        if (n > 1) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(X + w - Math.round(w * 0.3), Y + w - Math.round(w * 0.3), Math.round(w * 0.3), Math.round(w * 0.3)); }
      } else { g.fillRect(Math.round(ex), Math.round(ey), e, e + 1); g.fillRect(Math.round(ex + w * 0.22), Math.round(ey), e, e + 1); }
      g.globalAlpha = 1;
    }
    ents(g, run, x0, x1) {
      const S = this.S, t = this.time;
      const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x * S), Math.round(y * S), Math.ceil(w * S), Math.ceil(h * S)); };
      const blink = 0.5 + 0.5 * Math.sin(t * 18);
      for (const e of run.ents) {
        const ex = e.x !== undefined ? e.x : (e.x0 !== undefined ? e.x0 : (e.cx || e.ax || 0));
        if (e.k !== 'boss' && e.k !== 'rise' && (ex < x0 - 6 || ex > x1 + 6)) continue;
        switch (e.k) {
          case 'plat': rect(e.x, e.y, e.w, e.h, '#a07a4a'); rect(e.x, e.y, e.w, 0.12, '#d8b070'); break;
          case 'crush': {
            if (e.jammed) { // 屍がはさまって止まった天井：下まで屍のつっかえ棒、鎖はゆるむ
              rect(e.x + e.w * 0.4, 0, e.w * 0.2, e.y, '#3a3a3a'); rect(e.x, e.y, e.w, e.h, '#4a4a52'); rect(e.x + 0.1, e.y + e.h, e.w - 0.2, 0.12, '#8a6a4a');
              let gy0 = this.lv.h; for (let yy = Math.floor(e.y + e.h); yy < this.lv.h; yy++) if (run.solid(Math.floor(e.x), yy)) { gy0 = yy; break; }
              if (e.lad) { // はしご
                const hh = Math.max(0, gy0 - e.y - e.h), lx = e.x + 0.3, lw = e.w - 0.6;
                rect(lx, e.y + e.h, 0.12, hh, '#c89a5a'); rect(lx + lw - 0.12, e.y + e.h, 0.12, hh, '#c89a5a');
                for (let yy = e.y + e.h + 0.3; yy < gy0; yy += 0.5) rect(lx, yy, lw, 0.1, '#e0b878');
              } else for (let k = 0; k < 2; k++) rect(e.x + 0.25 + k * (e.w - 0.75), e.y + e.h, 0.25, Math.max(0, gy0 - e.y - e.h), 'rgba(160,130,100,.75)');
              break;
            }
            if (e.warn) { g.globalAlpha = 0.25 + 0.3 * blink; rect(e.x, e.y + e.h, e.w, 11 - e.y - e.h, '#ff3030'); g.globalAlpha = 1; }
            rect(e.x + e.w * 0.4, 0, e.w * 0.2, e.y, '#555'); rect(e.x, e.y, e.w, e.h, '#6a6a76'); rect(e.x, e.y + e.h - 0.2, e.w, 0.2, '#c8c8d8');
            for (let k = 0; k < e.w * 2; k++) { g.fillStyle = '#d8dce8'; g.beginPath(); g.moveTo((e.x + k * 0.5) * S, (e.y + e.h) * S); g.lineTo((e.x + k * 0.5 + 0.25) * S, (e.y + e.h + 0.3) * S); g.lineTo((e.x + k * 0.5 + 0.5) * S, (e.y + e.h) * S); g.fill(); }
            break;
          }
          case 'saw': { g.save(); g.translate(e.x * S, e.y * S); g.rotate(t * 12); g.fillStyle = '#c8ccd8'; const r = (e.rad || 0.5) * S; for (let k = 0; k < 8; k++) { g.rotate(Math.PI / 4); g.fillRect(-r * 0.15, -r * 1.15, r * 0.3, r * 0.5); } g.beginPath(); g.arc(0, 0, r * 0.85, 0, 7); g.fill(); g.fillStyle = '#555'; g.beginPath(); g.arc(0, 0, r * 0.25, 0, 7); g.fill(); g.restore(); break; }
          case 'jet': { rect(e.x + 0.15, e.y + 0.6, 0.7, 0.4, '#555'); if (e.warn) { g.globalAlpha = 0.5 * blink; rect(e.x, e.y - e.len + 1, 1, e.len, '#ff8030'); g.globalAlpha = 1; } if (e.on) { for (let k = 0; k < e.len; k++) { rect(e.x + 0.15 + Math.sin(t * 30 + k) * 0.05, e.y - k, 0.7, 1, k % 2 ? '#ffb030' : '#ff5a1a'); } } break; }
          case 'bolt': { if (e.warn) { g.globalAlpha = 0.35 * blink; rect(Math.floor(e.x), 0, 1, e.yb, '#fff060'); g.globalAlpha = 1; rect(Math.floor(e.x) - 0.5, 0, 2, 0.6, '#5a5a80'); } if (e.on) { g.strokeStyle = '#fffbd0'; g.lineWidth = S * 0.18; g.beginPath(); let xx = Math.floor(e.x) + 0.5; g.moveTo(xx * S, 0); for (let y = 1; y <= e.yb; y++) { xx = Math.floor(e.x) + 0.5 + (hr(y * 7 + run.t) - 0.5) * 0.6; g.lineTo(xx * S, y * S); } g.stroke(); } break; }
          case 'rise': { g.globalAlpha = 0.55; rect(e.x0, e.y, e.x1 - e.x0, 20, '#2aa8a0'); g.globalAlpha = 1; rect(e.x0, e.y, e.x1 - e.x0, 0.12, '#80fff0'); break; }
          case 'walk': {
            if (e.st.dead) break; const w = e.w || 0.9, h = e.h || 0.9, d = e.st.vx > 0 ? 1 : -1, big = w > 1;
            rect(e.x, e.y + h * 0.2, w, h * 0.8, big ? '#8a2a3a' : '#c84a4a'); rect(e.x + w * 0.1, e.y, w * 0.8, h * 0.3, big ? '#a83a4a' : '#e86a5a');
            rect(e.x + w * (d > 0 ? 0.6 : 0.15), e.y + h * 0.3, w * 0.22, h * 0.2, '#fff'); rect(e.x + w * (d > 0 ? 0.68 : 0.2), e.y + h * 0.34, w * 0.1, h * 0.12, '#000');
            const leg = Math.sin(t * 14 + ex) > 0; rect(e.x + w * 0.1, e.y + h - 0.1, w * 0.25, 0.1 + (leg ? 0.05 : 0), '#4a1a1a'); rect(e.x + w * 0.65, e.y + h - 0.1, w * 0.25, 0.1 + (leg ? 0 : 0.05), '#4a1a1a');
            if (e.climb >= 2) { rect(e.x + w * 0.2, e.y - 0.15, 0.12, 0.2, '#ffd040'); rect(e.x + w * 0.7, e.y - 0.15, 0.12, 0.2, '#ffd040'); }
            break;
          }
          case 'fly': { const w = e.w || 0.8, fl = Math.sin(t * 20) > 0; rect(e.x + 0.1, e.y + 0.2, w - 0.2, 0.5, '#6a3a8a'); rect(e.x - 0.15, e.y + (fl ? 0 : 0.25), 0.35, 0.2, '#b08ad8'); rect(e.x + w - 0.2, e.y + (fl ? 0 : 0.25), 0.35, 0.2, '#b08ad8'); rect(e.x + 0.25, e.y + 0.35, 0.12, 0.12, '#ff4040'); rect(e.x + 0.45, e.y + 0.35, 0.12, 0.12, '#ff4040'); break; }
          case 'boss': this.boss(g, e, rect, blink); break;
        }
      }
    }
    // ---------- 番人 ----------
    boss(g, e, rect, blink) {
      const S = this.S, t = this.time;
      // 戦う場所の床に模様（入り口の目印）
      g.globalAlpha = 0.25; rect(e.ax - 0.5, e.gy - 0.06, 0.2, 0.06, '#fff'); g.globalAlpha = 1;
      for (const w of (e.warn || [])) { g.globalAlpha = 0.18 + 0.35 * blink; rect(w[0], w[1], w[2], w[3], '#ff2a2a'); g.globalAlpha = 1; }
      if (e.shake) this.shake = Math.max(this.shake, 0.6);
      if (e.sleep) { // 眠っている番人（入るまで）
        const p = e.parts[0], w = p.w || 3, h = p.h || 3; g.globalAlpha = 0.6; this.monster(g, e.bx - w - 1, e.gy - h, w, h, p.look || 'beast', -1, true); g.globalAlpha = 1;
        g.fillStyle = '#fff'; g.font = `${Math.round(S * 0.6)}px DotGothic16, monospace`; g.fillText('z', (e.bx - w * 0.3) * S, (e.gy - h - 0.3 + Math.sin(t * 2) * 0.2) * S);
        return;
      }
      for (const b of (e.body || [])) {
        switch (b.kind) {
          case 'rock': rect(b.x, b.y, b.w, b.h, '#7a6a5a'); rect(b.x + 0.1, b.y + 0.1, b.w * 0.4, b.h * 0.3, '#a89880'); break;
          case 'arm': rect(b.x, b.y, b.w, b.h, '#c8a050'); rect(b.x, b.y, b.w, b.h * 0.3, '#ffe0a0'); rect(b.x + (b.w * 0.9), b.y - 0.1, 0.4, b.h + 0.2, '#e8c070'); break;
          case 'jaws': { rect(b.x, b.y, b.w, b.h, '#5a2030'); g.fillStyle = '#fff'; for (let k = 0; k < b.w * 2; k++) { g.beginPath(); g.moveTo((b.x + k * 0.5) * S, b.y * S); g.lineTo((b.x + k * 0.5 + 0.25) * S, (b.y + 0.4) * S); g.lineTo((b.x + k * 0.5 + 0.5) * S, b.y * S); g.fill(); } rect(b.x + 0.3, b.y + 0.6, 0.3, 0.3, '#ffd040'); rect(b.x + b.w - 0.6, b.y + 0.6, 0.3, 0.3, '#ffd040'); break; }
          case 'slash': g.globalAlpha = 0.85; rect(b.x + 0.3, b.y, b.w - 0.6, b.h, '#ffffff'); rect(b.x, b.y, b.w, b.h, 'rgba(255,80,80,.4)'); g.globalAlpha = 1; break;
          case 'snake': case 'snakeH': { const hc = 120 + (e.type * 23) % 120; rect(b.x, b.y, b.w, b.h, `hsl(${hc},45%,35%)`); rect(b.x + 0.1, b.y + 0.1, b.w - 0.2, 0.25, `hsl(${hc},55%,50%)`); if (b.kind === 'snakeH') { rect(b.x + (b.face > 0 ? 0.55 : 0.15), b.y + 0.3, 0.2, 0.2, '#ffe040'); rect(b.x + (b.face > 0 ? 0.95 : -0.25), b.y + 0.6, 0.3, 0.08, '#ff4060'); } break; }
          default: this.monster(g, b.x, b.y, b.w, b.h, b.kind, b.face, false, e.type);
        }
      }
    }
    // 大きな番人の体（形ごとに少しずつ描き分ける）
    monster(g, x, y, w, h, kind, face, sleep, type) {
      const S = this.S, t = this.time, rect = (a, b, c, d, col) => { g.fillStyle = col; g.fillRect(Math.round(a * S), Math.round(b * S), Math.ceil(c * S), Math.ceil(d * S)); };
      const C = {
        hound: ['#4a7a3a', '#7ab05a'], giant: ['#7a6a5a', '#a89880'], beetle: ['#a8803a', '#d8b060'], golem: ['#6a6a6a', '#9a9a9a'], twin: ['#8a8070', '#b8b0a0'],
        stag: ['#6a4a3a', '#a07858'], warden: ['#3a3a44', '#6a6a7a'], eagle: ['#8a6a4a', '#e8e0d0'], buddha: ['#b08a30', '#ffd860'], wolf: ['#8ab0d0', '#e0f0ff'],
        thunder: ['#4a4a8a', '#fff060'], mirror: ['#a0a0d0', '#ffffff'], robot: ['#8a6a3a', '#e8c040'], reaper: ['#2a2a30', '#d8d8e0'], dragon: ['#3a7ab0', '#a0d8ff'], king: ['#3a1a4a', '#ffd860'], beast: ['#6a3a3a', '#a85a5a'],
      }[kind] || ['#6a3a3a', '#a85a5a'];
      const bob = sleep ? 0 : Math.sin(t * 6) * 0.05, d = face || -1;
      const walker = ['hound', 'wolf', 'stag', 'giant', 'golem', 'beetle', 'warden', 'thunder', 'mirror', 'robot', 'beast'].includes(kind);
      const legH = walker ? Math.min(0.5, h * 0.22) : 0, bh = h - legH;
      // 影
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(Math.round((x + 0.1) * S), Math.round((y + h - 0.08) * S), Math.ceil((w - 0.2) * S), Math.ceil(0.12 * S));
      // 足（歩くと動く）
      if (walker) { const ph = sleep ? 0 : Math.sin(t * 12) * 0.12; const n = w >= 2 ? 4 : 2; for (let i = 0; i < n; i++) { const lx = x + w * (0.1 + i * (0.8 / Math.max(1, n - 1))) - 0.1, up = (i % 2 ? ph : -ph); rect(lx, y + bh + bob - 0.05 + Math.max(0, up), 0.22, legH + 0.05 - Math.max(0, up), C[0]); rect(lx - 0.03, y + h - 0.1, 0.3, 0.1, 'rgba(0,0,0,.35)'); } }
      // 体（ふちどり）
      rect(x - 0.06, y + h * 0.12 + bob - 0.06, w + 0.12, bh - h * 0.12 + 0.12, 'rgba(10,6,14,.55)');
      rect(x, y + h * 0.12 + bob, w, bh - h * 0.12, C[0]);
      rect(x + w * 0.06, y + bob, w * 0.88, h * 0.3, C[1]);
      rect(x, y + bh * 0.8 + bob, w, bh * 0.2, 'rgba(0,0,0,.18)');
      // 口（牙）
      if (!sleep) { const mx = x + w * (d > 0 ? 0.55 : 0.12), my = y + h * 0.55 + bob, mw = w * 0.33; rect(mx, my, mw, h * 0.1, '#2a0a10'); g.fillStyle = '#fff'; for (let k = 0; k < 3; k++) { g.beginPath(); const tx = (mx + mw * (k + 0.5) / 3) * S; g.moveTo(tx - S * 0.07, my * S); g.lineTo(tx, (my + h * 0.08) * S); g.lineTo(tx + S * 0.07, my * S); g.fill(); } }
      // 目
      const ey = y + h * 0.32 + bob, ew = Math.max(0.18, w * 0.12);
      if (sleep) { rect(x + w * 0.25, ey + 0.1, ew * 1.2, 0.08, '#000'); rect(x + w * 0.6, ey + 0.1, ew * 1.2, 0.08, '#000'); }
      else {
        const glow = kind === 'reaper' || kind === 'king' || kind === 'thunder' ? '#ff3030' : '#ffe040';
        rect(x + w * (d > 0 ? 0.55 : 0.2), ey, ew, ew, glow); rect(x + w * (d > 0 ? 0.78 : 0.42), ey, ew, ew, glow);
        rect(x + w * (d > 0 ? 0.55 : 0.2) + ew * (d > 0 ? 0.5 : 0), ey + ew * 0.3, ew * 0.5, ew * 0.5, '#1a0a10'); rect(x + w * (d > 0 ? 0.78 : 0.42) + ew * (d > 0 ? 0.5 : 0), ey + ew * 0.3, ew * 0.5, ew * 0.5, '#1a0a10');
      }
      // 形ごとの飾り
      switch (kind) {
        case 'hound': case 'wolf': rect(x + w * (d > 0 ? 0.8 : 0), y + h * 0.5 + bob, w * 0.2, h * 0.15, '#fff'); rect(x + w * 0.1, y - 0.25 + bob, w * 0.15, 0.3, C[0]); rect(x + w * 0.75, y - 0.25 + bob, w * 0.15, 0.3, C[0]); break;
        case 'stag': for (const s of [0.2, 0.7]) { rect(x + w * s, y - 0.8, 0.12, 0.8, '#e8d8b0'); rect(x + w * s - 0.25, y - 0.6, 0.6, 0.1, '#e8d8b0'); } break;
        case 'giant': case 'golem': case 'twin': rect(x + w * 0.1, y + h * 0.65, w * 0.8, 0.12, 'rgba(0,0,0,.3)'); rect(x - 0.2, y + h * 0.35, 0.3, h * 0.5, C[1]); rect(x + w - 0.1, y + h * 0.35, 0.3, h * 0.5, C[1]); break;
        case 'buddha': for (let k = 0; k < 6; k++) { const a = t * 1.5 + k; rect(x + w / 2 + Math.cos(a) * w * 0.7 - 0.2, y + h * 0.5 + Math.sin(a) * h * 0.4, 0.4, 0.4, C[1]); } rect(x + w * 0.3, y - 0.3, w * 0.4, 0.3, '#ffd860'); break;
        case 'warden': rect(x + w * 0.2, y - 0.2, w * 0.6, 0.25, '#888'); rect(x - 0.1, y + h * 0.5, w + 0.2, 0.15, '#888'); break;
        case 'eagle': case 'dragon': { const f = Math.sin(t * 8) * 0.4; rect(x - w * 0.5, y + h * 0.3 + f, w * 0.5, 0.3, C[1]); rect(x + w, y + h * 0.3 + f, w * 0.5, 0.3, C[1]); break; }
        case 'thunder': for (let k = 0; k < 4; k++) rect(x + w * (0.1 + k * 0.25), y - 0.3 + (k % 2) * 0.15, 0.15, 0.3, '#fff060'); break;
        case 'mirror': g.globalAlpha = 0.5; rect(x + w * 0.1, y + h * 0.2, w * 0.15, h * 0.6, '#fff'); g.globalAlpha = 1; break;
        case 'robot': rect(x + w * 0.45, y - 0.5, 0.1, 0.5, '#888'); rect(x + w * 0.4, y - 0.65, 0.2, 0.2, (Math.sin(t * 10) > 0) ? '#ff4040' : '#600'); break;
        case 'reaper': case 'king': rect(x + w * 0.15, y - 0.35, w * 0.7, 0.35, kind === 'king' ? '#ffd860' : '#555'); if (kind === 'king') for (let k = 0; k < 3; k++) rect(x + w * (0.2 + k * 0.25), y - 0.6, 0.18, 0.3, '#ffd860'); break;
      }
      void type;
    }
    // ---------- こまかい演出 ----------
    burst(x, y, col, n) { for (let i = 0; i < (n || 12); i++) this.fx.push({ x, y, vx: (Math.random() - 0.5) * 8, vy: -Math.random() * 7 - 1, life: 0.6 + Math.random() * 0.4, col }); }
    ring(x, y, col) { this.fx.push({ ring: 1, x, y, r: 0.2, life: 0.5, col }); }
    effects(g) {
      const S = this.S, dt = 1 / 60;
      this.fx = this.fx.filter(f => (f.life -= dt) > 0);
      for (const f of this.fx) {
        g.globalAlpha = Math.min(1, f.life * 2);
        if (f.ring) { f.r += dt * 4; g.strokeStyle = f.col; g.lineWidth = S * 0.1; g.strokeRect((f.x - f.r) * S, (f.y - f.r) * S, f.r * 2 * S, f.r * 2 * S); }
        else { f.vy += 18 * dt; f.x += f.vx * dt; f.y += f.vy * dt; g.fillStyle = f.col; g.fillRect(Math.round(f.x * S), Math.round(f.y * S), Math.max(2, S * 0.14), Math.max(2, S * 0.14)); }
      }
      g.globalAlpha = 1;
    }
    // 闇の底：自分のまわりだけ見える
    darkness(g, run, st) {
      const S = this.S, W = this.cv.width, H = this.cv.height;
      const p = run && !run.dead ? run.p : (st.ghost || { x: this.camX + this.vw * 0.38, y: 8 });
      const cx = (p.x + 0.4 - this.camX) * S, cy = (p.y + 0.4 - this.camY) * S;
      const gr = g.createRadialGradient(cx, cy, S * 2, cx, cy, S * 7.5); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.94)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
  }
  SH.View = View;
})(typeof window !== 'undefined' ? window : globalThis);
