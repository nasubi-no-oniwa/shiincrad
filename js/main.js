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
  SH.VER = '6';   // 層のデータを変えたら上げる（古いものを読まないように）
  // ---------- 名前（毎回ちがう） ----------
  const PRE = ['さびた', '七番目の', '名もなき', 'はぐれ', 'ねむれる', 'しろい', 'くろい', 'ちいさな', 'さいごの', 'まよえる', 'はじめての', 'かけだしの', 'うつろな', 'とおくの', 'ひとりの', 'のろわれた', 'ほこりの', 'わすれられた', 'かなしき', 'あおい', 'あかい', 'みどりの', 'よわきの', 'ほしふる', 'つきなき', 'あさやけの', 'ゆうぐれの', 'こごえた', 'ねぼけた', 'まっすぐな', 'おくびょうな', 'むこうみずな', 'ひかえめな', 'おおぐらいの', 'ふるえる', 'よろめく', 'まがった', 'うたう', 'かぞえる', 'ちりぢりの'];
  const NAME = ['ノルド', 'ミナ', 'カイ', 'ルカ', 'トト', 'ハル', 'シノ', 'ユウ', 'レン', 'アオ', 'ソラ', 'イオ', 'ナギ', 'リク', 'コハ', 'セツ', 'ウタ', 'ロイ', 'マオ', 'キリ', 'ヨミ', 'ツバキ', 'ハク', 'クロ', 'モモ', 'スズ', 'テオ', 'ニコ', 'ヒバリ', 'フウ', '旅人', '剣士', '番兵', '巡礼者', '見習い', '鍛冶屋', '吟遊詩人', '墓守', '学者', '商人', '騎士', '弓兵', '薬師', '漁師'];
  const newName = () => { const p = PRE[Math.floor(Math.random() * PRE.length)], n = NAME[Math.floor(Math.random() * NAME.length)]; return (p + n).slice(0, 12); };
  // ---------- 自分の記録（この端末） ----------
  const ME = Object.assign({ dead: 0, clears: {}, best: {}, seen: {}, fake: {}, tut: 0 }, NET.store('shiin_me') || {});
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
    const H = 16;
    return r._lv = { f, name: r.n, theme: Math.ceil(f / 5) - 1, w: r.w, h: H, tiles: rleDecode(r.t, r.w * H), cap: Int8Array.from(r.c.split('').map(Number)), ents: r.e, goal: r.g, boss: r.b, q: r.q, dark: r.dk, cave: r.cv, need: r.need, start: { x: 2.1, y: GY - PH } };
  }
  SH.getLevel = getLevel;
  // ---------- 全体の状態 ----------
  const W = { open: {}, stat: {}, latest: 1, loaded: false };
  function computeLatest() {
    let L = 1; for (const k in W.open) { const f = +k; if (f >= 1 && f <= 100 && !isFake(f) && f + 1 > L) L = Math.min(100, f + 1); }
    // 100層を越えたら完全制覇
    W.done = !!(W.open[100] && !isFake(100));
    W.latest = L; return L;
  }
  // 確かめられなかった「開いた」記録（その記録のidごと覚える。新しい本物が来たら開く）
  const isFake = f => !!(W.open[f] && ME.fake[f] && ME.fake[f] === W.open[f].id);
  async function verifyOpen(g) {
    const o = W.open[g]; if (!o) return;
    ME.okOpen = ME.okOpen || {}; if (ME.okOpen[g] === o.id) return;   // 一度確かめた記録は読みなおさない（通信を減らす）
    try {
      const lv2 = await getLevel(g), cells = await NET.loadCells(lv2), c = await NET.firstClear(lv2, cells);
      if (c) { ME.okOpen[g] = o.id; saveMe(); }
      if (!c && W.open[g]) { ME.fake[g] = W.open[g].id; saveMe(); computeLatest(); if (S.lv && S.lv.f === g + 1) { toast('この層は、まだ開いていませんでした', '越えた記録を確かめられませんでした', 2600); setTimeout(toTitle, 1500); } }
    } catch (e) { }
  }
  async function refresh() {
    try { const o = await NET.overview(); W.open = o.open; W.stat = o.stat; W.loaded = true; } catch (e) { W.loaded = false; }
    computeLatest(); title.paint();
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
      const st = W.stat[L] || {}, g = ix ? ix.g : 0;
      $('t-road').textContent = g ? Math.min(100, Math.floor(((st.m || 0) / g) * 100)) + '%' : '0%';
      $('t-ldead').textContent = fmt(st.d || 0);
      $('go-latest').textContent = W.done ? '頂をながめる' : `第${L}層に挑む`;
      // 開いた知らせ（新しい順）
      const news = Object.entries(W.open).filter(([f]) => !isFake(f)).map(([f, o]) => ({ f: +f, o })).sort((a, b) => b.o.t - a.o.t).slice(0, 12);
      const tk = news.length ? news.map(({ f, o }) => `${ago(o.t)}　第${f + 1 > 100 ? 100 : f + 1}層が開いた ── 第${f}層を越えたのは「${esc(o.n)}」${o.x ? '（@' + esc(o.x) + '）' : ''}`).join('　　◆　　') : 'まだだれも第1層を越えていない。最初の屍になれ。';
      $('ticker').innerHTML = `<span>${tk}</span>`;
      $('ticker').firstChild.style.animationDuration = Math.max(14, tk.length * 0.22) + 's';
    },
  };
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
    const ix = (await getIndex())[f - 1], st = W.stat[f] || {};
    $('fm-title').innerHTML = `第${f}層　${esc(ix.n)}`;
    const open = W.open[f];
    $('fm-body').innerHTML = `<p>死んだ数 <b>${fmt(st.d || 0)}</b>　越えた人 <b>${fmt(st.f || 0)}</b><br>道ができた <b>${Math.min(100, Math.floor(((st.m || 0) / ix.g) * 100))}%</b>${ix.b ? `<br>番人：<b>${esc(ix.b)}</b>` : ''}${open ? `<br>はじめて越えた人：<b>${esc(open.n)}</b>${open.x ? ' @' + esc(open.x) : ''}` : ''}${ME.clears[f] ? `<br>あなたの記録：<b>${(ME.clears[f] / 120).toFixed(1)}秒</b>` : ''}</p>`;
    $('fm-play').textContent = f === W.latest && !W.done ? '挑む（最新の層）' : '練習する';
    $('fm-play').onclick = () => { modal('floormenu', 0); startFloor(f); };
    $('fm-watch').style.display = cleared ? '' : 'none';
    $('fm-watch').onclick = () => { modal('floormenu', 0); startFloor(f, { watch: true }); };
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
    SND.unlock();
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
    if (S.watch) { S.run = new SH.Run(lv, cor); S.run.over = true; S.cam = 0; view.follow(0, 8, true); loadFirst(true); return; }
    if (f === 1) $('stone').style.display = ''; else $('stone').style.display = 'none';
    if (S.latest && f > 1) verifyOpen(f - 1);
    spawn(true);
    if (!ME.tut) { ME.tut = 1; saveMe(); openHow(); }
  }
  async function loadFirst(play) {
    try { const c = await NET.firstClear(S.lv, S.cor); S.first = c; if (c && play) startReplay(c); }
    catch (e) { }
  }
  function startReplay(c) {
    const snap = NET.corParse(c.c, S.lv.w);
    S.replay = { run: new SH.Run(S.lv, snap), inp: SH.Rec.parse(c.r), name: c.n, x: c.x };
    toast(`はじめて越えた「${c.n}」の走り`, '屍は「そのときの屍」です', 2200);
  }
  function spawn(first) {
    if (S.nextCor) { S.cor = S.nextCor; S.nextCor = null; }
    S.name = newName();
    S.run = new SH.Run(S.lv, S.cor);
    S.rec = new SH.Rec(); S.acc = 0; S.deadT = 0;
    S.startCor = NET.corStr(S.cor);
    view.follow(S.run.p.x, S.run.p.y, true);
    $('h-name').textContent = S.name;
    if (!first) view.ring(S.run.p.x + 0.4, S.run.p.y + 0.4, '#fff');
  }
  function updateHud() {
    const st = W.stat[S.lv.f] || {};
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
      if (S.watch) { stepReplay(); continue; }
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
    view.draw({ run, cor: S.cor, name: S.name, since: S.since, pick: S.pick, ghost: S.ghost, showPlayer: !S.watch });
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
        case 'quake': SND.se('quake'); break;
        case 'trap': SND.se('trap'); break;
        case 'boss': SND.se('boss'); { const b = run.ents.find(x => x.k === 'boss'); toast((S.lv.q ? '関門の番人　' : '番人　') + (b ? b.name : ''), '倒せない。よけて、越えろ', 2200); } break;
      }
    }
    run.events.length = 0;
  }
  // ---------- 死んだ ----------
  const KIND = { spike: 'トゲ', lava: '溶岩', poison: '毒の花', sand: '流砂', pit: '奈落', crush: '落ちる天井', saw: '回る刃', fire: '炎', bolt: '雷', water: '水', enemy: '魔物', boss: '番人' };
  function onDie() {
    const run = S.run, pl = run.place, name = S.name;
    SND.se('die'); view.shake = 0.8; view.burst(run.p.x + 0.4, run.p.y + 0.4, `hsl(${SH.hue(name)},70%,60%)`, 16);
    ME.dead++; saveMe(); S.deathsHere++; S.pending++;
    let sub = (KIND[run.dead] || '') + 'で';
    if (pl.vanish === 'cap') { sub = 'ここはもう屍が積めない。屍は消えた'; SND.se('vanish'); }
    else if (pl.vanish === 'fall') { sub = '奈落に落ちた。屍は残らない'; SND.se('vanish'); }
    else if (pl.vanish === 'poison') { sub = '毒の花で屍が溶けた'; SND.se('vanish'); }
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
    NET.died(S.lv, pl, name, mx).then(() => { S.pending = Math.max(0, S.pending - 1); const st = W.stat[fl] = W.stat[fl] || {}; st.d = (st.d || 0) + 1; st.m = Math.max(st.m || 0, Math.floor(mx)); updateHud(); refreshStat(); }).catch(() => { S.pending = Math.max(0, S.pending - 1); });
    updateHud();
    if (S.deathsHere % 15 === 0 && S.latest) setTimeout(() => autoStuck(false), 1200);
    const lvNow = S.lv; S.syncP = NET.syncCells(lvNow, S.cor).then(m => { if (m && S.lv === lvNow) S.nextCor = m; }).catch(() => { });
    setTimeout(() => { if (S.run === run && $('game').classList.contains('on')) spawn(false); }, 1050);
  }
  let statT = 0;
  function refreshStat() { if (Date.now() - statT < 30000) return; statT = Date.now(); NET.rest('sh_stat/' + S.lv.f).then(v => { if (v) { W.stat[S.lv.f] = v; updateHud(); } }).catch(() => { }); }
  // ---------- 越えた ----------
  async function onClear() {
    const run = S.run, lv = S.lv, f = lv.f, ticks = run.t;
    SND.se('clear'); SND.bgm(null);
    view.burst(run.p.x + 0.4, run.p.y + 0.4, '#ffe080', 30);
    const firstHere = !ME.clears[f]; if (!ME.clears[f] || ticks < ME.clears[f]) ME.clears[f] = ticks; ME.best[f] = lv.goal; saveMe();
    const deadN = Math.max((W.stat[f] && W.stat[f].d) || 0, S.cor.size ? [...S.cor.values()].reduce((a, c) => a + c.n, 0) : 0) + S.pending;
    const wasOpen = !!W.open[f] && !isFake(f);
    const isFirst = S.latest && !wasOpen;
    $('cl-big').innerHTML = `<b>${fmt(deadN)}</b>人の屍を超えて<br>第${f}層突破！`;
    $('cl-sub').textContent = `${S.name}　${(ticks / 120).toFixed(1)}秒` + (firstHere ? '' : `（自己ベスト ${(ME.clears[f] / 120).toFixed(1)}秒）`);
    $('cl-first').style.display = isFirst ? '' : 'none';
    $('cl-xid').value = NET.store('shiin_xid') || '';
    $('cl-next').style.display = f < 100 ? '' : 'none';
    $('cl-next').textContent = `第${Math.min(100, f + 1)}層へ`;
    $('cl-msg').textContent = isFirst ? (f === 100 ? 'シインクラッド、完全制覇。' : `第${f + 1}層が、いま開いた。`) : '';
    modal('clearbox', 1);
    S.clearInfo = { f, name: S.name, ticks, deadN, isFirst };
    // 記録を送る（はじめてなら層が開く）
    try {
      const id = await NET.clear(lv, S.name, '', S.rec.str(), S.startCor, ticks, isFirst);
      S.clearInfo.id = id;
      if (isFirst && id) { W.open[f] = { t: NET.now(), n: S.name, x: '', id }; computeLatest(); }
      W.stat[f] = Object.assign({}, W.stat[f], { f: ((W.stat[f] || {}).f || 0) + 1, m: lv.goal });
    } catch (e) { $('cl-msg').textContent = '記録を送れませんでした（電波を確かめてください）'; }
  }
  $('cl-xsave').onclick = async () => {
    const x = NET.cleanX($('cl-xid').value);
    if (!x) { toast('IDの形がちがいます', '英数字と _ で15文字まで'); return; }
    NET.store('shiin_xid', x);
    const ci = S.clearInfo; if (!ci || !ci.id) { toast('記録を送っている途中です', '少し待ってもう一度'); return; }
    try { await NET.setXid(ci.f, ci.id, x, ci.isFirst); if (W.open[ci.f]) W.open[ci.f].x = x; $('cl-first').style.display = 'none'; toast('碑に刻みました', '@' + x); } catch (e) { toast('書きこめませんでした'); }
  };
  $('cl-xskip').onclick = () => { $('cl-first').style.display = 'none'; toast('「無名」として刻まれます'); };
  $('cl-next').onclick = () => { modal('clearbox', 0); startFloor(Math.min(100, S.lv.f + 1)); };
  $('cl-again').onclick = () => { modal('clearbox', 0); SND.bgm(S.lv.theme); spawn(false); };
  $('cl-share').onclick = () => { S.shareMode = 'clear'; openShare(); };
  $('cl-title').onclick = () => { modal('clearbox', 0); toTitle(); };
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
  $('w-replay').onclick = () => { if (S.first) { startReplay(S.first); S.follow = true; } else toast('はじめて越えた記録を確かめられませんでした'); };
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
  addEventListener('blur', () => { S.keys.l = S.keys.r = S.keys.j = 0; });
  for (const [id, k] of [['bl', 'l'], ['br', 'r'], ['bj', 'j']]) {
    const b = $(id);
    const on = e => { e.preventDefault(); S.keys[k] = 1; b.classList.add('on'); SND.unlock(); }, off = e => { e.preventDefault(); S.keys[k] = 0; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
  }
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
        const rows = Object.entries(W.open).filter(([f]) => !isFake(f)).map(([f, o]) => ({ f: +f, o })).sort((a, b) => a.f - b.f);
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
  function toTitle() { S.run = null; S.replay = null; S.watch = false; SND.bgm(null); show('title'); refresh(); }
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
  NET.warm();
  requestAnimationFrame(loop);
  // 1分ごとに全体を読みなおす（タイトルにいるときだけ）
  setInterval(() => { if ($('title').classList.contains('on') && !document.hidden) refresh(); }, 180000);
  SH.UI = { show, toast, startFloor, toTitle, W, ME };
})(window);
