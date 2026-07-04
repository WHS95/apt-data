import { NextResponse } from "next/server";
import { 예산별_매물분포_유스케이스 } from "../../../application/예산별_매물분포_유스케이스";
import type { 물건_유형_코드 } from "../../../domain/공통/코드";

export const dynamic = "force-dynamic";

export async function GET(요청: Request) {
  const url = new URL(요청.url);
  const 예산_만원 = Number(url.searchParams.get("예산") ?? "60000");
  const 물건 = (url.searchParams.get("물건") ?? "A") as 물건_유형_코드;
  const 시작 = url.searchParams.get("시작") ?? "2025-01-01";
  const 종료 = url.searchParams.get("종료") ?? new Date().toISOString().slice(0, 10);

  const 유스케이스 = new 예산별_매물분포_유스케이스();
  const 결과 = await 유스케이스.실행({
    예산_만원,
    허용_초과율: Number(url.searchParams.get("초과율") ?? "0.05"),
    물건_유형: 물건,
    계약_시작일: 시작,
    계약_종료일: 종료,
  });
  return NextResponse.json({ 데이터: 결과 });
}
