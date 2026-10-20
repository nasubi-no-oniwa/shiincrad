// =============================================
//  シインクラッド  どこまで行けるか・詰みのチェック
//  ・立てるマスから、いくつかの決まった動き（歩く・跳ぶ・途中で止める）を本物の計算で試して、
//    たどり着けるマスを広げていく
//  ・動く敵や番人は「いつかは通れる」とみなす（時間の読みあいなので）
//  ・死ぬ動きは「ここで死ぬと屍がここに置かれる」という候補として集める
//  ・詰み：ゴールに届かず、どの候補で死んでも先へ進めない（屍が置けない・置いても変わらない）
// =============================================
(function (G) {
  const SH = G.SH, T = SH.T, PW = SH.PHYS.PW, PH = SH.PHYS.PH;
  // 動き：[向き, ジャンプを押す長さ（0は押さない）, 横を押す長さ]
  const ACTS = [];
  for (const d of [1, -1]) for (const j of [0, 6, 14, 60]) for (const h of [8, 20, 34, 999]) { if (j === 0 && h < 20) continue; ACTS.push([d, j, h]); }
  ACTS.push([0, 60, 0]);
  // 計算用の層（敵・番人・天井などは外す。横に動く床は、その道すじを雲の足場とみなす）
  function staticLevel(lv) {
    const tiles = new Uint8Array(lv.tiles);
    for (const e of lv.ents) if (e.k === 'plat' && e.y0 === e.y1) { const y = Math.round(e.y0); if (y >= 0 && y < lv.h) for (let x = Math.floor(Math.min(e.x0, e.x1)); x < Math.ceil(Math.max(e.x0, e.x1) + e.w); x++) if (tiles[y * lv.w + x] === T.AIR) tiles[y * lv.w + x] = T.CLOUD; }
    // 敵などが屍を作る場所（候補）
    const killers = [];
    for (const e of lv.ents) {
      if (e.k === 'crush') killers.push([Math.floor(e.x), Math.ceil(e.x + e.w) - 1]);
      else if (e.k === 'walk') killers.push([Math.floor(e.a), Math.floor(e.b)]);
      else if (e.k === 'bolt') killers.push([Math.floor(e.x), Math.floor(e.x)]);
      else if (e.k === 'boss') killers.push([Math.floor(e.ax), Math.floor(e.bx) - 1]);
      else if (e.k === 'saw') killers.push([Math.floor(e.cx - e.r), Math.floor(e.cx + e.r)]);
      else if (e.k === 'jet') killers.push([Math.floor(e.x), Math.floor(e.x)]);
    }
    return Object.assign({}, lv, { tiles, ents: [], killers });
  }
  SH.staticLevel = staticLevel;
  // (x,y)：体が入るマス。y+1 が足もと
  function standAt(r, x, y) { if (r.tile(x, y) === T.FLIP) return !r.solid(x, y) && r.solid(x, y - 1); return !r.solid(x, y) && r.tile(x, y) !== T.SPIKE && r.tile(x, y) !== T.LAVA && r.tile(x, y) !== T.POISON && (r.solid(x, y + 1) || (r.tile(x, y + 1) === T.CLOUD && !r.hasCorpse(x, y + 1))); }
  // 1つの動きを試す
  function tryAct(slv, cor, x, y, a, lim) {
    const r = new SH.Run(slv, cor);
    r.p.x = x + (1 - PW) / 2; r.p.on = true; r.wasOn = true; if (slv.tiles[y * slv.w + x] === T.FLIP) { r.p.y = y; r.p.g = -1; } else r.p.y = y + 1 - PH;
    const [d, jh, hh] = a; let air = false;
    for (let t = 1; t <= (lim || 320); t++) {
      const inp = (t <= hh ? (d > 0 ? 2 : d < 0 ? 1 : 0) : 0) | (t <= jh ? 4 : 0);
      r.step(inp);
      if (r.over) { if (r.clear) return { goal: true }; return { die: r.place, kind: r.dead }; }
      const p = r.p;
      if (!p.on) air = true;
      else if (air) return { land: [Math.floor(p.x + PW / 2), Math.floor(p.y + (p.g < 0 ? 0.01 : PH - 0.01))] };
      else if (t > hh + 2 && Math.abs(p.vx) < 0.5) return { land: [Math.floor(p.x + PW / 2), Math.floor(p.y + (p.g < 0 ? 0.01 : PH - 0.01))] };
    }
    const p = r.p; if (p.on) return { land: [Math.floor(p.x + PW / 2), Math.floor(p.y + (p.g < 0 ? 0.01 : PH - 0.01))] };
    return null;
  }
  // たどり着けるマス・ゴールに届くか・死ぬ候補
  SH.reach = function (lv, cor, opt) {
    opt = opt || {};
    const slv = lv._static || (lv._static = staticLevel(lv));
    const r0 = new SH.Run(slv, cor);
    const sx = Math.floor(lv.start.x + PW / 2), sy = Math.floor(lv.start.y + PH - 0.01);
    const seen = new Set(), q = [[sx, sy]], deaths = new Map(); seen.add(sy * lv.w + sx);
    let maxX = sx, goal = false, n = 0;
    const lim = opt.limit || 1e9;
    while (q.length && n < lim) {
      const [x, y] = q.shift(); n++;
      if (x > maxX) maxX = x;
      for (const a of ACTS) {
        const res = tryAct(slv, cor, x, y, a);
        if (!res) continue;
        if (res.goal) { goal = true; if (!opt.full) return { goal, maxX: lv.goal, seen, deaths, n }; continue; }
        if (res.die) { const pl = res.die; if (!pl.vanish) { const k = pl.y * lv.w + pl.x; const d = deaths.get(k) || { x: pl.x, y: pl.y, from: x, kinds: new Set() }; d.kinds.add(res.kind); deaths.set(k, d); } continue; }
        const [lx, ly] = res.land; const k = ly * lv.w + lx;
        if (!seen.has(k) && standAt(r0, lx, ly)) { seen.add(k); q.push([lx, ly]); }
      }
    }
    // 敵・番人の持ち場で、立てるマスがあれば、そこも死ぬ候補
    for (const [a, b] of slv.killers) for (const k of seen) { const x = k % lv.w, y = Math.floor(k / lv.w); if (x >= a && x <= b) { const pl = r0.die.call(Object.assign(Object.create(SH.Run.prototype), r0, { p: { x: x + 0.1, y: y + 1 - PH }, events: [], over: false }), 'enemy'); if (!pl.vanish) { const kk = pl.y * lv.w + pl.x; if (!deaths.has(kk)) deaths.set(kk, { x: pl.x, y: pl.y, from: x, kinds: new Set(['enemy']) }); } } }
    return { goal, maxX, seen, deaths, n };
  };
  // 屍を1つ足す（Map をこわさないように新しく作る）
  SH.addCorpse = function (cor, lv, x, y, name) { const k = y * lv.w + x, c = cor.get(k); cor.set(k, { n: (c ? c.n : 0) + 1, last: name || '' }); };
  // みんなが前へ前へと死んでいったら、何人でゴールに届くか（層づくりの確認と、詰みのチェックに使う）
  //  返り値：{ ok, need：足した屍の数, cor, stuck：詰み（候補がもうない） }
  SH.simulate = function (lv, cor0, maxAdd) {
    const cor = new Map(cor0 || []); let added = 0;
    for (let it = 0; it < (maxAdd || 600); it++) {
      const res = SH.reach(lv, cor);
      if (res.goal) return { ok: true, need: added, cor, maxX: lv.goal };
      // いちばん前の方の候補（3つまで）に屍を置く
      const col = new Int16Array(lv.w); for (const k of cor.keys()) col[k % lv.w]++;
      const cand = [...res.deaths.values()].filter(d => col[d.x] < lv.cap[d.x]).sort((a, b) => (b.from - a.from) || (b.x - a.x)).slice(0, 3);
      if (!cand.length) return { ok: false, need: added, cor, stuck: true, maxX: res.maxX };
      for (const d of cand) { SH.addCorpse(cor, lv, d.x, d.y, '…'); added++; }
    }
    return { ok: false, need: added, cor, stuck: false };
  };
  // 詰みのチェック（ゲームの中）：いまの屍で、これから何人死んでもゴールに届かないか
  SH.isStuck = function (lv, cor) { const s = SH.simulate(lv, cor, 400); return s.ok ? null : (s.stuck ? { maxX: s.maxX } : null); };
})(typeof window !== 'undefined' ? window : globalThis);
