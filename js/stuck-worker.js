// 詰みのチェックを、遊びの手を止めずに別の所で計算する
// 版は呼び出し元（stuck-worker.js?v=○○）に合わせる（古い計算ファイルを読まないように）
const V = ((self.location && self.location.search || '').match(/v=([^&]+)/) || [])[1] || '0';
importScripts('engine.js?v=' + V, 'bosses.js?v=' + V, 'reach.js?v=' + V);
onmessage = function (ev) {
  const { id, lv, cor } = ev.data;
  try {
    const SH = self.SH, res = SH.reach(lv, cor);
    const col = new Int16Array(lv.w); for (const k of cor.keys()) col[k % lv.w]++;
    const cand = [...res.deaths.values()].filter(d => col[d.x] < lv.cap[d.x]).length;
    postMessage({ id, goal: res.goal, maxX: res.maxX, cand, stuck: !res.goal && cand === 0 });
  } catch (e) { postMessage({ id, err: String(e) }); }
};
