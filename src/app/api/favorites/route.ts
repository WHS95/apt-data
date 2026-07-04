import { NextResponse } from "next/server";
import { 관심_시세_유스케이스 } from "../../../application/관심_시세_유스케이스";

export const dynamic = "force-dynamic";

export async function POST(요청: Request) {
  const 본문 = await 요청.json();
  const 단지들 = Array.isArray(본문?.단지들) ? 본문.단지들 : [];
  const 유효 = 단지들
    .filter(
      (d: unknown): d is { 시군구_코드: string; 단지명: string } =>
        !!d &&
        typeof d === "object" &&
        typeof (d as Record<string, unknown>).시군구_코드 === "string" &&
        typeof (d as Record<string, unknown>).단지명 === "string",
    )
    .slice(0, 100);

  const 유스 = new 관심_시세_유스케이스();
  const 결과 = await 유스.실행({ 단지들: 유효 });
  return NextResponse.json({ 데이터: 결과 });
}
