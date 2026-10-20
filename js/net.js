// =============================================
//  シインクラッド  みんなとつながる（Firebase Realtime Database）
//
//  データの形
//   sh_cells/{層}/{x_y}  : { n：その場所の屍の数, l：最後に死んだ人の名前, t：時刻 }   ＋1ずつしか増やせない
//   sh_stat/{層}         : { d：死んだ数, f：ゴールした数, m：いちばん先まで行った場所 }
//   sh_grave/{id}        : { n：名前, f：層, t }            1層の「屍の碑」
//   sh_clear/{層}/{id}   : { n, x：XのID, t, r：操作の記録, c：その時の屍, k：かかった時間 }
//   sh_open/{層}         : { t, n, x, id }                  その層をはじめて越えた（次の層が開いた）
//   sh_rep/{層}/{id}     : { t, m：届いた場所, a：自動判定 }    詰みの知らせ
//   sh_reset/{層}        : { t（だれでも読める）, k（管理のかぎ。読めない） }
//   sh_admin/key         : 管理のかぎ（Firebaseの画面で入れる。だれも読めない）
//
//  ずる対策
//   ・ルール：数は＋1ずつ、時刻は今に近いこと、場所・名前の形、層の番号、長さ
//   ・読みこむ側：屍は「本当にそこに止まれる場所」で「列の上限以内」のものだけ数える
//   ・クリア：操作の記録をこの端末で計算しなおして、本当にゴールできたものだけ認める
//     そのときの屍は、いま本当にある屍の中に入っていること
// =============================================
(function (G) {
  const SH = G.SH, T = SH.T;
  const N = SH.NET = {};
  const DBURL = () => G.JM.FIREBASE_CONFIG.databaseURL;
  const late = ms => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
  const store = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } };
  N.store = store;
  // ---------- ふつうの通信 ----------
  async function rest(path, q) {
    const qs = q ? '?' + Object.entries(q).map(([k, v]) => k + '=' + encodeURIComponent(/^(limitTo|shallow)/.test(k) ? String(v) : JSON.stringify(v))).join('&') : '';
    const r = await Promise.race([fetch(DBURL() + '/' + path + '.json' + qs, { cache: 'no-store' }), late(12000)]);
    if (!r.ok) throw new Error('http ' + r.status);
    return r.json();
  }
  async function restWrite(method, path, val) {
    const r = await Promise.race([fetch(DBURL() + '/' + path + '.json', { method, body: JSON.stringify(val), cache: 'no-store' }), late(12000)]);
    if (!r.ok) { const e = new Error('http ' + r.status); if (r.status === 401 || r.status === 403) e.code = 'PERMISSION_DENIED'; throw e; }
    return r.json();
  }
  N.rest = rest;
  // ---------- 書きこみ（常時接続は使わない。同時接続の上限を食わないように） ----------
  // 時刻はデータベースの時計で入れる
  const SV = { '.sv': 'timestamp' };
  N.off = 0;
  const now = () => Date.now();
  N.now = now;
  const perm = e => e && /permission/i.test(String(e.code || e.message || ''));
  // 数を変える：読んで→変えて→書く。ルールが「前の数＋1」しか通さないので、
  // ほかの人と同時になって断られたら、読みなおしてやりなおす
  async function tx(path, fn) {
    for (let i = 0; i < 6; i++) {
      const cur = await rest(path); const nv = fn(cur); if (nv === undefined) return cur;
      try { await restWrite('PUT', path, nv); return nv; }
      catch (e) { if (!perm(e)) throw e; await new Promise(r => setTimeout(r, 150 + Math.random() * 400)); }
    }
    throw new Error('混みあっています');
  }
  async function push(path, val) { const r = await restWrite('POST', path, val); return r && r.name; }
  async function update(val) { await restWrite('PATCH', '', val); }
  N._tx = tx; N._push = push; N._update = update;
  N.warm = () => { };
  // ---------- 名前の形 ----------
  N.cleanName = s => String(s || '').replace(/[<>&"'\\\/.#$\[\]\n\r\t]/g, '').slice(0, 12);
  N.cleanX = s => { s = String(s || '').trim().replace(/^@/, ''); return /^[A-Za-z0-9_]{1,15}$/.test(s) ? s : ''; };
  // =============================================
  //  屍を読む：本当に止まれる場所で、上限以内のものだけ
  // =============================================
  const restOn = (lv, x, y, has) => {   // (x,y) に屍が止まれるか（下が固い・底のトゲ溶岩・水面）
    const W = lv.w, H = lv.h, tl = lv.tiles, c = tl[y * W + x];
    if (c === T.ROCK || c === T.ICE || c === T.BELT_R || c === T.BELT_L || c === T.POISON) return false;
    if (c === T.WATER) return false;   // 水面は外で調べる
    if (y === H - 1) return c === T.SPIKE || c === T.LAVA;
    if (has(x, y + 1)) return true;
    const b = tl[(y + 1) * W + x];
    if (b === T.WATER) return false;
    return b === T.ROCK || b === T.ICE || b === T.BELT_R || b === T.BELT_L || b === T.VANISH || b === T.CLOUD || b === T.TRAP;
  };
  N.sanitize = function (lv, raw) {
    const W = lv.w, H = lv.h, cols = new Map(), out = new Map();
    for (const key in raw || {}) {
      const m = /^(\d{1,4})_(\d{1,2})$/.exec(key); if (!m) continue;
      const x = +m[1], y = +m[2], v = raw[key]; if (x >= W || y >= H || !v || !(v.n >= 1)) continue;
      if (!cols.has(x)) cols.set(x, []); cols.get(x).push([y, v]);
    }
    const tl = lv.tiles, solidT = c => c === T.ROCK || c === T.ICE || c === T.BELT_R || c === T.BELT_L || c === T.VANISH || c === T.CLOUD || c === T.TRAP;
    for (const [x, list] of cols) {
      let n = 0;
      const has = (xx, yy) => out.has(yy * W + xx);
      const put = (y, v) => { out.set(y * W + x, { n: Math.min(99999, v.n | 0), last: N.cleanName(v.l) || '名無し', t: +v.t || 0 }); n++; };
      // ふつうの所：下から
      list.sort((a, b) => b[0] - a[0]);
      for (const [y, v] of list) {
        if (n >= lv.cap[x]) break;
        const c = tl[y * W + x];
        let ok = false;
        if (c === T.WATER) ok = y > 0 && tl[(y - 1) * W + x] !== T.WATER;
        else ok = restOn(lv, x, y, has);
        if (ok) put(y, v);
      }
      // さかさまの所：上から（天井にくっつく）
      list.sort((a, b) => a[0] - b[0]);
      for (const [y, v] of list) {
        if (n >= lv.cap[x] || has(x, y)) continue;
        const c = tl[y * W + x], flip = c === T.FLIP || (c === T.SPIKE && y + 1 < H && tl[(y + 1) * W + x] === T.FLIP);
        if (!flip || y === 0) continue;
        if (has(x, y - 1) || solidT(tl[(y - 1) * W + x])) put(y, v);
      }
    }
    return out;
  };
  // 屍を読みこむ
  N.loadCells = async function (lv) { const v = await rest('sh_cells/' + lv.f); return N.sanitize(lv, v); };
  // =============================================
  //  死んだ：屍を＋1、死んだ数、いちばん先、屍の碑
  // =============================================
  N.died = async function (lv, place, name, maxX) {
    const f = lv.f, t = now(), jobs = [];
    if (place && !place.vanish) {
      jobs.push(tx('sh_cells/' + f + '/' + place.x + '_' + place.y, cur => ({ n: ((cur && cur.n) || 0) + 1, l: name, t: SV })));
    }
    jobs.push(tx('sh_stat/' + f + '/d', cur => (cur || 0) + 1));
    const mx = Math.min(lv.goal, Math.floor(maxX));
    jobs.push(tx('sh_stat/' + f + '/m', cur => (cur || 0) >= mx ? undefined : mx));
    jobs.push(push('sh_grave', { n: name, f, t: SV }));
    const r = await Promise.allSettled(jobs);
    return r[0].status === 'fulfilled' ? r[0].value : null;
  };
  // =============================================
  //  クリア
  // =============================================
  N.corStr = cor => { const W = []; for (const k of cor.keys()) W.push(k); return W.sort((a, b) => a - b).map(k => k.toString(36)).join('.'); };
  N.corParse = (s, w) => { const m = new Map(); for (const v of String(s || '').split('.')) { if (!v) continue; const k = parseInt(v, 36); if (k >= 0) m.set(k, { n: 1, last: '' }); } return m; };
  N.clear = async function (lv, name, xid, recStr, corStr, ticks, isLatest) {
    const f = lv.f, t = now();
    const id = await push('sh_clear/' + f, { n: name, x: xid || '', t: SV, r: recStr, c: corStr, k: ticks });
    const jobs = [tx('sh_stat/' + f + '/f', cur => (cur || 0) + 1), tx('sh_stat/' + f + '/m', () => lv.goal)];
    if (isLatest && id) jobs.push(update({ ['sh_open/' + f]: { t: SV, n: name, x: xid || '', id } }));
    await Promise.allSettled(jobs);
    return id;
  };
  N.setXid = async function (f, id, xid, open) {   // あとからXのIDを入れる（はじめて越えた人だけ）
    const v = await rest('sh_clear/' + f + '/' + id); if (!v) return;
    const up = { ['sh_clear/' + f + '/' + id + '/x']: xid };
    if (open) up['sh_open/' + f + '/x'] = xid;
    await update(up);
  };
  // 越えた記録が本当か：屍は「そのときある屍」→「いまある屍」の中にあること、操作をやりなおしてゴールできること
  N.verifyClear = function (lv, c, cells, resetT) {
    if (!c || typeof c.r !== 'string' || typeof c.c !== 'string') return false;
    const snap = N.corParse(c.c, lv.w);
    if (!resetT || c.t > resetT) { for (const k of snap.keys()) if (!cells.has(k)) return false; }
    // 屍の形が正しいか（宙に浮いた屍などはだめ）
    const raw = {}; for (const k of snap.keys()) raw[(k % lv.w) + '_' + Math.floor(k / lv.w)] = { n: 1 };
    const san = N.sanitize(lv, raw); if (san.size !== snap.size) return false;
    const r = SH.verify(lv, snap, c.r, 120 * 60 * 8);
    return r.ok;
  };
  // その層の、はじめて越えた本当の人（いちばん早い記録から順に確かめる）
  N.firstClear = async function (lv, cells) {
    const [v, rs] = await Promise.all([rest('sh_clear/' + lv.f, { orderBy: 't', limitToFirst: 3 }).catch(() => rest('sh_clear/' + lv.f)), rest('sh_reset/' + lv.f + '/t').catch(() => null)]);
    const list = Object.entries(v || {}).map(([id, c]) => Object.assign({ id }, c)).sort((a, b) => a.t - b.t);
    for (const c of list) if (N.verifyClear(lv, c, cells, rs)) return c;
    return null;
  };
  // =============================================
  //  全体：開いた層・各層の数字・屍の碑
  // =============================================
  N.overview = async function () {
    const [open, stat] = await Promise.all([rest('sh_open').catch(() => null), rest('sh_stat').catch(() => null)]);
    return { open: open || {}, stat: stat || {} };
  };
  N.grave = async function (n) { const v = await rest('sh_grave', { orderBy: 't', limitToLast: n || 100 }); return Object.values(v || {}).filter(g => g && g.n).sort((a, b) => b.t - a.t); };
  // 詰みの知らせ
  N.report = async function (f, maxX, auto) { return push('sh_rep/' + f, { t: SV, m: Math.floor(maxX), a: auto ? 1 : 0 }); };
  N.reports = async function () { return (await rest('sh_rep')) || {}; };
  // 管理：その層の屍をぜんぶ消す（かぎが合わないと消えない）
  N.resetFloor = async function (f, key) {
    await update({ ['sh_cells/' + f]: null, ['sh_rep/' + f]: null, ['sh_reset/' + f]: { t: SV, k: String(key) } });
  };
})(typeof window !== 'undefined' ? window : globalThis);
