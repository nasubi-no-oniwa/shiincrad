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
//   sh_reset/{層}        : { t }   その層の屍を消した時刻
//   sh_admin/key         : 管理のかぎ（Firebaseの画面で入れる。だれも読めない）
//
//   sh_u/{匿名ID}         : { c：最後に死んだ時刻, k：最後に越えた時刻, r：最後の知らせ,
//                           w/{層}：その層で出した越えた記録の数（3まで） }
//                           回数の制限に使う（w は本人だけ読める。ほかはだれも読めない）
//   sh_dlog/{層}/{id}    : { p：屍の場所 x_y, u：匿名ID, t, v：1（再生用の記録つき） }   だれがどこに屍を置いたか（軽い）
//   sh_drec/{層}/{id}    : { r：死んだ挑戦の操作の記録, c：その挑戦の始まりの屍, k：死ぬまでの時間 }   再生用（重いので、要る分だけ読む）
//   sh_rm/{層}           : { t }   管理人が屍を取り除いた時刻（端末が覚えた確かめを、やりなおす合図）
//   sh_ckpt              : 管理人が「ここまでは本物」と確かめた層
//   sh_admins/{匿名ID}    : 管理のかぎ（その端末を管理人にする。だれも読めない）
//
//  ずる対策
//   ・書きこみは匿名ログインのIDつき。1つのIDで、死ぬのは0.7秒に1回、越えるのは4秒に1回、知らせは10秒に1回まで
//   ・ルール：数は＋1ずつ、時刻はデータベースの時計、場所・名前の形、層の番号、長さ。開いた印は上書き・消すことができない
//   ・「開いた」の印は信じない：下の層から順に、越えた記録を計算しなおして本物だった層だけ開く
//   ・読みこむ側：屍は「本当にそこに止まれる場所」で「列の上限以内」のものだけ数える
//   ・屍も確かめる：死んだ挑戦の操作を、その挑戦の始まりの屍で再生して、本当にその場所で死ぬものだけ数える
//     （始まりの屍は、そのときまでに確かめられた屍の中にあること。再生用の記録がない昔の屍はそのまま数える）
//   ・クリア：操作の記録をこの端末で計算しなおして、本当にゴールできたものだけ認める
//     にせの記録を大量に入れられても進めるように：古い順に少しずつ確かめ、にせだった所までは覚えておいて二度と計算しない
//     そのときの屍は、いま本当にある屍の中に入っていること
// =============================================
(function (G) {
  const SH = G.SH, T = SH.T;
  const N = SH.NET = {};
  const DBURL = () => G.JM.FIREBASE_CONFIG.databaseURL;
  const late = ms => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
  const store = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } };
  N.store = store;
  // ---------- 名乗り（匿名。ログインの画面は出さない） ----------
  //  Firebase の「匿名ログイン」で、この端末に見えないIDをもらう。書きこみはそのIDで行い、
  //  データベースのルールが「1つのIDで何秒に1回まで」をしばる（ずるの連打を止める）
  const AUTHURL = G.SH_AUTHURL || { up: 'https://identitytoolkit.googleapis.com/v1/accounts:signUp', ref: 'https://securetoken.googleapis.com/v1/token' };
  let tok = null, tokExp = 0, authP = null;
  N.uid = null;
  async function signIn() {
    const key = G.JM.FIREBASE_CONFIG.apiKey, saved = store('shiin_auth');
    if (saved && saved.rt) {
      const r = await Promise.race([fetch(AUTHURL.ref + '?key=' + key, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(saved.rt) }), late(12000)]);
      if (r.ok) { const j = await r.json(); tok = j.id_token; tokExp = Date.now() + (Math.max(300, +j.expires_in || 3600) - 240) * 1000; N.uid = j.user_id; store('shiin_auth', { rt: j.refresh_token, uid: j.user_id }); return tok; }
      if (r.status !== 400 && r.status !== 403) throw new Error('auth ' + r.status);
      store('shiin_auth', { rt: '' });   // 古くて使えない → 新しくもらう
    }
    const r = await Promise.race([fetch(AUTHURL.up + '?key=' + key, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"returnSecureToken":true}' }), late(12000)]);
    if (!r.ok) throw new Error('auth ' + r.status);
    const j = await r.json(); tok = j.idToken; tokExp = Date.now() + (Math.max(300, +j.expiresIn || 3600) - 240) * 1000; N.uid = j.localId;
    store('shiin_auth', { rt: j.refreshToken, uid: j.localId });
    return tok;
  }
  N.token = function (force) {
    if (!force && tok && Date.now() < tokExp) return Promise.resolve(tok);
    if (!authP) authP = signIn().finally(() => { authP = null; });
    return authP;
  };
  // ---------- ふつうの通信 ----------
  async function rest(path, q) {
    const qs = q ? '?' + Object.entries(q).map(([k, v]) => k + '=' + encodeURIComponent(/^(limitTo|shallow)/.test(k) ? String(v) : JSON.stringify(v))).join('&') : '';
    const r = await Promise.race([fetch(DBURL() + '/' + path + '.json' + qs, { cache: 'no-store' }), late(12000)]);
    if (!r.ok) throw new Error('http ' + r.status);
    return r.json();
  }
  async function restWrite(method, path, val) {
    for (let i = 0; ; i++) {
      const t = await N.token(i > 0);
      const r = await Promise.race([fetch(DBURL() + '/' + path + '.json?auth=' + encodeURIComponent(t), { method, body: JSON.stringify(val), cache: 'no-store' }), late(12000)]);
      if (r.ok) return r.json();
      const txt = await r.text().catch(() => '');
      // 名乗りの期限切れ → 1回だけもらいなおす
      if (i === 0 && r.status === 401 && /token|auth/i.test(txt) && !/permission/i.test(txt)) continue;
      const e = new Error('http ' + r.status); if (r.status === 401 || r.status === 403) e.code = 'PERMISSION_DENIED'; else if (r.status === 400) e.code = 'BAD_REQUEST'; throw e;
    }
  }
  N.rest = rest;
  // 本人の名乗りつきで読む（sh_u の自分の数え）
  async function restMe(path) {
    const t = await N.token();
    const r = await Promise.race([fetch(DBURL() + '/' + path + '.json?auth=' + encodeURIComponent(t), { cache: 'no-store' }), late(12000)]);
    if (!r.ok) throw new Error('http ' + r.status);
    return r.json();
  }
  // ---------- 書きこみ（常時接続は使わない。同時接続の上限を食わないように） ----------
  // 時刻はデータベースの時計で入れる
  const SV = { '.sv': 'timestamp' };
  N.off = 0;
  const now = () => Date.now();
  N.now = now;
  const perm = e => e && /permission/i.test(String(e.code || e.message || ''));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function update(val) { await restWrite('PATCH', '', val); }
  // 書きこみの名前（だれとも重ならない）
  const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const pid = () => { let s = Date.now().toString(36); for (let i = 0; i < 11; i++) s += AZ[Math.floor(Math.random() * AZ.length)]; return s; };
  N.pid = pid;
  // 数を＋1する：データベース側で足してもらう（大勢が同時に書いてもぶつからない）
  //  使えないときに備えて、断られたら次は「読んだ数＋1」の書き方でためす（うまくいった書き方を覚える）
  let incPref = true;
  const INC = { '.sv': { increment: 1 } };
  // 読んで→まとめて書く。ルールに断られたら（ほかの人と同時・間をあけすぎず）、少し待って読みなおしてやりなおす
  async function tx(build, tries) {
    for (let i = 0; i < (tries || 8); i++) {
      const inc = i % 2 === 0 ? incPref : !incPref;
      const up = await build(inc); if (!up) return null;
      try { await update(up.w); incPref = inc; return up.r; }
      catch (e) { if (!perm(e) && !(e && e.code === 'BAD_REQUEST')) throw e; await sleep(250 + Math.random() * 500 + i * 150); }
    }
    throw new Error('混みあっています');
  }
  // 同じ種類の書きこみは1つずつ、間をあけて（ルールの「何秒に1回」に合わせる）
  const lane = {}, lastAt = {};
  function inLane(kind, gap, job) {
    const p = (lane[kind] || Promise.resolve()).catch(() => { }).then(async () => {
      const w = (lastAt[kind] || 0) + gap - Date.now(); if (w > 0) await sleep(w);
      try { return await job(); } finally { lastAt[kind] = Date.now(); }
    });
    lane[kind] = p; return p;
  }
  N._update = update;
  N.warm = () => { N.token().catch(() => { }); };
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
  // =============================================
  //  屍を確かめる（死んだ挑戦を再生して、本当にそこで死ねた屍だけ）
  //   ・記録は2つ：sh_dlog（どこ・だれ・いつ。軽い）と sh_drec（再生用の操作。重い）。sh_drec は、まだ屍がない場所の分だけ読む
  //   ・再生用の記録がない屍（この仕組みより前・版17までのゲーム）：場所ごとの数（n）のうち、再生用つきの記録の数より多い分は、そのまま数える
  //   ・記録のある屍：時刻の順に、①始まりの屍が「そのときまでに数えた屍」の中にあること ②操作を再生すると、その場所で死ぬこと
  //   ・確かめた結果はこの端末に覚えておく（shiin_dv）。管理人が屍を取り除いた（sh_rm）・層を消した（sh_reset）ら、やりなおす
  //   ・再生してもだめだった記録が3つたまった匿名IDは、その層ではもう計算しない（重くされないように）
  // =============================================
  const kStr = (k, w) => (k % w) + '_' + Math.floor(k / w);
  const DMAX = 120 * 60 * 6;   // 1つの挑戦を再生する長さの上限（6分）。それより長い挑戦の屍は、計算せずに数えない
  // 1つの記録を確かめる：'ok' / 'snap'（始まりの屍がおかしい）/ 'replay'（再生しても、そこで死なない）/ 'long'（長すぎて計算しない）/ 'nodata'
  N.verifyDeath = function (lvs, it, present) {
    if (!it || typeof it.r !== 'string' || typeof it.c !== 'string' || !(it.k >= 1) || typeof it.p !== 'string') return 'nodata';
    if (it.k > DMAX) return 'long';
    const lv0 = lvs[0], snap = N.corParse(it.c, lv0.w);
    for (const k of snap.keys()) if (!present.has(kStr(k, lv0.w))) return 'snap';
    const lim = (it.k | 0) + 2;
    for (const lv of lvs) {
      const r = new SH.Run(lv, snap), inp = SH.Rec.parse(it.r);
      while (!r.over && r.t < lim) r.step(inp(r.t + 1));
      if (r.over && !r.clear && r.place && !r.place.vanish && (r.place.x + '_' + r.place.y) === it.p) return 'ok';
    }
    return 'replay';
  };
  // まとめて確かめる（別の所でも、ここでも同じ計算）。budget：計算する動きの量。返り値：何こ終えたか・増えた屍・だめだったID
  N.verifyDeaths = function (lvs, items, presentArr, bad, budget) {
    const present = new Set(presentArr), add = [], badInc = {}; let i = 0;
    for (; i < items.length; i++) {
      const it = items[i];
      if (present.has(it.p)) continue;                                   // もう屍がある場所：計算しなくてよい
      if (((bad[it.u] || 0) + (badInc[it.u] || 0)) >= 3) continue;      // だめな記録が多いID：計算しない
      if (budget <= 0) break;
      if (!(it.k <= DMAX)) continue;                                     // 長すぎる記録：計算しない（数えもしない）
      budget -= Math.max(1, it.k | 0) * lvs.length;
      const res = N.verifyDeath(lvs, it, present);
      if (res === 'ok') { present.add(it.p); add.push(it.p); }
      else if (res === 'replay') badInc[it.u] = (badInc[it.u] || 0) + 1;
    }
    return { done: i, add, badInc };
  };
  let dw = null, dwid = 0; const dcb = {};
  function dWorker() {
    if (dw !== null) return dw;
    try {
      if (typeof Worker === 'undefined' || typeof document === 'undefined') return (dw = false);
      dw = new Worker('js/stuck-worker.js?v=' + (SH.VER || '0'));
      dw.onmessage = ev => { const f = dcb[ev.data.id]; if (f) { delete dcb[ev.data.id]; f(ev.data); } };
      dw.onerror = () => { dw = false; for (const k in dcb) { const f = dcb[k]; delete dcb[k]; f({ err: 'worker' }); } };
    } catch (e) { dw = false; }
    return dw;
  }
  const plainLv = lv => ({ f: lv.f, w: lv.w, h: lv.h, tiles: lv.tiles, cap: lv.cap, ents: lv.ents, goal: lv.goal, start: lv.start });
  function verifyDeathsAsync(lvs, items, present, bad, budget) {
    const w = dWorker(), sync = () => N.verifyDeaths(lvs, items, present, bad, budget);
    if (!w) return Promise.resolve(sync());
    return new Promise(res => {
      const id = ++dwid, tm = setTimeout(() => { if (dcb[id]) { delete dcb[id]; res(sync()); } }, 120000);
      dcb[id] = d => { clearTimeout(tm); res(d.err ? sync() : d.res); };
      try { w.postMessage({ type: 'deaths', id, lvs: lvs.map(plainLv), items, present, bad, budget }); }
      catch (e) { clearTimeout(tm); delete dcb[id]; res(sync()); }
    });
  }
  N.variants = null;   // 層を直したことがあるときの昔の版（main.js が入れる）：f → [lv, ...]
  const DV = () => store('shiin_dv') || {};
  function dvSave(f, st) { const o = DV(); o[f] = { key: st.key, t: st.t, ti: st.ti, P: [...st.P], cnt: st.cnt, bad: st.bad }; store('shiin_dv', o); }
  // raw（sh_cells の中身）のうち、数えてよい屍だけを返す。ms：待つ長さの目安（残りは次に呼ばれたときに続ける）
  N.trustCells = function (lv, raw, ms) {
    const job = (lv._dvP || Promise.resolve()).catch(() => { }).then(() => trust(lv, raw, ms));
    lv._dvP = job; return job;
  };
  async function trust(lv, raw, ms) {
    const f = lv.f, until = Date.now() + (ms || 6000);
    const [rm, rs] = await Promise.all([rest('sh_rm/' + f + '/t').catch(() => null), rest('sh_reset/' + f + '/t').catch(() => null)]);
    const key = (rm || 0) + '_' + (rs || 0);
    let st = lv._dv;
    if (!st || st.key !== key) { const c = DV()[f]; st = c && c.key === key ? { key, t: c.t || 0, ti: c.ti || [], P: new Set(c.P || []), cnt: c.cnt || {}, bad: c.bad || {} } : { key, t: 0, ti: [], P: new Set(), cnt: {}, bad: {} }; lv._dv = st; }
    // 新しい記録（前に確かめた所より後）
    let items = [];
    try {
      const v = await rest('sh_dlog/' + f, { orderBy: 't', startAt: st.t }) || {};   // 同じ時刻の記録を取りこぼさないように、同じ時刻から読む（ti：その時刻で終えたもの）
      items = Object.entries(v).map(([id, d]) => Object.assign({ id }, d)).filter(d => d && d.v === 1 && typeof d.t === 'number' && (d.t > st.t || (d.t === st.t && !st.ti.includes(d.id))) && typeof d.p === 'string' && typeof d.u === 'string').sort((a, b) => (a.t - b.t) || (a.id < b.id ? -1 : 1));
    } catch (e) { items = null; }
    // 昔からある屍（記録より数が多い分）
    const extra = {}; if (items) for (const d of items) if (raw[d.p] && d.t <= (+raw[d.p].t || 0)) extra[d.p] = (extra[d.p] || 0) + 1;
    const legacy = []; for (const k in raw) { const n = (raw[k] && raw[k].n) | 0; if (n - (st.cnt[k] || 0) - (extra[k] || 0) > 0) legacy.push(k); }
    const lvs = [lv].concat((N.variants && N.variants[f]) || []);
    // 時刻の順に、少しずつ確かめる
    let i = 0;
    while (items && i < items.length) {
      let part = items.slice(i, i + 200); const present = legacy.concat([...st.P]);
      // 再生がいりそうな記録だけ、再生用の記録（sh_drec）を読む（屍がもうある場所・だめなIDの分は読まない）
      const have = new Set(present), need = part.filter(d => !have.has(d.p) && (st.bad[d.u] || 0) < 3 && d.r === undefined && !d._got);
      const miss = new Set();   // 通信できなかった分：今回はそこで止めて、次に続きから（確かめずに先へ進むと、その屍が消えてしまうので）
      for (let j = 0; j < need.length; j += 6) await Promise.all(need.slice(j, j + 6).map(d => rest('sh_drec/' + f + '/' + d.id).then(x => { d._got = 1; if (x && typeof x === 'object') { d.r = x.r; d.c = x.c; d.k = x.k; } }).catch(() => { miss.add(d.id); })));
      if (miss.size) { const cut = part.findIndex(d => miss.has(d.id)); part = part.slice(0, cut); if (!part.length) break; }
      const res = await verifyDeathsAsync(lvs, part, present, st.bad, 120 * 60 * 20);
      if (!res || !(res.done >= 0)) break;
      for (const p of res.add) st.P.add(p);
      for (const u in res.badInc) st.bad[u] = (st.bad[u] || 0) + res.badInc[u];
      for (let j = 0; j < res.done; j++) { const d = part[j]; st.cnt[d.p] = (st.cnt[d.p] || 0) + 1; if (d.t !== st.t) { st.t = d.t; st.ti = []; } st.ti.push(d.id); }
      i += res.done;
      dvSave(f, st);
      if (miss.size || res.done === 0 || Date.now() > until) break;   // 計算の区切りで止まっただけなら、時間のあるうちは続ける
    }
    lv._dvMore = !!(items && i < items.length);
    const out = {}; for (const k of legacy) if (raw[k]) out[k] = raw[k]; for (const k of st.P) if (raw[k]) out[k] = raw[k];
    return out;
  }
  // 屍を読みこむ（確かめた屍だけ）
  N.loadCells = async function (lv) {
    const v = await rest('sh_cells/' + lv.f) || {};
    lv._raw = v; lv._fullAt = Date.now(); lv._maxT = 0; for (const k in v) if (v[k] && v[k].t > lv._maxT) lv._maxT = v[k].t;
    return N.sanitize(lv, await N.trustCells(lv, v, 8000));
  };
  // 挑みなおす前に、ほかの人の新しい屍を読む（前に読んだときより新しい分だけ）
  N.syncCells = async function (lv, mine) {
    if (!lv._raw) return null;
    let v = null;
    try { v = await rest('sh_cells/' + lv.f, { orderBy: 't', startAt: (lv._maxT || 0) + 1 }); }
    catch (e) { if (Date.now() - (lv._fullAt || 0) < 30000) return null; v = await rest('sh_cells/' + lv.f); lv._raw = {}; lv._fullAt = Date.now(); }
    for (const k in v || {}) { if (!v[k]) continue; lv._raw[k] = v[k]; if (v[k].t > lv._maxT) lv._maxT = v[k].t; }
    // 確かめた屍だけ ＋ 自分の屍で、まだ届いていないもの
    const raw = Object.assign({}, await N.trustCells(lv, lv._raw, 4000));
    for (const [k, c] of mine || []) { const key = (k % lv.w) + '_' + Math.floor(k / lv.w); if (!raw[key]) raw[key] = { n: c.n, l: c.last, t: c.t || 0 }; }
    return N.sanitize(lv, raw);
  };
  // =============================================
  //  死んだ：屍を＋1、死んだ数、いちばん先、屍の碑
  // =============================================
  N.died = function (lv, place, name, maxX, rec, cor, ticks) {
    const f = lv.f, mx = Math.min(lv.goal, Math.floor(maxX)), cp = place && !place.vanish ? 'sh_cells/' + f + '/' + place.x + '_' + place.y : null;
    return inLane('c', 800, () => tx(async inc => {
      await N.token();
      const [cur, st] = await Promise.all([cp && !inc ? rest(cp) : null, rest('sh_stat/' + f)]);
      const w = { ['sh_u/' + N.uid + '/c']: SV, ['sh_stat/' + f + '/d']: inc ? INC : ((st && st.d) || 0) + 1, ['sh_grave/' + pid()]: { n: name, f, t: SV } };
      if (!(st && st.m >= mx)) w['sh_stat/' + f + '/m'] = mx;
      // 屍を置く：だれがどこに置いたかの記録（sh_dlog）をいっしょに書く
      let nv = null;
      if (cp) { const g = pid(); nv = { n: inc ? INC : ((cur && cur.n) || 0) + 1, l: name, t: SV, g }; w[cp] = nv; w['sh_dlog/' + f + '/' + g] = { p: place.x + '_' + place.y, u: N.uid, t: SV, v: 1 }; w['sh_drec/' + f + '/' + g] = { r: String(rec || '').slice(0, 20000), c: String(cor || '').slice(0, 30000), k: Math.max(1, ticks | 0) }; }
      return { w, r: nv };
    }));
  };
  // =============================================
  //  クリア
  // =============================================
  N.corStr = cor => { const W = []; for (const k of cor.keys()) W.push(k); return W.sort((a, b) => a - b).map(k => k.toString(36)).join('.'); };
  N.corParse = (s, w) => { const m = new Map(); for (const v of String(s || '').split('.')) { if (!v) continue; const k = parseInt(v, 36); if (k >= 0) m.set(k, { n: 1, last: '' }); } return m; };
  // full：操作の記録ごと残す（まだだれも確かに越えていない層のとき）。でなければ数だけ
  N.clear = function (lv, name, xid, recStr, corStr, ticks, full) {
    const f = lv.f;
    return inLane('k', 4300, () => tx(async inc => {
      await N.token();
      const [st, op, wn] = await Promise.all([rest('sh_stat/' + f), full ? rest('sh_open/' + f) : null, full ? restMe('sh_u/' + N.uid + '/w/' + f).catch(() => null) : null]);
      if (+wn >= 3) full = false;   // 1つの層で越えた記録を出せるのは3回まで
      const w = { ['sh_u/' + N.uid + '/k']: SV, ['sh_stat/' + f + '/f']: inc ? INC : ((st && st.f) || 0) + 1 };
      if (!(st && st.m >= lv.goal)) w['sh_stat/' + f + '/m'] = lv.goal;
      let id = null, opened = false;
      if (full) {
        id = pid(); w['sh_clear/' + f + '/' + id] = { n: name, x: xid || '', t: SV, r: recStr, c: corStr, k: ticks, u: N.uid }; w['sh_u/' + N.uid + '/w/' + f] = (+wn || 0) + 1;
        if (!op) { w['sh_open/' + f] = { t: SV, n: name, x: xid || '', id, u: N.uid }; opened = true; }
      }
      return { w, r: { id, opened } };
    }));
  };
  N.setXid = async function (f, id, xid, open) {   // あとからXのIDを入れる（記録を書いた本人だけ・15分以内）
    const jobs = [update({ ['sh_clear/' + f + '/' + id + '/x']: xid })];
    if (open) jobs.push(update({ ['sh_open/' + f + '/x']: xid }));
    const r = await Promise.allSettled(jobs);
    if (r[0].status !== 'fulfilled') throw r[0].reason;
  };
  // 越えた記録が本当か：屍は「そのときある屍」→「いまある屍」の中にあること、操作をやりなおしてゴールできること
  N.verifyClear = function (lv, c, cells, resetT) {
    if (!c || typeof c.r !== 'string' || typeof c.c !== 'string' || typeof c.t !== 'number') return false;
    const snap = N.corParse(c.c, lv.w);
    if (!resetT || c.t > resetT) { for (const k of snap.keys()) if (!cells.has(k)) return false; }
    // 屍の形が正しいか（宙に浮いた屍などはだめ）
    const raw = {}; for (const k of snap.keys()) raw[(k % lv.w) + '_' + Math.floor(k / lv.w)] = { n: 1 };
    const san = N.sanitize(lv, raw); if (san.size !== snap.size) return false;
    // 申告した時間までに本当にゴールしていること（長い記録で計算を重くされないように）
    if (!(c.k >= 1)) return false;
    const r = SH.verify(lv, snap, c.r, Math.min(120 * 60 * 8, (c.k | 0) + 2));
    return r.ok;
  };
  // 越えた記録の確かめを、別の所（stuck-worker.js）で計算する。使えないときはここで
  let vw = null, vwid = 0; const vcb = {};
  function vWorker() {
    if (vw !== null) return vw;
    try {
      if (typeof Worker === 'undefined' || typeof document === 'undefined') return (vw = false);
      vw = new Worker('js/stuck-worker.js?v=' + (SH.VER || '0'));
      vw.onmessage = ev => { const f = vcb[ev.data.id]; if (f) { delete vcb[ev.data.id]; f(ev.data); } };
      vw.onerror = () => { vw = false; for (const k in vcb) { const f = vcb[k]; delete vcb[k]; f({ err: 'worker' }); } };
    } catch (e) { vw = false; }
    return vw;
  }
  N.verifyAsync = function (lv, c, cells, rs) {
    const w = vWorker(), sync = () => N.verifyClear(lv, c, cells, rs);
    if (!w) return Promise.resolve(sync());
    return new Promise(res => {
      const id = ++vwid, tm = setTimeout(() => { if (vcb[id]) { delete vcb[id]; res(sync()); } }, 60000);
      vcb[id] = d => { clearTimeout(tm); res(d.err ? sync() : !!d.ok); };
      try { w.postMessage({ type: 'verify', id, lv: { f: lv.f, w: lv.w, h: lv.h, tiles: lv.tiles, cap: lv.cap, ents: lv.ents, goal: lv.goal, start: lv.start }, c: { t: c.t, r: c.r, c: c.c, k: c.k }, cells, rs }); }
      catch (e) { clearTimeout(tm); delete vcb[id]; res(sync()); }
    });
  };
  // その層の、はじめて越えた本当の人（いちばん早い記録から順に確かめる）
  //  にせの記録を大量に入れられても進めるように：
  //   ・10こずつ古い順に読む。1回に確かめるのは計算の量で決めた分まで（足りなければ、次に呼ばれたときに続きから）
  //   ・にせだった記録の時刻を覚えておく（shiin_vc）。そこより古いものは二度と読まない・計算しない
  const VC = () => store('shiin_vc') || {};
  N.firstClear = async function (lv, cells, variants) {
    const f = lv.f, rs = await rest('sh_reset/' + f + '/t').catch(() => null);
    const vc = VC(); let cur = vc[f] && vc[f].rs === (rs || 0) ? vc[f].t : 0;
    let budget = 120 * 60 * 120;   // 1回に計算する量（2時間ぶんの動き）。足りなければ N.more を立てて、呼んだ側がすぐ続ける
    N.more = false;
    for (let page = 0; page < 30 && budget > 0; page++) {
      const v = await rest('sh_clear/' + f, { orderBy: 't', startAt: cur + 1, limitToFirst: 10 });
      const list = Object.entries(v || {}).map(([id, c]) => Object.assign({ id }, c)).filter(c => typeof c.t === 'number' && c.t > cur).sort((a, b) => a.t - b.t);
      if (!list.length) return null;
      for (const c of list) {
        if (budget <= 0) { N.more = true; return null; }
        budget -= Math.min(120 * 60 * 8, Math.max(1, c.k | 0)) * (1 + (variants || []).length);
        if (await N.verifyAsync(lv, c, cells, rs)) { c._lv = lv; return c; }
        // 層を直したことがあるときは、昔の版でも確かめる（越えた人が遊んだ版で計算しなおす）
        let okOld = null;
        for (const old of (variants || [])) { const raw = lv._raw; if (!raw) break; if (await N.verifyAsync(old, c, N.sanitize(old, raw), rs)) { okOld = old; break; } }
        if (okOld) { c._lv = okOld; return c; }
        // にせ（または今の屍では成り立たない）：ここまでは覚えておく
        cur = c.t; const o = VC(); o[f] = { t: cur, rs: rs || 0 }; store('shiin_vc', o);
      }
      if (list.length < 10) return null;
    }
    N.more = true; return null;
  };
  // =============================================
  //  全体：開いた層・各層の数字・屍の碑
  // =============================================
  N.overview = async function () {
    const [open, stat, ck] = await Promise.all([rest('sh_open'), rest('sh_stat').catch(() => null), rest('sh_ckpt').catch(() => null)]);
    // 番号のキーは配列で返ってくることがある（先頭が null）。ふつうの入れものになおす
    const obj = v => { const o = {}; if (v && typeof v === 'object') for (const k in v) if (v[k] && typeof v[k] === 'object') o[k] = v[k]; return o; };
    return { open: obj(open), stat: obj(stat), ckpt: typeof ck === 'number' ? ck : null };
  };
  N.grave = async function (n) { const v = await rest('sh_grave', { orderBy: 't', limitToLast: n || 100 }); return Object.values(v || {}).filter(g => g && g.n).sort((a, b) => b.t - a.t); };
  // 詰みの知らせ
  N.report = function (f, maxX, auto) {
    return inLane('r', 10500, () => tx(async () => { await N.token(); return { w: { ['sh_u/' + N.uid + '/r']: SV, ['sh_rep/' + f + '/' + pid()]: { t: SV, m: Math.floor(maxX), a: auto ? 1 : 0 } }, r: true }; }, 3));
  };
  N.reports = async function () { return (await rest('sh_rep')) || {}; };
  // ---------- 管理（管理のかぎを、この端末の匿名IDに登録してから） ----------
  N.adminLogin = async function (key) { await N.token(); await restWrite('PUT', 'sh_admins/' + N.uid, String(key)); return N.uid; };
  // その層の屍をぜんぶ消す
  N.resetFloor = async function (f) { await update({ ['sh_cells/' + f]: null, ['sh_dlog/' + f]: null, ['sh_drec/' + f]: null, ['sh_rm/' + f]: { t: SV }, ['sh_rep/' + f]: null, ['sh_reset/' + f]: { t: SV } }); };
  // 第from層から上を、まだだれも越えていない状態に戻す（越えた記録・開いた印・数・知らせ・碑、屍もえらべる）
  N.closeFrom = async function (from, withCells) {
    const w = {};
    for (let f = from; f <= 100; f++) {
      w['sh_open/' + f] = null; w['sh_clear/' + f] = null; w['sh_stat/' + f] = null; w['sh_rep/' + f] = null; w['sh_reset/' + f] = { t: SV };
      if (withCells) { w['sh_cells/' + f] = null; w['sh_dlog/' + f] = null; w['sh_drec/' + f] = null; w['sh_rm/' + f] = { t: SV }; }
    }
    await update(w);
    // 屍の碑（第from層より上のもの）
    const g = await rest('sh_grave', { orderBy: 't', limitToLast: 5000 }).catch(() => null);
    const del = {}; let n = 0;
    for (const id in g || {}) if (g[id] && +g[id].f >= from) { del['sh_grave/' + id] = null; n++; }
    if (n) await update(del);
    return n;
  };
  N.setCkpt = async function (f) { await restWrite('PUT', 'sh_ckpt', f); };
  // その層に屍を置いた人ごとのまとめ（sh_dlog）
  N.dlog = async function (f) {
    const v = await rest('sh_dlog/' + f) || {}, by = new Map();
    for (const id in v) { const d = v[id]; if (!d || typeof d.u !== 'string' || typeof d.p !== 'string') continue; const m = /^(\d+)_(\d+)$/.exec(d.p); if (!m) continue;
      const g = by.get(d.u) || { u: d.u, n: 0, first: Infinity, last: 0, minX: Infinity, maxX: 0, ids: [], ps: [] };
      g.n++; g.first = Math.min(g.first, d.t || 0); g.last = Math.max(g.last, d.t || 0); g.minX = Math.min(g.minX, +m[1]); g.maxX = Math.max(g.maxX, +m[1]); g.ids.push(id); g.ps.push(d.p); by.set(d.u, g); }
    return [...by.values()].sort((a, b) => b.n - a.n);
  };
  // その人の屍だけ取り除く（その場所の数を1つずつ減らす。0になったら消す）。だれがどこに置いたかの記録も消す
  N.removeBy = async function (f, g) {
    const cells = await rest('sh_cells/' + f) || {}, dec = {}, w = {};
    for (const p of g.ps) dec[p] = (dec[p] || 0) + 1;
    for (const p in dec) { const c = cells[p]; if (!c) continue; const n = (c.n | 0) - dec[p]; w['sh_cells/' + f + '/' + p] = n >= 1 ? Object.assign({}, c, { n }) : null; }
    for (const id of g.ids) { w['sh_dlog/' + f + '/' + id] = null; w['sh_drec/' + f + '/' + id] = null; }
    w['sh_rm/' + f] = { t: SV };   // 端末が覚えた確かめを、やりなおす合図
    // 一度に書きすぎないように分ける
    const keys = Object.keys(w); for (let i = 0; i < keys.length; i += 400) { const part = {}; for (const k of keys.slice(i, i + 400)) part[k] = w[k]; await update(part); }
    return Object.keys(dec).length;
  };
  // にせの越えた記録を消す（ids）。開いた印がにせなら、それも
  //  数字も直す：越えた人はにせの分だけ減らす。本物がない（開いた印もにせ）なら、いちばん先はゴールの手前まで
  N.purge = async function (f, ids, openToo, goal) {
    const w = {}; for (const id of ids) w['sh_clear/' + f + '/' + id] = null;
    if (openToo) w['sh_open/' + f] = null;
    const st = await rest('sh_stat/' + f).catch(() => null);
    if (st && typeof st.f === 'number' && ids.length) w['sh_stat/' + f + '/f'] = Math.max(0, st.f - ids.length);
    if (st && openToo && goal && typeof st.m === 'number' && st.m >= goal) w['sh_stat/' + f + '/m'] = goal - 1;
    if (Object.keys(w).length) await update(w);
  };
})(typeof window !== 'undefined' ? window : globalThis);
