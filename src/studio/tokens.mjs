// 브랜드 토큰 = globals.css 단일 소스에서 파생 (복제 금지 → @hanji.zip/토스레드 드리프트 방지)
import { readFileSync } from "node:fs";

const CSS = "src/app/globals.css";

function pick(css, name) {
  const m = css.match(new RegExp(`--${name}\\s*:\\s*(#[0-9A-Fa-f]{6})`));
  if (!m) throw new Error(`globals.css에 --${name} 없음`);
  return m[1].toUpperCase();
}
// 브랜드색을 어둡게 파생 (하단 출처 바) — 새 hex를 하드코딩하지 않는다
function darken(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function loadTokens() {
  const css = readFileSync(CSS, "utf8");
  const brand = pick(css, "color-brand");
  return {
    brand,
    brandSoft: pick(css, "color-brand-soft"),
    accent: pick(css, "color-accent"),
    brandDeep: darken(brand, 0.68),   // 파생
    bar: "#BFD3F0",                    // 막대(브랜드 위 밝은 톤) — 시맨틱 아님
    white: "#FFFFFF",
    mist: "rgba(255,255,255,0.70)",
    mist2: "rgba(255,255,255,0.55)",
    guide: "rgba(255,255,255,0.07)",
  };
}

// 라이트 변형: 흰 배경 + 브랜드(코발트) 글씨 — 같은 단일 소스에서 역할만 반전.
// 템플릿은 토큰 '역할'(brand=배경, white=본문색)만 쓰므로 값 교체로 충분하다.
export function lightTokens() {
  const t = loadTokens();
  return {
    ...t,
    brand: "#FFFFFF",              // 카드 배경
    white: t.brand,                // 본문·헤드라인 = 코발트
    mist: rgba(t.brand, 0.62),
    mist2: rgba(t.brand, 0.45),
    guide: rgba(t.brand, 0.08),
    bar: rgba(t.brand, 0.22),
    brandDeep: t.brand,            // 하단 출처 바 = 코발트 (흰 글씨는 아래 footerInk로)
    footerInk: "#FFFFFF",          // 코발트 푸터 위 글자색
    footerMist: "rgba(255,255,255,0.60)",
  };
}
