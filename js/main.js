// =============================================
//  シインクラッド  画面と流れ
//   タイトル → 最新の層に挑む／層をえらぶ（練習・見る）／屍の碑／あそびかた
//   挑む：毎回ちがう名前。死ぬとその場所に屍。すぐ次の名前で挑みなおし
//   越えた：「○人の屍を超えて、第○層突破！」。はじめて越えた人はXのIDを残せる
// =============================================
(function (G) {
  const SH = G.SH, T = SH.T, NET = SH.NET, SND = SH.SND, PW = SH.PHYS.PW, PH = SH.PHYS.PH;
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Number(n || 0).toLocaleString('ja-JP');
  const URL_GAME = 'https://nasubi-no-oniwa.github.io/shiincrad/';
  const GY = 11;
  SH.VER = '34';   // 層のデータを変えたら上げる（古いものを読まないように）
  // ---------- 名前（毎回ちがう） ----------
  const PRE = ['さびた', '七番目の', '名もなき', 'はぐれ', 'ねむれる', 'しろい', 'くろい', 'ちいさな', 'さいごの', 'まよえる', 'はじめての', 'かけだしの', 'うつろな', 'とおくの', 'ひとりの', 'のろわれた', 'ほこりの', 'わすれられた', 'かなしき', 'あおい', 'あかい', 'みどりの', 'よわきの', 'ほしふる', 'つきなき', 'あさやけの', 'ゆうぐれの', 'こごえた', 'ねぼけた', 'まっすぐな', 'おくびょうな', 'むこうみずな', 'ひかえめな', 'おおぐらいの', 'ふるえる', 'よろめく', 'まがった', 'うたう', 'かぞえる', 'ちりぢりの'];
  const NAME = ['ノルド', 'ミナ', 'カイ', 'ルカ', 'トト', 'ハル', 'シノ', 'ユウ', 'レン', 'アオ', 'ソラ', 'イオ', 'ナギ', 'リク', 'コハ', 'セツ', 'ウタ', 'ロイ', 'マオ', 'キリ', 'ヨミ', 'ツバキ', 'ハク', 'クロ', 'モモ', 'スズ', 'テオ', 'ニコ', 'ヒバリ', 'フウ', '旅人', '剣士', '番兵', '巡礼者', '見習い', '鍛冶屋', '吟遊詩人', '墓守', '学者', '商人', '騎士', '弓兵', '薬師', '漁師'];
  const newName = () => { const p = PRE[Math.floor(Math.random() * PRE.length)], n = NAME[Math.floor(Math.random() * NAME.length)]; return (p + n).slice(0, 12); };
  // ---------- 自分の記録（この端末） ----------
  const ME = Object.assign({ dead: 0, clears: {}, best: {}, seen: {}, fake: {}, tut: 0 }, NET.store('shiin_me') || {});
  if (!ME.fv || ME.fv < 3) { ME.fake = {}; ME.okOpen = {}; ME.ok3 = {}; ME.ng3 = {}; ME.fv = 3; }   // 確かめ方を変えたので、前の判断はやりなおす
  ME.ok3 = ME.ok3 || {}; ME.ng3 = ME.ng3 || {};
  const saveMe = () => NET.store('shiin_me', ME);
  // ---------- 層を読む（20層ずつ） ----------
  const chunks = {}; let INDEX = null;
  async function getIndex() { if (INDEX) return INDEX; const r = await fetch('levels/index.json?v=' + SH.VER); INDEX = await r.json(); return INDEX; }
  function rleDecode(s, n) { const a = new Uint8Array(n); let i = 0, p = 0; while (p < s.length) { const c = s.charCodeAt(p) - 97; p++; let k = ''; while (p < s.length && s[p] >= '0' && s[p] <= '9') k += s[p++]; const m = k ? +k : 1; a.fill(c, i, i + m); i += m; } return a; }
  async function getLevel(f) {
    const ci = Math.ceil(f / 20);
    if (!chunks[ci]) chunks[ci] = fetch('levels/l' + ci + '.json?v=' + SH.VER).then(r => r.json());
    const recs = await chunks[ci], r = recs.find(x => x.f === f); if (!r) throw new Error('層がありません');
    if (r._lv) return r._lv;
    // 層を直したことがあるときの昔の版（屍の確かめにも使う）
    NET.variants = NET.variants || {}; if (!(f in NET.variants)) NET.variants[f] = await getVariants(f);
    return r._lv = decodeRec(r);
  }
  function decodeRec(r) {
    const H = 16, f = r.f;
    return { f, name: r.n, theme: Math.ceil(f / 5) - 1, w: r.w, h: H, tiles: rleDecode(r.t, r.w * H), cap: Int8Array.from(r.c.split('').map(Number)), ents: r.e, goal: r.g, boss: r.b, q: r.q, dark: r.dk, cave: r.cv, need: r.need, start: { x: 2.1, y: GY - PH } };
  }
  SH.getLevel = getLevel;
  // 直す前の版（越えた記録を確かめるときに使う）
  let HIST = null;
  async function getVariants(f) { try { if (!HIST) HIST = fetch('levels/hist.json?v=' + SH.VER).then(r => r.ok ? r.json() : {}); const h = await HIST; return (h[f] || []).map(decodeRec); } catch (e) { return []; } }
  // ---------- 全体の状態 ----------
  // ---------- 全体の状態 ----------
  //  「開いた」の印（sh_open）は信じない。その層の越えた記録を、この端末で計算しなおして確かめた層だけ開く。
  //  ckpt（管理人が確かめた層）までは確かめずに開く。そこから上は、下の層から順に1つずつ確かめる
  const CK0 = 60;   // この版を出したときに確かめ済みの層
  const W = { open: {}, stat: {}, latest: 1, loaded: false, ckpt: CK0 };
  const okFloor = f => { const o = W.open[f]; if (!o) return false; if (f <= W.ckpt) return true; const v = ME.ok3[f]; return !!(v && v.t === o.t); };
  // その層をはじめて越えた人（確かめた記録の名前。管理人が確かめた層は印のまま）
  const opener = f => { const o = W.open[f]; if (!o || !okFloor(f)) return null; if (f <= W.ckpt) return o; const v = ME.ok3[f]; if (v.mine) return { t: o.t, n: NET.cleanName(o.n) || '名無し', x: NET.cleanX(o.x), id: o.id };   // 確かめ中：ひとまず開いた印の人
    return { t: o.t, n: v.n, x: o.id === v.id && o.x ? o.x : v.x, id: v.id }; };
  // 見せる数字：「いちばん先」と「越えた人」はにせのクリアで書きかえられるので、本当に越えたと確かめた層だけそのまま見せる
  //  確かめていない層：いちばん先はゴールの手前まで（99%まで）、越えた人は0
  //  確かめていない層の「いちばん先」は、確かな根拠（確かめた屍の一番奥・本物だった挑戦が行けた一番奥）までにする
  const shownStat = (f, g) => {
    const st = W.stat[f] || {}; if (okFloor(f)) return st;
    const ev = NET.far && NET.far[f] !== undefined ? NET.far[f] : Infinity;   // まだ確かめていない間は、ゴールの手前までで出しておく
    return Object.assign({}, st, { m: Math.min(st.m || 0, ev, Math.max(0, (g || 1) - 1)), f: 0 });
  };
  function computeLatest() {
    let L = 1; while (L <= 100 && okFloor(L)) L++;
    W.done = L > 100; W.latest = Math.min(100, L); return W.latest;
  }
  // 下から順に、まだ確かめていない「開いた」層を確かめる
  let chainP = null;
  function verifyChain() {
    if (chainP) return chainP;
    chainP = (async () => {
      for (let n = 0; n < 100; n++) {
        const f = computeLatest(); if (W.done) break;
        const o = W.open[f]; if (!o || f <= W.ckpt) break;
        const ng = ME.ng3[f]; if (ng && ng.t === o.t && Date.now() - ng.at < 300000) break;   // さっきだめだった印は5分あける
        let c = null, lv2 = null;
        try {
          lv2 = await getLevel(f);
          // 2回目からは、増えた屍だけ読む（屍の確かめの続き）
          let cells = lv2._raw ? await NET.syncCells(lv2, new Map()).catch(() => null) : null;
          if (!cells) cells = await NET.loadCells(lv2);
          c = await NET.firstClear(lv2, cells, await getVariants(f));
        }
        catch (e) { break; }   // 読めない → あとで
        if (W.open[f] !== o) continue;
        if (c) { ME.ok3[f] = { t: o.t, id: c.id, n: NET.cleanName(c.n) || '名無し', x: NET.cleanX(c.x) }; delete ME.ng3[f]; saveMe(); computeLatest(); title.paint(); }
        else if (NET.more) { if (lv2 && lv2._dvMore) await new Promise(r => setTimeout(r, 1500)); continue; }   // 確かめの途中 → 少しあけて続きを（にせだった所は覚えているので、同じ計算はしない）
        else { ME.ng3[f] = { t: o.t, at: Date.now() }; saveMe(); break; }
      }
    })().finally(() => { chainP = null; });
    return chainP;
  }
  // 最新の層の「道ができた」を出すために、その層の屍を裏で確かめておく（遊ぶときにも使うので無駄にならない）
  let farP = null;
  function loadFar() {
    const f = W.latest; if (farP || W.done || (NET.far && NET.far[f] !== undefined && NET.far['_t' + f] > Date.now() - 600000)) return;
    farP = getLevel(f).then(lv => NET.loadCells(lv)).then(() => { NET.far['_t' + f] = Date.now(); title.paint(); }).catch(() => { }).finally(() => { farP = null; });
  }
  let refAt = 0;
  async function refresh(force) {
    if (!force && W.loaded && Date.now() - refAt < 60000) { computeLatest(); title.paint(); loadLive().then(() => title.paint()).catch(() => { }); return; }
    refAt = Date.now();
    try { const o = await NET.overview(); W.open = o.open; W.stat = o.stat; W.ckpt = o.ckpt == null ? CK0 : o.ckpt; W.loaded = true; } catch (e) { W.loaded = false; }
    computeLatest(); title.paint();
    loadLive().then(() => title.paint()).catch(() => { });
    if (W.loaded) verifyChain().then(() => { title.paint(); loadFar(); }).catch(() => { });
  }
  const totalDead = () => { let n = 0; for (const k in W.stat) n += (W.stat[k] && W.stat[k].d) || 0; return n; };
  // ---------- 画面の切りかえ ----------
  const screens = ['title', 'select', 'game', 'grave', 'how', 'clearbox', 'admin'];
  function show(id) { for (const s of document.querySelectorAll('.screen')) s.classList.toggle('on', s.id === id); }
  function modal(id, on) { $(id).classList.toggle('on', !!on); }
  let toastT = 0;
  function toast(a, b, ms) { const e = $('toast'); e.innerHTML = esc(a) + (b ? `<small>${esc(b)}</small>` : ''); e.classList.add('in'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('in'), ms || 1600); }
  void screens;
  // =============================================
  //  タイトル
  // =============================================
  const title = {
    paint() {
      const L = W.latest, ix = INDEX && INDEX[L - 1];
      $('t-latest').innerHTML = W.done ? '全100層　制覇' : `第<b>${L}</b>層　${esc(ix ? ix.n : '')}`;
      $('t-total').textContent = fmt(totalDead());
      const g = ix ? ix.g : 0, st = shownStat(L, g);
      $('t-road').textContent = g ? Math.min(100, Math.floor(((st.m || 0) / g) * 100)) + '%' : '0%';
      $('t-ldead').textContent = fmt(st.d || 0);
      $('go-latest').textContent = W.done ? '頂をながめる' : `第${L}層に挑む`;
      $('t-end').style.display = W.done ? '' : 'none';
      // 開いた知らせ（新しい順）
      const news = Object.keys(W.open).map(Number).filter(f => okFloor(f)).map(f => ({ f, o: opener(f) })).sort((a, b) => b.o.t - a.o.t).slice(0, 12);
      const liveTk = LIVE.list.map(x => `🔴 ${esc(x.n)}さんが配信中${x.m ? '（' + esc(x.m) + '）' : ''}`);
      const tk0 = news.length ? news.map(({ f, o }) => `${ago(o.t)}　第${f + 1 > 100 ? 100 : f + 1}層が開いた ── 第${f}層を越えたのは「${esc(o.n)}」${o.x ? '（@' + esc(o.x) + '）' : ''}`).join('　　◆　　') : 'まだだれも第1層を越えていない。最初の屍になれ。';
      const tk = liveTk.concat([tk0]).join('　　◆　　');
      $('ticker').innerHTML = `<span>${tk}</span>`;
      $('ticker').firstChild.style.animationDuration = Math.max(14, tk.length * 0.22) + 's';
    },
  };
  // ---------- エンドロール ----------
  //  数字（かかった時間・みんなの屍）→ 第1〜99層を初めて越えた人 → 第100層（初めて越えた人・最速の人）→ Thank you for playing
  //  背景には、プレイヤーの箱が雨のように降る
  const START_T = Date.parse('2026-10-20T18:17:00+09:00');   // 公開した日時
  async function fastest100() {
    try {
      // 越えた記録は操作の記録つきで重いので、まず名前の一覧だけ → かかった時間（k）だけ → 速い順に中身を読んで確かめる
      const lv = await getLevel(100), [ids, raw, rs] = await Promise.all([NET.rest('sh_clear/100', { shallow: true }).then(v => Object.keys(v || {})), NET.rest('sh_cells/100').then(v => v || {}), NET.rest('sh_reset/100/t').catch(() => null)]);
      const cells = NET.sanitize(lv, raw), ks = [];
      for (let i = 0; i < ids.length; i += 24) await Promise.all(ids.slice(i, i + 24).map(id => NET.rest('sh_clear/100/' + id + '/k').then(k => { if (k >= 1) ks.push({ id, k }); }).catch(() => { })));
      ks.sort((a, b) => a.k - b.k);
      for (const { id } of ks.slice(0, 15)) { const c = await NET.rest('sh_clear/100/' + id).catch(() => null); if (c && await NET.verifyAsync(lv, c, cells, rs)) return c; }   // にせの記録は飛ばす
    } catch (e) { }
    return null;
  }
  let endOn = null;
  // me：クリアした者（{ n, x }）。なければ、自分が前に越えた名前 → 初めて越えた人
  async function playEnding(me) {
    if (endOn) return endOn;
    const box = $('ending'), roll = $('end-roll'), ty = $('end-ty'), cv = $('end-cv');
    roll.innerHTML = '<p class="e-num">読みこんでいます…</p>'; ty.classList.remove('on'); box.classList.add('on');
    const wasPaused = S.paused; S.paused = true;
    SND.unlock(); SND.bgm('end');
    endOn = new Promise(async done => {
      let stop = false, raf = 0;
      const finish = () => { if (stop) return; stop = true; cancelAnimationFrame(raf); box.classList.remove('on'); SND.bgm(null); S.paused = wasPaused; endOn = null; done(); };
      $('end-skip').onclick = finish;
      // 背景：箱の雨
      const g = cv.getContext('2d'), drops = [];
      const fit = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); cv.width = r.width * d; cv.height = r.height * d; g.setTransform(d, 0, 0, d, 0, 0); };
      fit(); addEventListener('resize', fit);
      const W0 = () => cv.width / (Math.min(2, window.devicePixelRatio || 1)), H0 = () => cv.height / (Math.min(2, window.devicePixelRatio || 1));
      const drop = top => { const s = 8 + Math.random() * 16; return { x: Math.random() * W0(), y: top ? -s - Math.random() * H0() : Math.random() * H0(), s, v: 40 + s * 4 + Math.random() * 40, h: Math.floor(Math.random() * 360), a: 0.15 + Math.random() * 0.3 }; };
      for (let i = 0; i < 70; i++) drops.push(drop(false));
      // 中身
      try { if (!W.loaded) { const o = await NET.overview(); W.open = o.open; W.stat = o.stat; W.ckpt = o.ckpt == null ? CK0 : o.ckpt; W.loaded = true; } } catch (e) { }
      const fast = await fastest100();
      if (stop) return;
      const endT = (W.open[100] && W.open[100].t) || NET.now(), span = Math.max(0, endT - START_T), dd = Math.floor(span / 86400000), hh = Math.floor((span % 86400000) / 3600000);
      let hard = 1, hardD = -1; for (let f = 1; f <= 100; f++) { const d = (W.stat[f] && W.stat[f].d) || 0; if (d > hardD) { hardD = d; hard = f; } }
      const who = f => { const o = opener(f) || W.open[f]; return o ? `${esc(NET.cleanName(o.n) || '名無し')}${o.x ? ' <small style="display:inline">@' + esc(NET.cleanX(o.x)) + '</small>' : ''}` : '&nbsp;'; };
      let h = `<p class="e-num">全100層<b>${dd}日${hh}時間</b></p><p class="e-num">みんなの屍<b>${fmt(totalDead())}人</b></p><h3>到達者</h3>`;
      for (let f = 1; f <= 99; f++) h += `<p class="e-fl"><small>第${f}層${f === hard ? '<em>最難関</em>' : ''}</small>${who(f)}</p>`;
      h += `<h3>第100層　頂${hard === 100 ? '<em style="font-style:normal;color:#ff8a7a;font-size:13px;margin-left:6px">最難関</em>' : ''}</h3>`;
      const meW = me && me.n ? `${esc(NET.cleanName(me.n) || '名無し')}${me.x ? ' <small style="display:inline">@' + esc(NET.cleanX(me.x)) + '</small>' : ''}` : who(100);
      h += `<p class="e-top"><i>クリアした者</i>${meW}</p>`;
      h += `<p class="e-top"><i>最速</i>${fast ? `${esc(NET.cleanName(fast.n) || '名無し')}${fast.x ? ' <small style="display:inline">@' + esc(NET.cleanX(fast.x)) + '</small>' : ''}　${(fast.k / 120).toFixed(1)}秒` : '&nbsp;'}</p>`;
      roll.innerHTML = h;
      // 流す：2分ほどで流れきる
      const H = () => H0(), RH = roll.offsetHeight, dur = 110000, t0 = performance.now();
      let tyAt = 0;
      const frame = now => {
        if (stop) return;
        const dt = Math.min(0.05, (now - (frame.last || now)) / 1000); frame.last = now;
        g.clearRect(0, 0, W0(), H0());
        for (const d of drops) {
          d.y += d.v * dt; if (d.y > H0() + 30) Object.assign(d, drop(true), { y: -30 });
          g.globalAlpha = d.a; const X = Math.round(d.x), Y = Math.round(d.y), s = Math.round(d.s);
          g.fillStyle = `hsl(${d.h},70%,58%)`; g.fillRect(X, Y, s, s);
          g.fillStyle = `hsl(${d.h},80%,72%)`; g.fillRect(X, Y, s, Math.max(2, Math.round(s * 0.18)));
          g.fillStyle = '#1a1520'; const e = Math.max(2, Math.round(s * 0.13)); g.fillRect(X + Math.round(s * 0.55), Y + Math.round(s * 0.38), e, e + 1); g.fillRect(X + Math.round(s * 0.77), Y + Math.round(s * 0.38), e, e + 1);
        }
        g.globalAlpha = 1;
        const p = Math.min(1, (now - t0) / dur);
        roll.style.transform = `translateY(${Math.round(H() - p * (RH + H()))}px)`;
        if (p >= 1) { if (!tyAt) { tyAt = now; ty.classList.add('on'); $('end-skip').textContent = 'とじる'; } if (now - tyAt > 9000) return finish(); }
        raf = requestAnimationFrame(frame);
      };
      $('end-skip').textContent = 'とばす';
      raf = requestAnimationFrame(frame);
    });
    return endOn;
  }
  $('t-end').onclick = () => { playEnding(ME.end100 ? { n: ME.end100.n, x: NET.store('shiin_xid') || '' } : null).then(() => title.paint()); };
  // ---------- 配信中の人 ----------
  //  タイトルでは開いたときに読む（1分に1回まで）。ゲーム中は、生き返るときに5分に1回だけ読みなおす
  const LIVE = { list: [], at: 0 };
  async function loadLive(force) {
    if (!force && Date.now() - LIVE.at < 60000) return LIVE.list;
    LIVE.at = Date.now();
    try { LIVE.list = await NET.live(); } catch (e) { }
    paintLive(); return LIVE.list;
  }
  function paintLive() { const on = LIVE.list.length > 0; $('t-live').style.display = on ? '' : 'none'; $('g-live').style.display = on ? '' : 'none'; }
  const liveHost = u => { try { const h = new URL(u).hostname.replace(/^www\./, ''); return /youtu/.test(h) ? 'YouTube' : /twitch/.test(h) ? 'Twitch' : /nicovideo|nico\.ms/.test(h) ? 'ニコニコ' : /twitcasting/.test(h) ? 'ツイキャス' : /tiktok/.test(h) ? 'TikTok' : /(x|twitter)\.com/.test(h) ? 'X' : h; } catch (e) { return ''; } };
  function openLive() {
    const L = LIVE.list;
    $('live-list').innerHTML = L.length ? L.map(x => `<a href="${esc(x.u)}" target="_blank" rel="noopener noreferrer"><b>${esc(x.n)}</b> さん　<span>${esc(liveHost(x.u))}</span>${x.m ? `<small>${esc(x.m)}</small>` : ''}</a>`).join('') : '<p>いまは配信中の人はいません。</p>';
    modal('livebox', 1); if ($('game').classList.contains('on')) S.paused = true;
  }
  $('t-live').onclick = () => openLive();
  $('g-live').onclick = () => openLive();
  $('live-close').onclick = () => { modal('livebox', 0); if ($('game').classList.contains('on')) S.paused = false; };
  function checkLiveInGame() {
    if (Date.now() - LIVE.at < 300000) return;
    const before = new Set(LIVE.list.map(x => x.id));
    loadLive(true).then(list => { const nw = list.filter(x => !before.has(x.id)); if (nw.length && S.run && $('game').classList.contains('on')) toast(`🔴 ${nw[0].n}さんが配信を始めました`, '右上の🔴から見に行けます', 2800); }).catch(() => { });
  }
  function ago(t) { const s = Math.max(0, (NET.now() - t) / 1000); if (s < 60) return 'たった今'; if (s < 3600) return Math.floor(s / 60) + '分前'; if (s < 86400) return Math.floor(s / 3600) + '時間前'; return Math.floor(s / 86400) + '日前'; }
  // =============================================
  //  層をえらぶ
  // =============================================
  async function openSelect() {
    show('select'); const idx = await getIndex(), L = W.latest;
    const box = $('sel-list'); box.innerHTML = '';
    for (let f = 1; f <= 100; f++) {
      const ix = idx[f - 1], st = W.stat[f] || {}, open = f <= L, cleared = f < L || (f === 100 && W.done);
      const el = document.createElement('button'); el.className = 'fl' + (open ? '' : ' lock') + (f % 25 === 0 ? ' gate' : f % 5 === 0 ? ' boss' : '') + (f === L && !W.done ? ' now' : '');
      el.innerHTML = `<b>${f}</b><small>${open ? esc(ix.n) : '？？？'}</small>${open ? `<i>屍 ${fmt(st.d || 0)}</i>` : ''}${ME.clears[f] ? '<u>越</u>' : ''}`;
      if (open) el.onclick = () => floorMenu(f, cleared);
      box.appendChild(el);
      if (f % 5 === 0 && f < 100) { const hr = document.createElement('div'); hr.className = 'tier'; hr.textContent = '── ' + (idx[f] ? idx[f].n : '') + ' ──'; box.appendChild(hr); }
    }
    const cur = box.querySelector('.now'); if (cur) cur.scrollIntoView({ block: 'center' });
  }
  async function floorMenu(f, cleared) {
    const ix = (await getIndex())[f - 1], st = shownStat(f, ix.g);
    $('fm-title').innerHTML = `第${f}層　${esc(ix.n)}`;
    const open = opener(f);
    $('fm-body').innerHTML = `<p>死んだ数 <b>${fmt(st.d || 0)}</b>　越えた人 <b>${fmt(st.f || 0)}</b><br>道ができた <b>${Math.min(100, Math.floor(((st.m || 0) / ix.g) * 100))}%</b>${ix.b ? `<br>番人：<b>${esc(ix.b)}</b>` : ''}${open ? `<br>はじめて越えた人：<b>${esc(open.n)}</b>${open.x ? ' @' + esc(open.x) : ''}` : ''}${ME.clears[f] ? `<br>あなたの記録：<b>${(ME.clears[f] / 120).toFixed(1)}秒</b>` : ''}</p>`;
    $('fm-play').textContent = f === W.latest && !W.done ? '挑む（最新の層）' : '練習する';
    $('fm-play').onclick = () => { modal('floormenu', 0); startFloor(f); };
    $('fm-watch').style.display = cleared ? '' : 'none';
    $('fm-watch').onclick = () => { modal('floormenu', 0); startFloor(f, { watch: true }); };
    const mm = myRuns()[f]; $('fm-mine').style.display = mm ? '' : 'none';
    $('fm-mine').onclick = () => { modal('floormenu', 0); S.myLast = null; watchMine(Object.assign({ f, best: true }, mm)); };
    modal('floormenu', 1);
  }
  // =============================================
  //  遊ぶ
  // =============================================
  const view = new SH.View($('cv'));
  const S = { lv: null, cor: new Map(), run: null, name: '', rec: null, mode: 'play', since: 0, keys: { l: 0, r: 0, j: 0 }, acc: 0, deadT: 0, best: 0, deathsHere: 0, watch: false, cam: 0, replay: null, ghost: null, first: null, pending: 0 };
  SH.S = S;
  async function startFloor(f, opt) {
    opt = opt || {};
    SND.unlock(); if (!opt.watch) NET.warm();   // 書きこむ前に、見えないIDをもらっておく
    show('game'); $('loading').classList.add('on');
    let lv, cor;
    try { lv = await getLevel(f); } catch (e) { $('loading').classList.remove('on'); toast('読みこめませんでした', '電波のよいところでもう一度'); show('title'); return; }
    try { cor = await NET.loadCells(lv); } catch (e) { cor = new Map(); toast('みんなの屍を読みこめませんでした', 'この端末の分だけで遊べます', 2600); }
    $('loading').classList.remove('on');
    S.lv = lv; S.cor = cor; S.nextCor = null; S.watch = !!opt.watch; S.latest = f === W.latest && !W.done;
    S.since = ME.seen[f] || 0; ME.seen[f] = NET.now(); saveMe();
    S.deathsHere = 0; S.reported = 0; S.best = ME.best[f] || 0; S.ghost = null; S.replay = null; S.first = null;
    view.setLevel(lv); view.resize();
    $('h-floor').textContent = f; $('h-fname').textContent = lv.name;
    $('h-mode').textContent = S.watch ? '見る' : (S.latest ? '' : '練習');
    $('game').classList.toggle('watching', S.watch);
    updateHud();
    SND.bgm(lv.theme);
    if (S.watch) { S.run = new SH.Run(lv, cor); S.run.hazard = () => null; S.cam = 0; view.follow(0, 8, true); $('w-mine').style.display = mineOf(f) ? '' : 'none'; if (opt.mine) { startReplay(opt.mine, true); S.follow = true; } loadFirst(!opt.mine); return; }   // 見るときも仕掛けは動かす（自分は描かない・死なない）
    if (f === 1) $('stone').style.display = ''; else $('stone').style.display = 'none';
    spawn(true);
    if (!ME.tut) { ME.tut = 1; saveMe(); openHow(); }
  }
  // はじめて越えた人の走りを探す。屍の確かめが途中のときは、確かめを続けてから探しなおす（見ている間ずっと）
  // ---------- 自分の走り ----------
  //  最速の走りはこの端末に残す（shiin_myrun）。最速でない走りは、タイトルに戻るまでだけ見られる（S.myLast）
  const myRuns = () => NET.store('shiin_myrun') || {};
  const mineOf = f => (S.myLast && S.myLast.f === f) ? S.myLast : (myRuns()[f] ? Object.assign({ f, best: true }, myRuns()[f]) : null);
  function watchMine(m) { startFloor(m.f, { watch: true, mine: m }); }
  async function loadFirst(play) {
    const lv = S.lv; S.firstLoading = true; S.wantReplay = false;
    try {
      for (;;) {
        const c = await NET.firstClear(lv, S.cor, await getVariants(lv.f));
        if (S.lv !== lv || !S.watch) return;
        if (c) { S.first = c; if (play || S.wantReplay) { startReplay(c); S.follow = true; } return; }
        if (!NET.more) return;
        // 屍の確かめの続き（確かめた屍は、見ている画面にも出す）
        const cells = lv._raw ? await NET.syncCells(lv, new Map()).catch(() => null) : null;
        if (S.lv !== lv || !S.watch) return;
        if (cells) S.cor = cells;
        await new Promise(r => setTimeout(r, 400));
      }
    } catch (e) { }
    finally { if (S.lv === lv) { S.firstLoading = false; S.wantReplay = false; } }
  }
  function startReplay(c, mine) {
    const snap = NET.corParse(c.c, S.lv.w);
    S.replay = { run: new SH.Run(c._lv || S.lv, snap), inp: SH.Rec.parse(c.r), name: c.n, x: c.x };
    if (mine) toast(`あなた「${c.n}」の走り（${(c.k / 120).toFixed(1)}秒）`, c.best ? '最速の走り' : '最速ではないので、タイトルに戻ると消えます', 2600);
    else toast(`はじめて越えた「${c.n}」の走り`, '屍は「そのときの屍」です', 2200);
  }
  function spawn(first) {
    if (S.nextCor) { S.cor = S.nextCor; S.nextCor = null; }
    S.name = newName();
    S.run = new SH.Run(S.lv, S.cor);
    S.rec = new SH.Rec(); S.acc = 0; S.deadT = 0;
    S.startCor = NET.corStr(S.cor);
    view.follow(S.run.p.x, S.run.p.y, true);
    $('h-name').textContent = S.name;
    if (!first) { view.ring(S.run.p.x + 0.4, S.run.p.y + 0.4, '#fff'); checkLiveInGame(); }
  }
  function updateHud() {
    const st = shownStat(S.lv.f, S.lv.goal);
    $('h-dead').textContent = fmt(Math.max(st.d || 0, 0) + S.pending);
    const g = S.lv.goal, far = Math.max(st.m || 0, S.best);
    $('h-prog').style.width = Math.min(100, (far / g) * 100) + '%';
    $('h-best').style.left = Math.min(100, (S.best / g) * 100) + '%';
  }
  // ---------- 1こまずつ ----------
  let lastNow = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    if (!S.lv || !$('game').classList.contains('on')) { lastNow = now; return; }
    let dt = Math.min(0.1, (now - lastNow) / 1000 || 0); lastNow = now;
    if (S.paused) dt = 0;
    S.acc += dt;
    const run = S.run;
    while (S.acc >= SH.DT) {
      S.acc -= SH.DT;
      if (S.watch) { if (run && !run.over) { run.step(0); run.events.length = 0; } stepReplay(); continue; }
      if (run && !run.over) {
        const b = S.auto ? S.auto(run.t + 1) : (S.keys.l ? 1 : 0) | (S.keys.r ? 2 : 0) | (S.keys.j ? 4 : 0);   // auto はテスト用
        S.rec.put(run.t + 1, b);
        run.step(b);
        handleEvents(run);
        if (run.over) { if (run.clear) onClear(); else onDie(); break; }
      }
      stepReplay();
    }
    if (S.watch) {
      const sp = 14 * dt; if (S.keys.l) S.cam -= sp; if (S.keys.r) S.cam += sp;
      if (S.replay && S.follow) S.cam = S.replay.run.p.x - view.vw * 0.38;
      S.cam = Math.max(0, Math.min(S.lv.w - view.vw, S.cam)); view.camX = S.cam; view.camY = view.fitY(8);
    } else if (run && !run.dead) view.follow(run.p.x, run.p.y);
    S.ghost = S.replay && !S.replay.run.over ? { x: S.replay.run.p.x, y: S.replay.run.p.y, name: S.replay.name, face: S.replay.run.p.face } : null;
    // 見るモードで「越えた人の走り」を流している間は、その走りの仕掛け（同じ時刻の動き）を描く
    const R = S.replay, showRun = S.watch && R && !R.run.over ? R.run : run, showCor = showRun === run ? S.cor : R.run.cor;
    view.draw({ run: showRun, cor: showCor, name: S.name, since: S.since, pick: S.pick, ghost: S.ghost, showPlayer: !S.watch });
    if (run && !S.watch && !run.over) { $('h-time').textContent = (run.t / 120).toFixed(1) + '秒'; if (run.p.maxX > S.best) { S.best = run.p.maxX; updateHud(); } }
    // 番人の曲
    if (run && !S.watch) { const bs = run.ents.find(e => e.k === 'boss'); const want = bs && bs.st.on !== undefined && !run.over ? (S.lv.q ? 'gate' : 'boss') : S.lv.theme; if (SND.cur !== want) SND.bgm(want); }
  }
  function stepReplay() { const R = S.replay; if (!R || R.run.over) return; R.run.step(R.inp(R.run.t + 1)); if (R.run.over && S.watch) { toast(R.run.clear ? `「${R.name}」 ゴール！` : '記録はここまで'); } }
  function handleEvents(run) {
    for (const e of run.events) {
      switch (e.k) {
        case 'jump': SND.se('jump'); break;
        case 'land': SND.se('land'); break;
        case 'crush': SND.se('crush'); view.shake = Math.max(view.shake, 0.4); break;
        case 'bolt': SND.se('bolt'); view.shake = Math.max(view.shake, 0.5); break;
        case 'zap': if (Math.abs(e.a - run.p.x) < 14) { SND.se('zap'); if (!S.zapTip && !S.watch) { S.zapTip = 1; if (S.lv.f >= SH.ZAP2) toast('電気の梯子', '電気の玉が下りてきて消えたら、すぐ昇れ', 2600); else toast('電気の梯子', '黄色く光ったら、電気が流れる', 2200); } } break;   // 近くの電気の梯子だけ鳴らす
        case 'quake': SND.se('quake'); break;
        case 'trap': SND.se('trap'); break;
        case 'boss': SND.se('boss'); { const b = run.ents.find(x => x.k === 'boss'); toast((S.lv.q ? '関門の番人　' : '番人　') + (b ? b.name : ''), '倒せない。よけて、越えろ', 2200); } break;
      }
    }
    run.events.length = 0;
  }
  // ---------- 死んだ ----------
  const KIND = { spike: 'トゲ', lava: '溶岩', poison: '毒の花', sand: '流砂', pit: '奈落', crush: '落ちる天井', saw: '回る刃', fire: '炎', bolt: '雷', zap: '電気の梯子', water: '水', enemy: '魔物', boss: '番人' };
  function onDie() {
    const run = S.run, pl = run.place, name = S.name;
    SND.se('die'); view.shake = 0.8; view.burst(run.p.x + 0.4, run.p.y + 0.4, `hsl(${SH.hue(name)},70%,60%)`, 16);
    ME.dead++; saveMe(); S.deathsHere++; S.pending++;
    let sub = (KIND[run.dead] || '') + 'で';
    if (pl.vanish === 'cap') { sub = 'ここはもう屍が積めない。屍は消えた'; SND.se('vanish'); }
    else if (pl.vanish === 'fall') { sub = '奈落に落ちた。屍は残らない'; SND.se('vanish'); }
    else if (pl.vanish === 'poison') { sub = '毒の花で屍が溶けた'; SND.se('vanish'); }
    else if (pl.vanish === 'zap') { sub = '電気の梯子でしびれた。屍は残らない'; SND.se('vanish'); }
    else {
      SH.addCorpse(S.cor, S.lv, pl.x, pl.y, name); const c = S.cor.get(pl.y * S.lv.w + pl.x); c.t = NET.now() + 1; c.last = name;
      setTimeout(() => SND.se('pile'), 250);
      // となりに眠る屍
      let near = null, nd = 99;
      for (const [k, v] of S.cor) { if (v === c) continue; const x = k % S.lv.w, y = Math.floor(k / S.lv.w), d = Math.abs(x - pl.x) + Math.abs(y - pl.y); if (d < nd && d <= 3) { nd = d; near = v; } }
      sub = near ? `となりには「${near.last}」が眠っている` : 'ここが、あとから来る者の足場になる';
    }
    toast(`${name}は死んだンゴ`, sub, 1500);
    const mx = run.p.maxX;
    const fl = S.lv.f;
    const myKey = !pl.vanish ? pl.y * S.lv.w + pl.x : -1, myCor = S.cor;
    NET.died(S.lv, pl, name, mx, S.rec.str(), S.startCor, run.t, (W.stat[S.lv.f] || {}).m).then(() => { S.pending = Math.max(0, S.pending - 1); const st = W.stat[fl] = W.stat[fl] || {}; st.d = (st.d || 0) + 1; st.m = Math.max(st.m || 0, Math.floor(mx)); updateHud(); refreshStat(); }).catch(() => { S.pending = Math.max(0, S.pending - 1); const c = myKey >= 0 && myCor.get(myKey); if (c && c.n <= 1) myCor.delete(myKey); });   // 送れなかった屍は、この端末でも消す（あとの挑戦の確かめが通らなくなるので）
    updateHud();
    if (S.deathsHere % 15 === 0 && S.latest) setTimeout(() => autoStuck(false), 1200);
    // ほかの人の屍の読みなおしは、20秒に1回まで（通信を減らす。自分の屍はすぐ足場になる）
    const lvNow = S.lv; if (!S.syncAt || Date.now() - S.syncAt > 20000) { S.syncAt = Date.now(); S.syncP = NET.syncCells(lvNow, S.cor).then(m => { if (m && S.lv === lvNow) S.nextCor = m; }).catch(() => { }); }
    setTimeout(() => { if (S.run === run && $('game').classList.contains('on')) spawn(false); }, 1050);
  }
  let statT = 0;
  function refreshStat() { if (Date.now() - statT < 120000) return; statT = Date.now(); NET.rest('sh_stat/' + S.lv.f).then(v => { if (v) { W.stat[S.lv.f] = v; updateHud(); } }).catch(() => { }); }
  // ---------- 越えた ----------
  async function onClear() {
    const run = S.run, lv = S.lv, f = lv.f, ticks = run.t;
    SND.se('clear'); SND.bgm(null);
    view.burst(run.p.x + 0.4, run.p.y + 0.4, '#ffe080', 30);
    const firstHere = !ME.clears[f], isBest = !ME.clears[f] || ticks < ME.clears[f]; if (isBest) ME.clears[f] = ticks;
    // 自分の走りを残す（最速ならこの端末に。最速でなければ、タイトルに戻るまで）
    const mine = { r: S.rec.str(), c: S.startCor, k: ticks, n: S.name };
    S.myLast = Object.assign({ f, best: isBest }, mine);
    if (isBest) { const o = myRuns(); o[f] = mine; NET.store('shiin_myrun', o); }
    $('cl-mnote').textContent = isBest ? '最速の走りとして、この端末に残ります' : '最速ではないので、この映像はタイトルに戻ると削除されます'; ME.best[f] = lv.goal; saveMe();
    const deadN = Math.max((W.stat[f] && W.stat[f].d) || 0, S.cor.size ? [...S.cor.values()].reduce((a, c) => a + c.n, 0) : 0) + S.pending;
    const wasOpen = okFloor(f);
    const isFirst = S.latest && !wasOpen;
    $('cl-big').innerHTML = `<b>${fmt(deadN)}</b>人の屍を超えて<br>第${f}層突破！`;
    $('cl-sub').textContent = `${S.name}　${(ticks / 120).toFixed(1)}秒` + (firstHere ? '' : `（自己ベスト ${(ME.clears[f] / 120).toFixed(1)}秒）`);
    $('cl-first').style.display = 'none';   // 記録を送って、本当に一番乗りだったときに出す
    $('cl-xid').value = NET.store('shiin_xid') || '';
    $('cl-next').style.display = f < 100 ? '' : 'none';
    $('cl-next').textContent = `第${Math.min(100, f + 1)}層へ`;
    $('cl-msg').textContent = isFirst ? '記録を送っています…' : '';
    if (f !== 100) modal('clearbox', 1);   // 第100層は、エンドロールのあとに出す
    S.clearInfo = { f, name: S.name, ticks, deadN, isFirst };
    // 記録を送る（はじめてなら層が開く）
    try {
      // まだだれも確かに越えていない層なら、操作の記録ごと残す（だれでも計算しなおして確かめられる）
      const r = await NET.clear(lv, S.name, '', S.rec.str(), S.startCor, ticks, !wasOpen);
      const id = r && r.id; S.clearInfo.id = id; S.clearInfo.opened = !!(r && r.opened);
      if (isFirst) {
        if (r && r.opened) { $('cl-first').style.display = ''; $('cl-msg').textContent = f === 100 ? 'シインクラッド、完全制覇。' : `第${f + 1}層が、いま開いた。`; }
        else $('cl-msg').textContent = id ? 'ひと足先に越えた人がいました。あなたの記録も残りました' : '';
      }
      if (!wasOpen && id) {
        // 自分で越えたので、この端末では確かめずに開く（開いた印の時刻を読んで覚える）
        const o = await NET.rest('sh_open/' + f).catch(() => null);
        if (o && typeof o.t === 'number') {
          W.open[f] = o;
          if (r.opened) ME.ok3[f] = { t: o.t, id, n: S.name, x: '' };
          else {
            // ほかの人が先に越えていた：層は開く（自分の記録が本物なので）。碑の名前は、いちばん早い本物の記録を確かめてから
            ME.ok3[f] = { t: o.t, id, n: S.name, x: '', mine: 1 };
            const lvF = lv; NET.loadCells(lvF).then(cells => NET.firstClear(lvF, cells, [])).then(c => { if (c && ME.ok3[f] && ME.ok3[f].t === o.t) { ME.ok3[f] = { t: o.t, id: c.id, n: NET.cleanName(c.n) || '名無し', x: NET.cleanX(c.x) }; saveMe(); title.paint(); } }).catch(() => { });
          }
          saveMe(); computeLatest();
        }
      }
      W.stat[f] = Object.assign({}, W.stat[f], { f: ((W.stat[f] || {}).f || 0) + 1, m: lv.goal });
    } catch (e) {
      $('cl-msg').textContent = '記録を送れませんでした（混みあっているか、電波が弱いです）。「刻む」を押すと、もう一度送ります';
      const recStr = S.rec.str(), startCor = S.startCor, ci = S.clearInfo;
      ci.failed = true; ci.resend = () => NET.clear(lv, ci.name, '', recStr, startCor, ticks, !wasOpen);
      if (isFirst) $('cl-first').style.display = '';   // もう一度送るための「刻む」
    }
    // 第100層：越えた人は全員、エンドロール → 結果の画面
    if (f === 100) { ME.end100 = { n: S.name }; saveMe(); computeLatest(); await playEnding({ n: S.name, x: NET.store('shiin_xid') || '' }); modal('clearbox', 1); }
  }
  $('cl-xsave').onclick = async () => {
    const x = NET.cleanX($('cl-xid').value);
    if (!x) { toast('IDの形がちがいます', '英数字と _ で15文字まで'); return; }
    NET.store('shiin_xid', x);
    const ci = S.clearInfo;
    if (ci && !ci.id && ci.failed && ci.resend) {
      toast('記録をもう一度送っています…');
      try { const r = await ci.resend(); if (!r || !r.id) throw new Error('no id'); ci.id = r.id; ci.opened = !!r.opened; ci.failed = false; $('cl-msg').textContent = ci.opened ? (ci.f === 100 ? 'シインクラッド、完全制覇。' : `第${ci.f + 1}層が、いま開いた。`) : 'ひと足先に越えた人がいました。あなたの記録も残りました'; refresh(true); }
      catch (e) { toast('送れませんでした', '混みあっています。少し待ってもう一度'); return; }
    }
    if (!ci || !ci.id) { toast('記録を送っている途中です', '少し待ってもう一度'); return; }
    try { await NET.setXid(ci.f, ci.id, x, ci.opened); if (ME.ok3[ci.f] && ME.ok3[ci.f].id === ci.id) { ME.ok3[ci.f].x = x; saveMe(); } if (W.open[ci.f] && W.open[ci.f].id === ci.id) W.open[ci.f].x = x; $('cl-first').style.display = 'none'; toast('碑に刻みました', '@' + x); } catch (e) { toast('書きこめませんでした'); }
  };
  $('cl-xskip').onclick = () => { $('cl-first').style.display = 'none'; toast('「無名」として刻まれます'); };
  $('cl-next').onclick = () => { modal('clearbox', 0); startFloor(Math.min(100, S.lv.f + 1)); };
  $('cl-again').onclick = () => { modal('clearbox', 0); SND.bgm(S.lv.theme); spawn(false); };
  $('cl-share').onclick = () => { S.shareMode = 'clear'; openShare(); };
  $('cl-title').onclick = () => { modal('clearbox', 0); toTitle(); };
  $('cl-mine').onclick = () => { const m = S.myLast; if (!m) return; modal('clearbox', 0); watchMine(m); };
  $('w-mine').onclick = () => { const m = S.lv && mineOf(S.lv.f); if (m) { startReplay(m, true); S.follow = true; } };
  // ---------- 詰み ----------
  // 詰みのチェック（別の所で計算。使えない端末ではここで）
  let worker = null, wid = 0; const wcb = {};
  try { worker = new Worker('js/stuck-worker.js?v=' + SH.VER); worker.onmessage = ev => { const f = wcb[ev.data.id]; if (f) { delete wcb[ev.data.id]; f(ev.data); } }; worker.onerror = () => { worker = null; }; } catch (e) { worker = null; }
  function stuckCheck(lv, cor) {
    const plain = { f: lv.f, w: lv.w, h: lv.h, tiles: lv.tiles, cap: lv.cap, ents: lv.ents, goal: lv.goal, start: lv.start };
    const c2 = new Map(); for (const [k, v] of cor) c2.set(k, { n: v.n, last: '' });
    if (worker) return new Promise(res => { const id = ++wid; wcb[id] = d => res(d.err ? inline() : d); worker.postMessage({ id, lv: plain, cor: c2 }); setTimeout(() => { if (wcb[id]) { delete wcb[id]; res(inline()); } }, 20000); });
    return Promise.resolve(inline());
    function inline() { const r = SH.reach(plain, c2); const col = new Int16Array(lv.w); for (const k of c2.keys()) col[k % lv.w]++; const cand = [...r.deaths.values()].filter(d => col[d.x] < lv.cap[d.x]).length; return { goal: r.goal, maxX: r.maxX, cand, stuck: !r.goal && cand === 0 }; }
  }
  async function autoStuck(manual) {
    if (!S.lv) return null;
    if (manual) $('stuck-body').innerHTML = '<p>しらべています…</p>';
    const lv = S.lv, r = await stuckCheck(lv, S.cor);
    if (r.stuck && !manual && !S.reported && S.lv === lv) { S.reported = 1; NET.report(lv.f, r.maxX, true).catch(() => { }); }
    return r;
  }
  $('b-stuck').onclick = async () => {
    S.paused = true; modal('stuck', 1); $('stuck-send').style.display = 'none';
    const r = await autoStuck(true);
    const pct = Math.floor((r.maxX / S.lv.goal) * 100);
    $('stuck-body').innerHTML = r.goal ? '<p>しらべたところ、<b>まだゴールまで行ける道</b>があります。<br>あきらめずに挑んでください。</p>'
      : r.stuck ? `<p>しらべたところ、<b>詰んでいるかもしれません</b>（${pct}%の所で止まる）。<br>管理人に知らせますか？確かめて、この層の屍を消すことがあります。</p>`
        : `<p>まだ屍を積める場所が <b>${r.cand}</b> か所あります（${pct}%の所まで行けます）。<br>みんなで死ねば、道はできるかもしれません。<br>それでも詰んでいると思ったら、知らせてください。</p>`;
    $('stuck-send').style.display = r.goal ? 'none' : '';
    $('stuck-send').onclick = async () => { $('stuck-send').style.display = 'none'; try { await NET.report(S.lv.f, r.maxX, r.stuck); $('stuck-body').innerHTML += '<p>知らせました。ありがとうございます。</p>'; } catch (e) { $('stuck-body').innerHTML += '<p>送れませんでした。</p>'; } };
  };
  $('stuck-close').onclick = () => { modal('stuck', 0); S.paused = false; };
  // ---------- 屍をタップ ----------
  $('cv').addEventListener('pointerdown', ev => {
    if (!S.lv) return;
    if (ev.target !== $('cv')) return;
    const [x, y] = view.toCell(ev.clientX, ev.clientY), c = S.cor.get(y * S.lv.w + x);
    const pop = $('pop');
    if (!c) { S.pick = null; pop.style.display = 'none'; return; }
    S.pick = [x, y]; SND.se('tap');
    pop.innerHTML = `<b>${esc(c.last)}</b> ほか<br>ここで <b>${fmt(c.n)}</b> 人が死んだ`;
    if (c.n === 1) pop.innerHTML = `<b>${esc(c.last)}</b><br>ここで死んだ`;
    pop.style.left = ev.clientX + 'px'; pop.style.top = ev.clientY + 'px'; pop.style.display = 'block';
    clearTimeout(pop._t); pop._t = setTimeout(() => { pop.style.display = 'none'; S.pick = null; }, 2400);
  });
  // ---------- 見るモード ----------
  $('w-replay').onclick = () => {
    if (S.first) { startReplay(S.first); S.follow = true; }
    else if (S.firstLoading) { S.wantReplay = true; toast('記録を確かめています', '確かめ終わったら、自動で流れます', 2200); }
    else toast('はじめて越えた記録を確かめられませんでした');
  };
  $('w-free').onclick = () => { S.follow = false; };
  // 見るモードはドラッグで動かせる
  let drag = null;
  $('cv').addEventListener('pointerdown', ev => { if (S.watch) { drag = { x: ev.clientX, c: S.cam }; S.follow = false; } });
  addEventListener('pointermove', ev => { if (drag && S.watch) { const r = $('cv').getBoundingClientRect(); S.cam = drag.c - (ev.clientX - drag.x) * ($('cv').width / r.width) / view.S; } });
  addEventListener('pointerup', () => { drag = null; });
  // ---------- 操作 ----------
  const KM = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', ArrowUp: 'j', KeyW: 'j', Space: 'j', KeyZ: 'j' };
  addEventListener('keydown', e => { const k = KM[e.code]; if (k && $('game').classList.contains('on')) { S.keys[k] = 1; e.preventDefault(); SND.unlock(); } if (e.code === 'Escape' && $('game').classList.contains('on')) toTitle(); });
  addEventListener('keyup', e => { const k = KM[e.code]; if (k) S.keys[k] = 0; });
  addEventListener('blur', () => { S.keys.l = S.keys.r = S.keys.j = 0; if (typeof padRelease === 'function') padRelease(); });

  // ---------- スマホのボタン（指を追いかける） ----------
  //  ・ボタンのまわりの「ゾーン」で指を受ける。すき間を押しても、いちばん近いボタンが効く
  //  ・押したまま指をすべらせると、すべらせた先のボタンに切りかわる（◀から▶へ、など）
  //  ・指1本ずつを別々に追いかける（左手で動きながら右手で跳んでも、両方効く）
  //  ・指がゾーンの外に出ても、離すまでは押したまま
  function bindPad(zones, keys, onPress) {
    const ptr = new Map(), cnt = {}, els = {};
    for (const z of zones) for (const b of z.btns) els[b.k] = b.el;
    const set = (k, d) => { cnt[k] = Math.max(0, (cnt[k] || 0) + d); keys[k] = cnt[k] > 0 ? 1 : 0; if (els[k]) els[k].classList.toggle('on', keys[k] === 1); };
    const pick = (z, x, y) => { let best = z.btns[0], bd = Infinity; for (const b of z.btns) { const r = b.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, d = (x - cx) * (x - cx) + (y - cy) * (y - cy) * 0.25; if (d < bd) { bd = d; best = b; } } return best.k; };
    for (const z of zones) {
      z.el.addEventListener('pointerdown', e => { e.preventDefault(); try { z.el.setPointerCapture(e.pointerId); } catch (er) { } if (ptr.has(e.pointerId)) return; const k = pick(z, e.clientX, e.clientY); ptr.set(e.pointerId, { z, k }); set(k, 1); if (onPress) onPress(); });
      z.el.addEventListener('pointermove', e => { const p = ptr.get(e.pointerId); if (!p) return; const k = pick(p.z, e.clientX, e.clientY); if (k !== p.k) { set(p.k, -1); p.k = k; set(k, 1); } });
      const up = e => { const p = ptr.get(e.pointerId); if (!p) return; ptr.delete(e.pointerId); set(p.k, -1); };
      z.el.addEventListener('pointerup', up); z.el.addEventListener('pointercancel', up); z.el.addEventListener('lostpointercapture', up);
      z.el.addEventListener('contextmenu', e => e.preventDefault());
    }
    const release = () => { for (const p of ptr.values()) set(p.k, -1); ptr.clear(); for (const k in cnt) if (cnt[k]) { cnt[k] = 0; keys[k] = 0; if (els[k]) els[k].classList.remove('on'); } };
    // 守り：画面からすべての指が離れたら、どのボタンも必ず離したことにする（「離した」が届かなかったときの押しっぱなしを防ぐ）
    const allUp = e => { if (!e.touches || e.touches.length === 0) release(); };
    document.addEventListener('touchend', allUp, true); document.addEventListener('touchcancel', allUp, true);
    return release;
  }
  const padRelease = bindPad([{ el: $('zL'), btns: [{ el: $('bl'), k: 'l' }, { el: $('br'), k: 'r' }] }, { el: $('zR'), btns: [{ el: $('bj'), k: 'j' }] }], S.keys, () => SND.unlock());
  document.addEventListener('visibilitychange', () => { if (document.hidden) padRelease(); });
  addEventListener('resize', () => { view.resize(); if (S.run) view.follow(S.run.p.x, S.run.p.y, true); });
  addEventListener('contextmenu', e => e.preventDefault());
  // =============================================
  //  屍の碑・到達者の碑
  // =============================================
  async function openGrave(tab) {
    modal('grave', 1); S.paused = true;
    const body = $('gr-body'); body.innerHTML = '<p>読みこみ中…</p>';
    for (const b of document.querySelectorAll('#grave .tabs button')) b.classList.toggle('on', b.dataset.t === tab);
    try {
      if (tab === 'dead') {
        const list = await NET.grave(150);
        body.innerHTML = `<p class="note">ここに眠る ${fmt(totalDead())} の屍のうち、新しい ${list.length} 人。</p><ol class="names">` + list.map(g => `<li><b>${esc(g.n)}</b><small>第${g.f}層・${ago(g.t)}</small></li>`).join('') + '</ol>';
      } else {
        await refresh(); const idx = await getIndex();
        const rows = Object.keys(W.open).map(Number).filter(f => okFloor(f)).map(f => ({ f, o: opener(f) })).sort((a, b) => a.f - b.f);
        body.innerHTML = `<p class="note">各層をはじめて越えた者。XのIDは本人の申告で、本当にその人かは確かめていません。</p><ol class="names">` + (rows.length ? rows.map(({ f, o }) => `<li><b>第${f}層</b> ${esc(idx[f - 1].n)}<br>${esc(o.n)}　<span class="x">${o.x ? '@' + esc(o.x) : '無名'}</span><small>${new Date(o.t).toLocaleDateString('ja-JP')}</small></li>`).join('') : '<li>まだだれもいない</li>') + '</ol>';
      }
    } catch (e) { body.innerHTML = '<p>読みこめませんでした</p>'; }
  }
  for (const b of document.querySelectorAll('#grave .tabs button')) b.onclick = () => openGrave(b.dataset.t);
  $('gr-close').onclick = () => { modal('grave', 0); S.paused = false; };
  $('stone').onclick = () => openGrave('dead');
  // =============================================
  //  あそびかた・音
  // =============================================
  function openHow() { modal('how', 1); S.paused = true; }
  $('how-close').onclick = () => { modal('how', 0); S.paused = false; };
  function paintSnd() { $('b-snd').textContent = SND.on ? '♪ 音あり' : '♪ 音なし'; $('g-snd').textContent = SND.on ? '♪' : '×'; }
  $('b-snd').onclick = () => { SND.unlock(); SND.setOn(!SND.on); paintSnd(); };
  $('g-snd').onclick = () => { SND.unlock(); SND.setOn(!SND.on); paintSnd(); };
  // =============================================
  //  投稿・画像
  // =============================================
  const TAGS = '#シインクラッド #gamedev #ゲーム制作';
  const progPct = () => S.lv ? Math.min(99, Math.floor((S.best / S.lv.goal) * 100)) : 0;
  function shareText() {
    const ci = S.clearInfo;
    if (S.shareMode === 'clear' && ci) return `${fmt(ci.deadN)}人の屍を超えて、第${ci.f}層突破！\n名前は「${ci.name}」${(ci.ticks / 120).toFixed(1)}秒\n誰か続いてくれ！\n\n${TAGS}\n\n${URL_GAME}`;
    if (S.shareMode === 'prog' && S.lv) return `シインクラッド第${S.lv.f}層の${progPct()}%地点に到達！\n${S.deathsHere ? S.deathsHere + '回死んだ。' : ''}誰か助けてくれ！\n\n${TAGS}\n\n${URL_GAME}`;
    return `シインクラッド　いま第${W.latest}層。みんなの屍は${fmt(totalDead())}人。\n誰か助けてくれ！\n\n${TAGS}\n\n${URL_GAME}`;
  }
  function drawShare(cv) {
    const g = cv.getContext('2d'), Wd = 1200, Hd = 630; cv.width = Wd; cv.height = Hd;
    // 層の景色をそのまま背景に
    const off = document.createElement('canvas'); off.width = Wd; off.height = Hd;
    const v2 = new SH.View(off); v2.cv = off; v2.g = off.getContext('2d'); v2.S = Math.floor(Hd / 16); v2.vw = Wd / v2.S; v2.vh = Hd / v2.S; v2.setLevel(S.lv);
    const r = S.run; const cx = r ? Math.max(0, Math.min(S.lv.w - v2.vw, r.p.x - v2.vw * 0.6)) : 0; v2.camX = cx; v2.camY = 0;
    v2.draw({ run: r, cor: S.cor, name: S.name, showPlayer: true });
    g.drawImage(off, 0, 0);
    g.fillStyle = 'rgba(10,8,14,.62)'; g.fillRect(0, 0, Wd, Hd);
    g.textAlign = 'center'; g.fillStyle = '#ffd25a'; g.font = '64px DotGothic16, monospace';
    const ci = S.clearInfo;
    if (ci) {
      g.fillText(`${fmt(ci.deadN)}人の屍を超えて`, Wd / 2, 230); g.font = '86px DotGothic16, monospace'; g.fillStyle = '#fff'; g.fillText(`第${ci.f}層突破！`, Wd / 2, 340);
      g.font = '34px DotGothic16, monospace'; g.fillStyle = '#cfc6b8'; g.fillText(`${ci.name}　${(ci.ticks / 120).toFixed(1)}秒　${S.lv.name}`, Wd / 2, 410);
    } else if (S.shareMode === 'prog' && S.lv) {
      g.fillText(`第${S.lv.f}層　${S.lv.name}`, Wd / 2, 200); g.font = '96px DotGothic16, monospace'; g.fillStyle = '#fff'; g.fillText(`${progPct()}%地点に到達！`, Wd / 2, 320);
      g.font = '46px DotGothic16, monospace'; g.fillStyle = '#ff9a7a'; g.fillText('誰か助けてくれ！', Wd / 2, 410);
      if (S.deathsHere) { g.font = '30px DotGothic16, monospace'; g.fillStyle = '#cfc6b8'; g.fillText(`ここまでに${S.deathsHere}回死んだ`, Wd / 2, 465); }
    } else { g.fillText('シインクラッド', Wd / 2, 260); g.font = '44px DotGothic16, monospace'; g.fillStyle = '#fff'; g.fillText(`いま第${W.latest}層。みんなの屍は${fmt(totalDead())}人。`, Wd / 2, 350); g.fillStyle = '#ff9a7a'; g.fillText('誰か助けてくれ！', Wd / 2, 420); }
    g.font = '30px DotGothic16, monospace'; g.fillStyle = '#9a90a8'; g.fillText('シインクラッド　#シインクラッド', Wd / 2, 560);
  }
  function openShare() {
    const cv = $('sh-img'); drawShare(cv);
    $('sh-text').textContent = shareText();
    modal('share', 1);
  }
  $('sh-post').onclick = () => { open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText()), '_blank'); };
  $('sh-save').onclick = () => { const a = document.createElement('a'); a.download = 'shiincrad.png'; a.href = $('sh-img').toDataURL('image/png'); a.click(); };
  $('sh-close').onclick = () => { modal('share', 0); if (S.shareMode === 'prog') S.paused = false; };
  $('g-share').onclick = () => { if (!S.lv) return; S.paused = true; S.shareMode = 'prog'; openShare(); };
  $('b-share').onclick = () => { S.shareMode = 'title'; S.clearInfo = null; S.lv = S.lv || null; if (!S.lv) { getLevel(W.latest).then(lv => { S.lv = lv; S.run = null; openShare(); }); return; } openShare(); };
  // =============================================
  //  タイトルへ
  // =============================================
  function toTitle() { S.myLast = null; S.run = null; S.replay = null; S.watch = false; SND.bgm(null); show('title'); refresh(); }
  $('g-back').onclick = toTitle;
  $('go-latest').onclick = async () => { SND.unlock(); await getIndex(); startFloor(W.done ? 100 : W.latest, W.done ? { watch: true } : {}); };
  $('go-select').onclick = () => openSelect();
  $('sel-back').onclick = () => show('title');
  $('fm-close').onclick = () => modal('floormenu', 0);
  $('go-grave').onclick = () => openGrave('dead');
  $('go-hero').onclick = () => openGrave('hero');
  $('go-how').onclick = () => openHow();
  $('g-how').onclick = () => openHow();
  // はじめる
  paintSnd();
  getIndex().then(() => {
    title.paint();
    // 管理画面から：?watch=層 で、その層をスペクターモードで開く（開いていない層も見られる）
    const wf = +(new URLSearchParams(location.search).get('watch') || 0);
    if (wf >= 1 && wf <= 100) { ME.tut = 1; startFloor(wf, { watch: true }); }
  }).catch(() => { });
  refresh();
  requestAnimationFrame(loop);
  // 1分ごとに全体を読みなおす（タイトルにいるときだけ）
  setInterval(() => { if ($('title').classList.contains('on') && !document.hidden) refresh(); }, 180000);
  SH.UI = { show, toast, startFloor, toTitle, W, ME };
})(window);
