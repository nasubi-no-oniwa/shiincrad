// 詰みのチェックを、遊びの手を止めずに別の所で計算する
importScripts('engine.js?v=7', 'bosses.js?v=7', 'reach.js?v=7');
onmessage = function (ev) {
  const { id, lv, cor } = ev.data;
  try {
    const SH = self.SH, res = SH.reach(lv, cor);
    const col = new Int16Array(lv.w); for (const k of cor.keys()) col[k % lv.w]++;
    const cand = [...res.deaths.values()].filter(d => col[d.x] < lv.cap[d.x]).length;
    postMessage({ id, goal: res.goal, maxX: res.maxX, cand, stuck: !res.goal && cand === 0 });
  } catch (e) { postMessage({ id, err: String(e) }); }
};
