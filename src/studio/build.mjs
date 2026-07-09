// APT DATA 카드 스튜디오 빌드: data.json(검증숫자) + cards(스펙) → 검증 → HTML → PNG
// 사용: node src/studio/build.mjs [cards파일] [--out=디렉토리] [--json]
//   --out=  출력 디렉토리 (기본 참고자료/마케팅/카드_out)
//   --json  결과를 JSON 한 줄로 출력(관리자 API가 파싱). 없으면 사람용 로그.
// FAIL 하나라도 있으면 exit 1 (fail-closed).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { loadTokens, lightTokens } from "./tokens.mjs";
import { templates } from "./templates.mjs";
import { validate } from "./validate.mjs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const args = process.argv.slice(2);
const cardsFile = args.find((a) => !a.startsWith("--")) || "src/studio/cards.json";
const OUT = (args.find((a) => a.startsWith("--out=")) || "--out=참고자료/마케팅/카드_out").slice(6);
const asJson = args.includes("--json");
const log = (...a) => { if (!asJson) console.log(...a); };

const root = process.cwd();
const data = JSON.parse(readFileSync(join(root, "src/studio/data.json"), "utf8"));
const cards = JSON.parse(readFileSync(join(root, cardsFile), "utf8"));
const t = loadTokens();
const tLight = lightTokens();
const meta = data.meta;
mkdirSync(join(root, OUT), { recursive: true });

const guShort = (n) => (n.length > 2 && /[구군]$/.test(n) ? n.slice(0, -1) : n);
const fmt = (v) => v.toFixed(1);
const getPath = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
const resolve = (s) => String(s).replace(/\{\{([^}]+)\}\}/g, (_, p) => {
  const v = getPath(data, p.trim());
  if (v === undefined) throw new Error(`데이터 키 없음: ${p}`);
  return v;
});

function buildModel(spec) {
  const base = { eyebrow: spec.eyebrow, brand: meta.brand, source: meta.source, watermark: meta.handle,
                 format: spec.format || "feed",
                 badge: spec.type === "policy" ? "발행 전 확인 (정책·세율 최신 기준)" : null };
  const rawProse = [], resolvedProse = [];
  const P = (raw) => { rawProse.push(raw); const r = resolve(raw); resolvedProse.push(r.replace(/<[^>]+>/g, " ")); return r; };
  // 캡션도 카드와 같은 바인딩·가드레일을 통과한다 (손 숫자 금지 → 카드와 캡션이 어긋날 수 없음)
  const caption = spec.captionTpl
    ? { text: P(spec.captionTpl), cta: spec.cta ? P(spec.cta) : null, hashtags: spec.hashtags || [] }
    : null;
  base.caption = caption;
  if (spec.template === "hero") {
    const model = { ...base, kicker: spec.kicker ? P(spec.kicker) : null,
      number: fmt(getPath(data, spec.valueRef)).replace(/\.0$/, ""), unit: spec.unit,
      headline: P(spec.headlineTpl), sub: spec.subTpl ? P(spec.subTpl) : null };
    return { model, rawProse, resolvedProse };
  }
  if (spec.template === "ranking") {
    const src = data[spec.source];
    const ent = Object.entries(src).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v);
    const top = ent.slice(0, spec.topN), bot = ent.slice(-spec.bottomN);
    const mn = ent[ent.length - 1], mx = ent[0], ratio = Math.round(mx.v / mn.v);
    const rows = [...top.map((e) => ({ label: e.k, value: e.v })), { divider: true },
      ...bot.map((e, i) => ({ label: e.k, value: e.v, hl: spec.highlightMin && i === bot.length - 1 }))];
    const callout = `제일 싼 <b>${guShort(mn.k)} ${fmt(mn.v)}억</b> ↔ 제일 비싼 <b>${guShort(mx.k)} ${fmt(mx.v)}억</b> · 약 <b>${ratio}배</b>`;
    resolvedProse.push(callout.replace(/<[^>]+>/g, " "));
    const model = { ...base, headline: P(spec.headlineTpl), rows, callout };
    return { model, rawProse, resolvedProse };
  }
  if (spec.template === "concept") {
    const model = { ...base, headline: P(spec.headlineTpl), paras: spec.paras.map((p) => P(p)) };
    return { model, rawProse, resolvedProse };
  }
  if (spec.template === "picks") {
    const rows = getPath(data, spec.source);
    if (!Array.isArray(rows) || rows.length === 0) throw new Error(`picks 소스 비어있음: ${spec.source}`);
    const model = { ...base, headline: P(spec.headlineTpl), rows,
      callout: spec.calloutTpl ? P(spec.calloutTpl) : null };
    return { model, rawProse, resolvedProse };
  }
  throw new Error(`unknown template: ${spec.template}`);
}

function measure(htmlPath) {
  const dom = execFileSync(CHROME, ["--headless=new", "--dump-dom", "--virtual-time-budget=9000", `file://${join(root, htmlPath)}`],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 24 });
  const of = /data-of="(\d)"/.exec(dom), h = /data-h="(\d+)"/.exec(dom);
  return { overflow: of ? of[1] === "1" : false, height: h ? +h[1] : null };
}

const results = [];
const 캡션들 = [];
let anyFail = false;
log(`\n■ APT DATA 카드 스튜디오 — ${cardsFile} (data: ${meta.rows}행) → ${OUT}\n`);
for (const spec of cards) {
  const { model, rawProse, resolvedProse } = buildModel(spec);
  const html = templates[spec.template](model, spec.theme === "light" ? tLight : t);
  const htmlPath = `${OUT}/${spec.id}.html`;
  writeFileSync(join(root, htmlPath), html);
  const render = measure(htmlPath);
  const issues = validate({ spec, rawProse, resolvedProse, render, watermark: model.watermark, source: model.source, meta });
  const pass = !issues.some((i) => i.level === "FAIL");
  let png = null;
  if (pass) {
    png = `${OUT}/${spec.id}.png`;
    const size = spec.format === "reel" ? "1080,1920" : "1080,1350";
    execFileSync(CHROME, ["--headless=new", `--screenshot=${join(root, png)}`, `--window-size=${size}`,
      "--hide-scrollbars", "--virtual-time-budget=9000", `file://${join(root, htmlPath)}`], { stdio: "ignore" });
    log(`  ✓ ${spec.id}  → ${spec.id}.png  (높이 ${render.height}px)`);
  } else {
    anyFail = true;
    log(`  ✗ ${spec.id}  [BLOCKED]`);
    for (const i of issues) log(`      ${i.level} ${i.rule}: ${i.msg}`);
  }
  results.push({ id: spec.id, template: spec.template, type: spec.type, pass, height: render.height,
                 png: png ? "/" + png.split("/").slice(-2).join("/") : null,
                 caption: model.caption, issues });
  if (pass && model.caption) 캡션들.push({ id: spec.id, ...model.caption });
}

// 통과 카드의 캡션을 PNG 옆에 함께 방출 (발행 시 복붙용)
if (캡션들.length) {
  const md = ["# 카드 캡션 (자동 생성 — build.mjs)",
    "> 숫자는 data.json 바인딩이라 카드와 항상 일치. 손으로 고치지 말고 스펙(captionTpl)을 고칠 것.", ""];
  for (const c of 캡션들) {
    md.push(`## ${c.id}`, "", c.text, "");
    if (c.cta) md.push(`CTA: ${c.cta}`, "");
    if (c.hashtags.length) md.push(c.hashtags.join(" "), "");
    md.push("---", "");
  }
  writeFileSync(join(root, OUT, "캡션.md"), md.join("\n"));
  log(`  ✎ 캡션.md  (${캡션들.length}개 카드)`);
}
log(anyFail ? "\n● 결과: FAIL 있음 — 차단됨 (exit 1)\n" : "\n● 결과: 전부 통과\n");
if (asJson) process.stdout.write(JSON.stringify({ ok: !anyFail, out: OUT, results }));
process.exit(anyFail ? 1 : 0);
