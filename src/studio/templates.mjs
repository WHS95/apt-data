// 순수 함수: 검증된 model → HTML 문자열. node/DB 의존 없음 → /studio React로 그대로 이식 가능.
// 막대 폭은 값에서 계산(파라메트릭) → "인라인 span 폭 무시" 버그가 구조적으로 불가능.

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const gu = (name) => (name.length > 2 && /[구군]$/.test(name) ? name.slice(0, -1) : name); // 강남구→강남, 중구 유지

// format: "feed"(기본 1080×1350) | "reel"(1080×1920 정지화면 릴스 — 위 UI 안전영역만큼 상단 여백↑)
function baseDoc(t, { eyebrow, badge, stage, source, watermark, brand, format }) {
  const reel = format === "reel";
  const H = reel ? 1920 : 1350;
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"/>
<style>
@font-face{font-family:"Pretendard";font-weight:45 920;font-style:normal;font-display:block;
 src:url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/PretendardVariable.woff2") format("woff2-variations");}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:1080px;height:${H}px;background:${t.brand};font-family:"Pretendard",-apple-system,sans-serif;
 color:${t.white};-webkit-font-smoothing:antialiased;font-feature-settings:"tnum";letter-spacing:-0.01em;overflow:hidden;}
.card{width:1080px;height:${H}px;position:relative;overflow:hidden;}
.stage{position:absolute;top:0;left:0;right:0;padding:${reel ? 230 : 88}px 76px 0;display:flex;flex-direction:column;}
.top{display:flex;align-items:center;justify-content:space-between;}
.eyebrow{display:flex;align-items:center;gap:16px;font-size:30px;font-weight:700;color:${t.mist};letter-spacing:0.02em;}
.eyebrow .dm{width:22px;height:22px;border-radius:5px;background:${t.accent};box-shadow:0 0 0 6px rgba(255,196,0,0.18);}
.brand{display:flex;align-items:baseline;gap:10px;font-size:27px;font-weight:800;color:${t.white};}
.brand .dot{color:${t.accent};}
.axis{margin-top:30px;position:relative;width:300px;height:9px;border-radius:999px;background:${t.accent};}
.axis::before{content:"";position:absolute;left:0;top:-18px;width:9px;height:27px;border-radius:999px;background:${t.accent};}
.badge{display:inline-flex;align-items:center;gap:10px;margin-top:24px;padding:10px 20px;border-radius:999px;
 background:rgba(255,196,0,0.16);color:${t.accent};font-size:24px;font-weight:800;width:max-content;}
.kicker{font-size:40px;font-weight:800;color:${t.accent};letter-spacing:-0.02em;margin-bottom:18px;}
.number{font-size:400px;font-weight:900;line-height:0.86;letter-spacing:-0.045em;display:flex;align-items:flex-end;}
.number .u{font-size:168px;font-weight:900;margin-left:10px;padding-bottom:30px;}
.headline{font-size:62px;font-weight:900;line-height:1.13;letter-spacing:-0.03em;}
.sub{margin-top:24px;font-size:36px;font-weight:600;color:${t.mist};letter-spacing:-0.02em;}
.para{font-size:38px;font-weight:600;line-height:1.4;color:${t.white};margin-top:22px;}
.rank{margin-top:48px;display:flex;flex-direction:column;gap:20px;}
.row{display:flex;align-items:center;gap:26px;}
.row .gu{width:118px;font-size:37px;font-weight:800;letter-spacing:-0.02em;}
.row .bw{flex:1;background:${t.guide};border-radius:999px;}
.row .bar{height:48px;border-radius:999px;background:${t.bar};min-width:44px;}
.row .val{width:158px;text-align:right;font-size:42px;font-weight:900;letter-spacing:-0.02em;}
.row.hl .gu,.row.hl .val{color:${t.accent};}
.row.hl .bar{background:${t.accent};}
.div{display:flex;align-items:center;gap:26px;}
.div .d{width:118px;text-align:center;font-size:40px;color:${t.mist2};letter-spacing:0.25em;}
.div .l{flex:1;height:2px;background:rgba(255,255,255,0.14);}
.div .sp{width:158px;}
.callout{margin-top:44px;display:flex;align-items:center;gap:22px;font-size:38px;font-weight:700;}
.callout .tick{width:9px;height:46px;border-radius:999px;background:${t.accent};}
.callout b{color:${t.accent};font-weight:900;}
.footer{position:absolute;left:0;right:0;bottom:0;background:${t.brandDeep};padding:30px 76px;
 display:flex;align-items:center;justify-content:space-between;z-index:2;}
.source{font-size:22px;font-weight:500;color:${t.footerMist || t.mist2};}
.watermark{font-size:26px;font-weight:800;color:${t.footerInk || t.white};}
.picks{margin-top:64px;display:flex;flex-direction:column;}
.pick{display:flex;align-items:center;gap:32px;padding:46px 0;border-top:2px solid ${t.guide};}
.pick:first-child{border-top:0;padding-top:24px;}
.pk-idx{width:66px;height:66px;border-radius:20px;background:${t.guide};color:${t.white};
 font-size:34px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.pk-body{flex:1;min-width:0;}
.pk-name{font-size:52px;font-weight:900;letter-spacing:-0.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pk-meta{margin-top:12px;font-size:29px;font-weight:600;color:${t.mist};letter-spacing:-0.01em;}
.pk-price{margin-left:16px;font-size:58px;font-weight:900;letter-spacing:-0.03em;white-space:nowrap;
 font-feature-settings:"tnum";}
.pk-price .u{font-size:34px;font-weight:800;color:${t.mist};margin-left:4px;}
${reel ? `/* 릴스(1080×1920) 보정: 세로 여백 재분배 + 가독 확대 */
.eyebrow{font-size:33px;}
.headline{font-size:72px;}
.picks{margin-top:96px;}
.pick{padding:72px 0;}
.pick:first-child{padding-top:36px;}
.pk-idx{width:76px;height:76px;border-radius:22px;font-size:38px;}
.pk-name{font-size:58px;}
.pk-meta{font-size:32px;margin-top:14px;}
.pk-price{font-size:66px;}
.callout{margin-top:104px;font-size:42px;}
.number{font-size:440px;}
.para{font-size:42px;margin-top:30px;}
.rank{margin-top:64px;gap:26px;}
.footer{padding:36px 76px;}` : ""}
</style></head><body>
<div class="card">
  <div class="stage" id="stage">
    <div class="top"><div class="eyebrow"><span class="dm"></span>${esc(eyebrow)}</div>
      <div class="brand">${brand.replace("·", '<span class="dot">·</span>')}</div></div>
    ${badge ? `<div class="badge">⚠ ${esc(badge)}</div>` : ""}
    ${stage}
  </div>
  <div class="footer" id="footer"><div class="source">${esc(source)}</div><div class="watermark">${esc(watermark)}</div></div>
</div>
<script>window.addEventListener("load",function(){
  var s=document.getElementById("stage").getBoundingClientRect().bottom;
  var f=document.getElementById("footer").getBoundingClientRect().top;
  var el=document.documentElement;
  el.setAttribute("data-h",Math.round(s));
  el.setAttribute("data-of", s>f-8 ? "1":"0");  // 콘텐츠가 출처 바를 침범 = 오버플로우
});</script>
</body></html>`;
}

export function hero(m, t) {
  const stage = `<div style="margin-top:auto;margin-bottom:auto;padding-bottom:150px">
    ${m.kicker ? `<div class="kicker">${esc(m.kicker)}</div>` : ""}
    <div class="number">${esc(m.number)}<span class="u">${esc(m.unit)}</span></div>
    <div class="axis"></div>
    <div class="headline" style="margin-top:52px">${m.headline}</div>
    ${m.sub ? `<div class="sub">${esc(m.sub)}</div>` : ""}
  </div>`;
  return baseDoc(t, { ...m, stage });
}

export function ranking(m, t) {
  const max = Math.max(...m.rows.map((r) => r.value));
  const bar = (r) =>
    `<div class="row${r.hl ? " hl" : ""}"><span class="gu">${esc(gu(r.label))}</span>` +
    `<div class="bw"><div class="bar" style="width:${((r.value / max) * 100).toFixed(1)}%"></div></div>` +
    `<span class="val">${esc(r.value.toFixed(1))}억</span></div>`;
  const rowsHtml = m.rows.map((r) => (r.divider ? `<div class="div"><span class="d">⋯</span><span class="l"></span><span class="sp"></span></div>` : bar(r))).join("");
  const stage = `<div class="headline" style="margin-top:56px">${m.headline}</div><div class="axis"></div>
    <div class="rank">${rowsHtml}</div>
    ${m.callout ? `<div class="callout"><span class="tick"></span><div>${m.callout}</div></div>` : ""}`;
  return baseDoc(t, { ...m, stage });
}

// picks: 단지 3곳 리스트(이름·구·최근 실거래일·실거래가) — 값은 전부 데이터에서
export function picks(m, t) {
  const row = (r, i) =>
    `<div class="pick"><div class="pk-idx">${i + 1}</div>` +
    `<div class="pk-body"><div class="pk-name">${esc(r.name)}</div>` +
    `<div class="pk-meta">${esc(gu(r.gu))} · 최근 실거래 ${esc(r.date)}</div></div>` +
    `<div class="pk-price">${esc(r.price)}</div></div>`;
  const stage = `<div class="headline" style="margin-top:56px">${m.headline}</div><div class="axis"></div>
    <div class="picks">${m.rows.map(row).join("")}</div>
    ${m.callout ? `<div class="callout"><span class="tick"></span><div>${m.callout}</div></div>` : ""}`;
  return baseDoc(t, { ...m, stage });
}

export function concept(m, t) {
  const stage = `<div class="headline" style="margin-top:56px">${m.headline}</div><div class="axis"></div>
    ${m.paras.map((p) => `<div class="para">${p}</div>`).join("")}`;
  return baseDoc(t, { ...m, stage });
}

export const templates = { hero, ranking, concept, picks };
