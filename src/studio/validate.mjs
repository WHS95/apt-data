// 가드레일 = 우리가 실제로 겪은 버그 클래스를 기계적으로 차단 (fail-closed)
//  막대버그→파라메트릭 템플릿(구조적) · 오버플로우→측정 · 숫자조작→바인딩 · prose조작(C4)→인과주장 검출
//  · 브랜드드리프트→data.meta 단일소스 · 정책→[발행 전 확인] 강제
const CAUSAL = /(때문|덕분|덕에|탓에|영향으로|이유는|덕택|때매)/;
const stripTpl = (s) => String(s || "").replace(/\{\{[^}]+\}\}/g, ""); // 바인딩 자리 제거 후 남은 '손 숫자'만 검사
const PRECISE = /\d+\.\d+/;                 // 정밀 소수 = 반드시 데이터 값
const COUNT = /\d+\s*(곳|건|가구|세대|%)/;   // 카운트/비율 = 반드시 데이터 값

export function validate(ctx) {
  const { spec, rawProse, resolvedProse, render, watermark, source, meta } = ctx;
  const out = [];
  const fail = (rule, msg) => out.push({ rule, level: "FAIL", msg });

  // 1) 오버플로우 (측정)
  if (render?.overflow) fail("OVERFLOW", `콘텐츠가 출처 바를 침범(높이 ${render.height}px > 안전영역). 행/폰트 축소 필요`);

  // 2) 미바인딩 수치 (손으로 쓴 정밀 수치·카운트 금지 → {{키}}로)
  for (const s of rawProse) {
    const rest = stripTpl(s);
    if (PRECISE.test(rest) || COUNT.test(rest))
      fail("RAW_FIGURE", `산문에 손 숫자("${(rest.match(PRECISE) || rest.match(COUNT))[0]}") — 데이터 키 {{...}}로 바인딩하세요`);
  }

  // 3) prose 인과 주장 (C4류) — 엔티티별 인과는 사람 검수 없으면 차단
  const joined = resolvedProse.join(" ");
  if (CAUSAL.test(joined) && !spec.reviewedClaims)
    fail("PROSE_CLAIM", `인과/설명 주장("${joined.match(CAUSAL)[0]}") 검출 — 데이터로 검증 불가한 서술. reviewedClaims:true(사람 검수) 또는 삭제`);

  // 4) 브랜드 드리프트 (data.meta 단일 소스에서만)
  if (watermark !== meta.handle) fail("BRAND", `워터마크 "${watermark}" ≠ ${meta.handle}`);
  if (source !== meta.source) fail("BRAND", `출처 문구가 data.meta.source와 불일치`);

  // 5) 정책/제도 카드는 [발행 전 확인] 강제
  if (spec.type === "policy" && spec.verifyBeforePublish !== true)
    fail("POLICY", `정책/제도 카드는 verifyBeforePublish:true 필수 ([발행 전 확인] 배지)`);

  return out;
}
