import { NextResponse } from "next/server";
import { 권역_비교_유스케이스 } from "../../../application/권역_비교_유스케이스";
import { 실거래_캐시 } from "../../../infrastructure/캐시";

export const dynamic = "force-dynamic";

const 캐시_권역 = 실거래_캐시(
  "region",
  (옵션: Parameters<권역_비교_유스케이스["실행"]>[0]) =>
    new 권역_비교_유스케이스().실행(옵션),
);

export async function POST(요청: Request) {
  const 본문 = await 요청.json();
  const 시군구_코드_목록: string[] = 본문.시군구_코드_목록 ?? [];
  const 종료 = 본문.종료 ?? new Date().toISOString().slice(0, 10);
  const 시작_기본 = new Date();
  시작_기본.setMonth(시작_기본.getMonth() - 6);

  const 결과 = await 캐시_권역({
    시군구_코드_목록,
    면적_최소: 본문.면적_최소 ?? 60,
    면적_최대: 본문.면적_최대 ?? 102,
    계약_시작일: 본문.시작 ?? 시작_기본.toISOString().slice(0, 10),
    계약_종료일: 종료,
  });
  return NextResponse.json({ 데이터: 결과 });
}
