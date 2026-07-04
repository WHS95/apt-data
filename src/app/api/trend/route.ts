import { NextResponse } from "next/server";
import { 단지_가격추이_유스케이스 } from "../../../application/단지_가격추이_유스케이스";

export const dynamic = "force-dynamic";

export async function GET(요청: Request) {
  const url = new URL(요청.url);
  const 단지명 = url.searchParams.get("단지");
  if (!단지명) return NextResponse.json({ 데이터: [] });

  const 시작 = url.searchParams.get("시작") ?? "2023-01-01";
  const 종료 = url.searchParams.get("종료") ?? new Date().toISOString().slice(0, 10);

  const 유스케이스 = new 단지_가격추이_유스케이스();
  const 결과 = await 유스케이스.실행({
    단지명,
    시군구_코드: url.searchParams.get("시군구") ?? undefined,
    계약_시작일: 시작,
    계약_종료일: 종료,
  });
  return NextResponse.json({ 데이터: 결과 });
}
