import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { DB } from "../infrastructure/persistence/접속";
import { 시군구_테이블, 실거래_테이블 } from "../infrastructure/persistence/스키마";
import type { 권역_요약 } from "../domain/통계/지표";

export interface 권역_비교_옵션 {
  시군구_코드_목록: string[];
  면적_최소: number;
  면적_최대: number;
  계약_시작일: string;
  계약_종료일: string;
}

const 점수_계산 = (평균가: number | null, 전세가율: number | null): number => {
  if (!평균가) return 0;
  const 가격_점수 = Math.max(0, 100 - 평균가 / 800);
  const 비율_점수 = 전세가율 ? Math.max(0, 100 - Math.abs(전세가율 - 70) * 2) : 50;
  return Math.round(가격_점수 * 0.6 + 비율_점수 * 0.4);
};

export class 권역_비교_유스케이스 {
  async 실행(옵션: 권역_비교_옵션): Promise<권역_요약[]> {
    const 공통_절 = [
      inArray(실거래_테이블.시군구_코드, 옵션.시군구_코드_목록),
      eq(실거래_테이블.물건_유형, "A"),
      eq(실거래_테이블.해제_여부, false),
      gte(실거래_테이블.계약_일자, 옵션.계약_시작일),
      lte(실거래_테이블.계약_일자, 옵션.계약_종료일),
      gte(실거래_테이블.전용_면적_제곱미터, 옵션.면적_최소),
      lte(실거래_테이블.전용_면적_제곱미터, 옵션.면적_최대),
    ];

    const 매매 = await DB.select({
      시군구_코드: 실거래_테이블.시군구_코드,
      시군구명: 시군구_테이블.이름,
      평균: sql<number>`avg(${실거래_테이블.거래_금액_만원})::int`,
      건수: sql<number>`count(*)::int`,
    })
      .from(실거래_테이블)
      .leftJoin(시군구_테이블, eq(시군구_테이블.코드, 실거래_테이블.시군구_코드))
      .where(and(...공통_절, eq(실거래_테이블.거래_유형, "1")))
      .groupBy(실거래_테이블.시군구_코드, 시군구_테이블.이름);

    const 전세 = await DB.select({
      시군구_코드: 실거래_테이블.시군구_코드,
      평균: sql<number>`avg(${실거래_테이블.보증금_만원})::int`,
    })
      .from(실거래_테이블)
      .where(and(...공통_절, eq(실거래_테이블.거래_유형, "2")))
      .groupBy(실거래_테이블.시군구_코드);

    const 전세_맵 = new Map(전세.map((r) => [r.시군구_코드, r.평균]));

    return 매매
      .map((r) => {
        const 전세가율 =
          r.평균 && 전세_맵.get(r.시군구_코드)
            ? Math.round((전세_맵.get(r.시군구_코드)! / r.평균) * 1000) / 10
            : null;
        return {
          시군구_코드: r.시군구_코드,
          시군구명: r.시군구명 ?? r.시군구_코드,
          평균_매매가_만원: r.평균,
          전세가율,
          거래_건수: r.건수,
          가성비_점수: 점수_계산(r.평균, 전세가율),
        };
      })
      .sort((a, b) => b.가성비_점수 - a.가성비_점수);
  }
}
