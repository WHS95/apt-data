import { NextResponse } from "next/server";
import { spawnSync } from "node:child_process";
import { 관리자_인증됨 } from "../../../../infrastructure/관리자_인증";

// 관리자 카드 빌드 API: 서버에서 스튜디오 엔진(build.mjs)을 실행해
// public/studio 로 PNG를 뽑고, 가드레일 결과(JSON)를 돌려준다. fail-closed 그대로.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await 관리자_인증됨()))
    return NextResponse.json({ ok: false, error: "인증 필요" }, { status: 401 });
  const body = await req.json().catch(() => ({} as { cardsFile?: string }));
  const cardsFile = (body as { cardsFile?: string }).cardsFile || "src/studio/cards.json";
  // cards 파일 경로 화이트리스트 (임의 파일 실행 방지)
  if (!/^src\/studio\/[\w.-]+\.json$/.test(cardsFile)) {
    return NextResponse.json({ ok: false, error: "허용되지 않은 cards 파일" }, { status: 400 });
  }
  const r = spawnSync(
    process.execPath,
    ["src/studio/build.mjs", cardsFile, "--out=public/studio", "--json"],
    { cwd: process.cwd(), encoding: "utf8", maxBuffer: 1 << 26 },
  );
  try {
    return NextResponse.json(JSON.parse((r.stdout || "").trim()));
  } catch {
    return NextResponse.json(
      { ok: false, error: r.stderr?.slice(-2000) || r.stdout?.slice(-2000) || "빌드 실패" },
      { status: 500 },
    );
  }
}
