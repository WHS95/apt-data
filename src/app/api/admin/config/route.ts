import { NextResponse } from "next/server";
import { z } from "zod";
import { 컨테이너 } from "../../../../infrastructure/di/컨테이너";
import { 관리자_인증됨 } from "../../../../infrastructure/관리자_인증";

export const dynamic = "force-dynamic";

const 패치_스키마 = z.object({
  활성: z.boolean().optional(),
  요청_딜레이_MS: z.number().int().min(1000).max(60000).optional(),
  청크_개월: z.number().int().min(1).max(12).optional(),
  쿨다운_HTML_MS: z.number().int().min(60000).max(3600000).optional(),
  최대_재시도: z.number().int().min(1).max(10).optional(),
  년수_제한: z.number().int().min(1).max(20).optional(),
});

export async function GET() {
  if (!(await 관리자_인증됨()))
    return NextResponse.json({ 오류: "인증 필요" }, { status: 401 });
  const 설정 = await 컨테이너.수집_설정_저장소.설정_조회();
  return NextResponse.json(설정);
}

export async function PATCH(요청: Request) {
  if (!(await 관리자_인증됨()))
    return NextResponse.json({ 오류: "인증 필요" }, { status: 401 });
  const 본문 = await 요청.json();
  const 파싱 = 패치_스키마.safeParse(본문);
  if (!파싱.success) {
    return NextResponse.json(
      { 오류: "잘못된 요청", 상세: 파싱.error.flatten() },
      { status: 400 },
    );
  }
  const 갱신 = await 컨테이너.수집_설정_저장소.설정_갱신(파싱.data);
  return NextResponse.json(갱신);
}
