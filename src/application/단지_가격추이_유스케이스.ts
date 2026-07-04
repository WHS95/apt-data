import { and, eq, gte, lte, sql } from "drizzle-orm";
import { DB } from "../infrastructure/persistence/접속";
import { 실거래_테이블 } from "../infrastructure/persistence/스키마";
import type { 가격_추이_포인트 } from "../domain/통계/지표";

export interface 단지_가격추이_옵션 {
  단지명: string;
  시군구_코드?: string;
  계약_시작일: string;
  계약_종료일: string;
}

const 중위값 = (값들: number[]): number | null => {
  if (값들.length === 0) return null;
  const 정렬됨 = [...값들].sort((a, b) => a - b);
  const 중간 = Math.floor(정렬됨.length / 2);
  return 정렬됨.length % 2 === 0
    ? Math.round((정렬됨[중간 - 1] + 정렬됨[중간]) / 2)
    : 정렬됨[중간];
};

export class 단지_가격추이_유스케이스 {
  async 실행(옵션: 단지_가격추이_옵션): Promise<가격_추이_포인트[]> {
    const 절들 = [
      eq(실거래_테이블.단지명, 옵션.단지명),
      eq(실거래_테이블.해제_여부, false),
      gte(실거래_테이블.계약_일자, 옵션.계약_시작일),
      lte(실거래_테이블.계약_일자, 옵션.계약_종료일),
    ];
    if (옵션.시군구_코드) 절들.push(eq(실거래_테이블.시군구_코드, 옵션.시군구_코드));

    const 행들 = await DB.select({
      계약_연도: 실거래_테이블.계약_연도,
      계약_월: 실거래_테이블.계약_월,
      거래_유형: 실거래_테이블.거래_유형,
      거래_금액_만원: 실거래_테이블.거래_금액_만원,
      보증금_만원: 실거래_테이블.보증금_만원,
    })
      .from(실거래_테이블)
      .where(and(...절들))
      .orderBy(실거래_테이블.계약_일자);

    const 그룹 = new Map<
      string,
      { 매매: number[]; 전세: number[] }
    >();
    for (const 행 of 행들) {
      const 년월 = `${행.계약_연도}-${String(행.계약_월).padStart(2, "0")}`;
      const 묶음 = 그룹.get(년월) ?? { 매매: [], 전세: [] };
      if (행.거래_유형 === "1" && 행.거래_금액_만원) {
        묶음.매매.push(행.거래_금액_만원);
      } else if (행.거래_유형 === "2" && 행.보증금_만원) {
        묶음.전세.push(행.보증금_만원);
      }
      그룹.set(년월, 묶음);
    }

    return Array.from(그룹.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([년월, 묶음]) => ({
        년월,
        매매_중위_만원: 중위값(묶음.매매),
        전세_중위_만원: 중위값(묶음.전세),
        거래_건수: 묶음.매매.length + 묶음.전세.length,
      }));
  }
}
