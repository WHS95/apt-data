import { and, eq, gte, lte, sql } from "drizzle-orm";
import { DB } from "../infrastructure/persistence/접속";
import { 시군구_테이블, 실거래_테이블 } from "../infrastructure/persistence/스키마";
import type { 전세가율_셀 } from "../domain/통계/지표";
import type { 면적_구간_코드, 물건_유형_코드 } from "../domain/공통/코드";
import { 면적_구간 } from "../domain/공통/코드";

export interface 전세가율_조회_옵션 {
  시도_코드: string;
  물건_유형: 물건_유형_코드;
  계약_시작일: string;
  계약_종료일: string;
}

const 평균_쿼리 = async (
  옵션: 전세가율_조회_옵션,
  거래_유형: "1" | "2",
  면적_코드: 면적_구간_코드,
) => {
  const 구간 = 면적_구간[면적_코드];
  const 절들 = [
    eq(실거래_테이블.시도_코드, 옵션.시도_코드),
    eq(실거래_테이블.물건_유형, 옵션.물건_유형),
    eq(실거래_테이블.거래_유형, 거래_유형),
    eq(실거래_테이블.해제_여부, false),
    gte(실거래_테이블.계약_일자, 옵션.계약_시작일),
    lte(실거래_테이블.계약_일자, 옵션.계약_종료일),
    gte(실거래_테이블.전용_면적_제곱미터, 구간.최소),
  ];
  if (Number.isFinite(구간.최대)) {
    절들.push(lte(실거래_테이블.전용_면적_제곱미터, 구간.최대));
  }
  // 순수전세만: 거래_유형='2'는 전월세 통합이라 월세/반전세(보증금 낮음) 혼입 시
  // 전세가율이 구조적으로 과소추정됨 → 월세=0 인 순수전세만 집계
  if (거래_유형 === "2") {
    절들.push(sql`COALESCE(${실거래_테이블.월세_만원}, 0) = 0`);
  }
  const 금액_열 =
    거래_유형 === "1" ? 실거래_테이블.거래_금액_만원 : 실거래_테이블.보증금_만원;

  const 행들 = await DB.select({
    시군구_코드: 실거래_테이블.시군구_코드,
    시군구명: 시군구_테이블.이름,
    평균: sql<number>`avg(${금액_열})::int`,
    건수: sql<number>`count(*)::int`,
  })
    .from(실거래_테이블)
    .leftJoin(시군구_테이블, eq(시군구_테이블.코드, 실거래_테이블.시군구_코드))
    .where(and(...절들))
    .groupBy(실거래_테이블.시군구_코드, 시군구_테이블.이름);
  return 행들;
};

export class 전세가율_히트맵_유스케이스 {
  async 실행(옵션: 전세가율_조회_옵션): Promise<전세가율_셀[]> {
    const 면적_코드들: 면적_구간_코드[] = ["1", "2", "3", "4", "5"];
    const 셀_맵 = new Map<string, 전세가율_셀>();

    for (const 면적_코드 of 면적_코드들) {
      const 매매 = await 평균_쿼리(옵션, "1", 면적_코드);
      const 전세 = await 평균_쿼리(옵션, "2", 면적_코드);

      const 전세_맵 = new Map(전세.map((r) => [r.시군구_코드, r]));
      for (const 매매_행 of 매매) {
        const 전세_행 = 전세_맵.get(매매_행.시군구_코드);
        const 키 = `${매매_행.시군구_코드}_${면적_코드}`;
        셀_맵.set(키, {
          시군구_코드: 매매_행.시군구_코드,
          시군구명: 매매_행.시군구명 ?? 매매_행.시군구_코드,
          면적_구간: 면적_코드,
          매매_평균_만원: 매매_행.평균,
          전세_평균_만원: 전세_행?.평균 ?? null,
          전세가율:
            매매_행.평균 && 전세_행?.평균
              ? Math.round((전세_행.평균 / 매매_행.평균) * 1000) / 10
              : null,
          거래_건수: 매매_행.건수 + (전세_행?.건수 ?? 0),
        });
      }
    }
    return Array.from(셀_맵.values()).sort((a, b) =>
      a.시군구명.localeCompare(b.시군구명, "ko"),
    );
  }
}
