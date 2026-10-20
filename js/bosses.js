// =============================================
//  シインクラッド  番人（ボス）
//  ・倒せない。よけて通る。屍の壁や屍の足場で、止めたり、よけたりできる
//  ・番人はいくつかの「わざ」の組み合わせ。e.parts に並べる
//    beast：大きな体で歩く（climb 段までの屍なら越える。それより高いと引き返す）
//    snake：体が何マスもつながって地面をうねる
//    rocks：知らせのあと、ねらった列に岩が落ちる（屍・岩の上で止まる）
//    quake：地面をたたいて、地面すれすれに衝撃が走る（ジャンプか、屍の上でよける）
//    sweep：腕が横になぎ払う（低いのはとぶ、高いのは地面にいる）
//    jaws ：知らせの場所の地面から、大きな口が飛び出す
//    blade：天井をはう番人が、真下に刃を落とす（屍の屋根で止まる）
// =============================================
(function (G) {
  const SH = G.SH, DT = SH.DT;
  const hash = n => { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; };
  const tri = p => { const f = p - Math.floor(p); return f < 0.5 ? f * 2 : 2 - f * 2; };
  // 地面（その列でいちばん上の固いもの）の高さ
  const groundY = (r, x, from) => { for (let y = from || 0; y < r.H; y++) if (r.solid(x, y)) return y; return r.H; };
  const PART = {
    beast(r, e, q, t, st, ax, bx, gy) {
      if (st.x === undefined) { st.x = q.x !== undefined ? q.x : bx - q.w - 1; st.y = gy - q.h; st.vx = -q.sp; st.hopT = 0; }
      const d = Math.sign(st.vx), fx = d > 0 ? Math.floor(st.x + q.w + 0.02) : Math.floor(st.x - 0.02);
      // 足もと
      let gnd = r.H; for (let x = Math.floor(st.x + 0.05); x <= Math.floor(st.x + q.w - 0.05); x++) gnd = Math.min(gnd, groundY(r, x, Math.max(0, Math.floor(st.y + q.h - 0.5))));
      if (st.y + q.h < gnd - 0.01) st.y = Math.min(gnd - q.h, st.y + 12 * DT);
      // 前の段差
      const foot = Math.floor(st.y + q.h - 0.01); let hgt = 0; while (hgt <= q.climb && r.solid(fx, foot - hgt)) hgt++;
      let turn = hgt > q.climb;
      if (!turn && hgt > 0) { st.y -= hgt; st.x += d * 0.06; }
      const nx = st.x + st.vx * DT * (q.rush && st.rushT > 0 ? 2.4 : 1);
      if (nx < ax || nx + q.w > bx) turn = true;
      if (turn) { st.vx = -st.vx; r.ev('turn', st.x); } else st.x = nx;
      // ときどき跳ねる・突進
      if (q.hop && (t % q.hop) === 0) st.hopT = 50;
      if (q.rush && (t % q.rush) === 0) st.rushT = 60;
      if (st.hopT > 0) st.hopT--; if (st.rushT > 0) st.rushT--;
      const jy = st.hopT > 0 ? tri(st.hopT / 100) * (q.hopH || 3) : 0;
      e.body = e.body || []; e.body.push({ x: st.x, y: st.y - jy, w: q.w, h: q.h, kind: q.look || 'beast', face: Math.sign(st.vx) });
      e.hit.push([st.x + 0.1, st.y - jy + 0.1, q.w - 0.2, q.h - 0.15]);
    },
    snake(r, e, q, t, st, ax, bx, gy) {
      if (st.x === undefined) { st.x = bx - 2; st.y = gy - 1; st.vx = -q.sp; st.trail = []; }
      const d = Math.sign(st.vx), fx = d > 0 ? Math.floor(st.x + 1.02) : Math.floor(st.x - 0.02), foot = Math.floor(st.y + 0.99);
      let hgt = 0; while (hgt <= q.climb && r.solid(fx, foot - hgt)) hgt++;
      let turn = hgt > q.climb; if (!turn && hgt > 0) st.y -= hgt;
      const gnd = groundY(r, Math.floor(st.x + 0.5), Math.max(0, Math.floor(st.y))); if (st.y + 1 < gnd) st.y = Math.min(gnd - 1, st.y + 10 * DT);
      // うねり（上下に少し）
      const wy = SH.dsin(t / 70) * 0.35;
      const nx = st.x + st.vx * DT; if (nx < ax || nx + 1 > bx) turn = true;
      if (turn) st.vx = -st.vx; else st.x = nx;
      st.trail.unshift([st.x, st.y + wy]); if (st.trail.length > q.n * 14) st.trail.length = q.n * 14;
      e.body = e.body || [];
      for (let i = 0; i < q.n; i++) {
        const s = st.trail[Math.min(st.trail.length - 1, i * 14)] || [st.x, st.y];
        e.body.push({ x: s[0], y: s[1] - (i === 0 ? 0.2 : 0), w: 1, h: 1, kind: i === 0 ? 'snakeH' : 'snake', face: Math.sign(st.vx) });
        e.hit.push([s[0] + 0.1, s[1] + 0.1, 0.8, 0.8]);
      }
    },
    rocks(r, e, q, t, st, ax, bx) {
      const per = q.per, f = t % per, cyc = Math.floor(t / per);
      if (f === 0) { st.cols = []; const px = Math.floor(r.p.x + 0.4); for (let k = 0; k < q.n; k++) { const off = k === 0 ? 0 : Math.floor((hash(cyc * 31 + k) - 0.5) * q.spread * 2); st.cols.push(Math.max(ax, Math.min(bx - 1, px + off))); } }
      if (!st.cols) return;
      const warn = per * 0.55;
      for (const x of st.cols) {
        const g = groundY(r, x, 0);
        if (f < warn) e.warn.push([x, g - 0.2, 1, 0.2, 'rock']);
        else { const k = (f - warn) / (per * 0.25); if (k <= 1) { const y = -1 + (g) * Math.min(1, k); e.body = e.body || []; e.body.push({ x: x + 0.05, y: y, w: 0.9, h: 0.9, kind: 'rock' }); e.hit.push([x + 0.1, y + 0.1, 0.8, 0.8]); if (k >= 0.98 && !st['b' + x]) { st['b' + x] = 1; r.ev('crush', x); } } else st['b' + x] = 0; }
      }
    },
    quake(r, e, q, t, st, ax, bx, gy) {
      const per = q.per, f = t % per, cyc = Math.floor(t / per), side = q.alt ? cyc % 2 : 0;
      const mid = (ax + bx) / 2, x0 = q.alt ? (side ? mid : ax) : ax, x1 = q.alt ? (side ? bx : mid) : bx;
      const warn = per * 0.6, act = per * 0.14;
      if (f < warn) { if (f > warn * 0.4) e.warn.push([x0, gy - 0.25, x1 - x0, 0.25, 'quake']); }
      else if (f < warn + act) {
        // 地面すれすれ（その列の地面から1マス）。屍や段の上にいればとどかない
        for (let x = Math.floor(x0); x < Math.ceil(x1); x++) { if (groundY(r, x, gy - 4) < gy) continue; e.hit.push([x, gy - 1.05, 1, 1.05]); }
        if (!st.q || st.q !== cyc) { st.q = cyc; r.ev('quake', (x0 + x1) / 2); }
        e.shake = 1;
      }
      e.body = e.body || [];
      if (q.look) e.body.push({ x: q.alt ? (side ? bx - q.w : ax) : (mid - q.w / 2), y: gy - q.h - (f < warn ? tri(f / warn * 0.5) * 1.2 : 0), w: q.w, h: q.h, kind: q.look, still: true });
    },
    sweep(r, e, q, t, st, ax, bx, gy) {
      const per = q.per, f = t % per, cyc = Math.floor(t / per), hi = q.both ? (cyc % 2) : 0;
      const yy = hi ? gy - 2.4 : gy - 1.0, from = cyc % 2 ? bx : ax, to = cyc % 2 ? ax : bx;
      const warn = per * 0.35;
      if (f < warn) e.warn.push([Math.min(from, to), yy, Math.abs(to - from), 0.6, 'sweep']);
      else { const k = (f - warn) / (per * 0.5); if (k <= 1) { const x = from + (to - from) * k; e.body = e.body || []; e.body.push({ x: x - 1.5, y: yy, w: 3, h: 0.6, kind: 'arm' }); e.hit.push([x - 1.5, yy + 0.05, 3, 0.5]); } }
    },
    jaws(r, e, q, t, st, ax, bx, gy) {
      const per = q.per, f = t % per;
      if (f === 0) st.jx = Math.max(ax, Math.min(bx - q.w, r.p.x + 0.4 - q.w / 2));
      if (st.jx === undefined) return;
      const warn = per * 0.5;
      if (f < warn) e.warn.push([st.jx, gy - 0.3, q.w, 0.3, 'jaws']);
      else { const k = (f - warn) / (per * 0.3); if (k <= 1) { const hgt = q.h * tri(k * 0.5 + 0.0 + (k > 0.5 ? 0 : 0)) * 1; const h = q.h * (k < 0.5 ? k * 2 : 2 - k * 2); e.body = e.body || []; e.body.push({ x: st.jx, y: gy - h, w: q.w, h: h, kind: 'jaws' }); if (h > 0.3) e.hit.push([st.jx + 0.15, gy - h + 0.1, q.w - 0.3, h]); void hgt; if (k > 0.2 && !st.jb) { st.jb = 1; r.ev('jaws', st.jx); } } else st.jb = 0; }
    },
    blade(r, e, q, t, st, ax, bx) {
      // 天井を行ったり来たりして、ときどき真下に刃を落とす
      const x = ax + (bx - ax - q.w) * tri(t / q.walk);
      e.body = e.body || []; e.body.push({ x, y: q.top, w: q.w, h: q.h, kind: q.look || 'reaper', face: 1 });
      e.hit.push([x + 0.2, q.top + 0.1, q.w - 0.4, q.h - 0.2]);
      const per = q.per, f = t % per;
      if (f === 0) st.bx = Math.floor(x + q.w / 2);
      if (st.bx === undefined) return;
      let g = r.H; for (let y = Math.floor(q.top + q.h); y < r.H; y++) if (r.solid(st.bx, y) || r.solid(st.bx + 1, y)) { g = y; break; }
      const warn = per * 0.5;
      if (f < warn) e.warn.push([st.bx - 0.5, q.top + q.h, 2, g - q.top - q.h, 'blade']);
      else if (f < warn + per * 0.12) { e.hit.push([st.bx - 0.4, q.top + q.h, 1.8, g - q.top - q.h]); e.body.push({ x: st.bx - 0.5, y: q.top + q.h, w: 2, h: g - q.top - q.h, kind: 'slash' }); if (!st.sb) { st.sb = 1; r.ev('blade', st.bx); } } else st.sb = 0;
    },
  };
  // 番人の決まり（e.parts の順に動かす）
  SH.BOSS = {
    std(r, e, t, st, ax, bx, gy) {
      e.body = []; e.shake = 0;
      // 戦う場所に入るまでは静か。入ったときから動き出す
      if (st.on === undefined) { if (r.p.x + 0.8 < ax - 1) { e.sleep = 1; return; } st.on = t; e.sleep = 0; r.ev('boss', e.type); }
      const tt = t - st.on + 1;
      e.parts.forEach((q, i) => { st[i] = st[i] || {}; PART[q.p](r, e, q, tt, st[i], ax, bx, gy); });
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
