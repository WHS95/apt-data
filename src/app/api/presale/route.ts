import { NextResponse } from "next/server";
import { 분양_캘린더_유스케이스 } from "../../../application/분양_캘린더_유스케이스";
import { 실거래_캐시 } from "../../../infrastructure/캐시";

export const dynamic = "force-dynamic";

const 캐시_분양 = 실거래_캐시(
  "presale",
  (옵션: Parameters<분양_캘린더_유스케이스["실행"]>[0]) =>
    new 분양_캘린더_유스케이스().실행(옵션),
);

export async function GET(요청: Request) {
  const url = new URL(요청.url);
  const 종료 = url.searchParams.get("종료") ?? new Date().toISOString().slice(0, 10);
  const 시작_기본 = new Date();
  시작_기본.setMonth(시작_기본.getMonth() - 3);
  const 시작 = url.searchParams.get("시작") ?? 시작_기본.toISOString().slice(0, 10);

  const 결과 = await 캐시_분양({
    계약_시작일: 시작,
    계약_종료일: 종료,
    시도_코드: url.searchParams.get("시도") ?? undefined,
  });
  return NextResponse.json({ 데이터: 결과 });
}
