// 詰みのチェックと、越えた記録の確かめを、遊びの手を止めずに別の所で計算する
// 版は呼び出し元（stuck-worker.js?v=○○）に合わせる（古い計算ファイルを読まないように）
const V = ((self.location && self.location.search || '').match(/v=([^&]+)/) || [])[1] || '0';
importScripts('engine.js?v=' + V, 'bosses.js?v=' + V, 'reach.js?v=' + V, 'net.js?v=' + V);
onmessage = function (ev) {
  const { id, lv, cor } = ev.data;
  if (ev.data.type === 'deaths') {   // 屍の記録をまとめて確かめる
    try { const d = ev.data; postMessage({ id, res: self.SH.NET.verifyDeaths(d.lvs, d.items, d.present, d.bad, d.budget) }); } catch (e) { postMessage({ id, err: String(e) }); }
    return;
  }
  if (ev.data.type === 'verify') {   // 越えた記録を計算しなおす
    try { postMessage({ id, ok: !!self.SH.NET.verifyClear(lv, ev.data.c, ev.data.cells, ev.data.rs) }); } catch (e) { postMessage({ id, err: String(e) }); }
    return;
  }
  try {
    const SH = self.SH, res = SH.reach(lv, cor);
    const col = new Int16Array(lv.w); for (const k of cor.keys()) col[k % lv.w]++;
    const cand = [...res.deaths.values()].filter(d => col[d.x] < lv.cap[d.x]).length;
    postMessage({ id, goal: res.goal, maxX: res.maxX, cand, stuck: !res.goal && cand === 0 });
  } catch (e) { postMessage({ id, err: String(e) }); }
};
