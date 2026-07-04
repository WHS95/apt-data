import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { DB } from "../infrastructure/persistence/접속";
import {
  시군구_테이블,
  시도_테이블,
  실거래_테이블,
} from "../infrastructure/persistence/스키마";
import type { 매수추천_행 } from "../domain/통계/매수추천";
import { 면적_구간 } from "../domain/공통/코드";
import type { 면적_구간_코드 } from "../domain/공통/코드";

export interface 매수추천_옵션 {
  시도_코드_목록: string[];
  면적_구간?: 면적_구간_코드 | "전체";
  예산_상한_만원?: number;
  기준일?: string;
}

const 일자_뒤로 = (기준: Date, 일수: number): string => {
  const d = new Date(기준);
  d.setDate(d.getDate() - 일수);
  return d.toISOString().slice(0, 10);
};

const 백분율_변화 = (현재: number | null, 이전: number | null): number | null => {
  if (현재 == null || 이전 == null || 이전 === 0) return null;
  return Math.round(((현재 - 이전) / 이전) * 1000) / 10;
};

const 종합_점수_계산 = (행: Omit<매수추천_행, "종합_점수" | "월별_평균가">): number => {
  // 가격 접근성 (낮을수록 좋음, 5억 만점 → 점수 100, 15억 → 0)
  const 가격 = 행.평균_매매가_만원 ?? Infinity;
  const 접근성 = Math.max(0, Math.min(100, 100 - ((가격 - 50000) / 100000) * 100));

  // 가격 모멘텀 (3개월 +2~+8% 이상적, 너무 높으면 과열)
  const c3 = 행.변화_3개월_퍼센트 ?? 0;
  const 모멘텀 =
    c3 < -5 ? 30 : c3 < 0 ? 60 : c3 < 10 ? 100 - Math.abs(c3 - 5) * 6 : 50;

  // 전세가율 안정성 (65-75% 이상적)
  const j = 행.전세가율_퍼센트 ?? 50;
  const 안정성 = 100 - Math.abs(j - 70) * 3;

  // 거래량 유동성 (1.0 이상 좋음)
  const m = 행.거래량_모멘텀 ?? 0.5;
  const 유동성 = Math.max(0, Math.min(100, m * 80));

  const 점수 =
    접근성 * 0.3 + 모멘텀 * 0.3 + 안정성 * 0.25 + 유동성 * 0.15;
  return Math.round(Math.max(0, Math.min(100, 점수)));
};

export class 수도권_매수추천_유스케이스 {
  async 실행(옵션: 매수추천_옵션): Promise<매수추천_행[]> {
    const 기준일 = 옵션.기준일 ? new Date(옵션.기준일) : new Date();
    const T0 = 일자_뒤로(기준일, 0);
    const T_90 = 일자_뒤로(기준일, 90);
    const T_180 = 일자_뒤로(기준일, 180);
    const T_270 = 일자_뒤로(기준일, 270);
    const T_365 = 일자_뒤로(기준일, 365);

    const 공통_절들 = [
      inArray(실거래_테이블.시도_코드, 옵션.시도_코드_목록),
      eq(실거래_테이블.물건_유형, "A"),
      eq(실거래_테이블.해제_여부, false),
      gte(실거래_테이블.계약_일자, T_365),
      lte(실거래_테이블.계약_일자, T0),
    ];

    if (옵션.면적_구간 && 옵션.면적_구간 !== "전체") {
      const 구간 = 면적_구간[옵션.면적_구간];
      공통_절들.push(gte(실거래_테이블.전용_면적_제곱미터, 구간.최소));
      if (Number.isFinite(구간.최대)) {
        공통_절들.push(lte(실거래_테이블.전용_면적_제곱미터, 구간.최대));
      }
    }
    if (옵션.예산_상한_만원) {
      공통_절들.push(lte(실거래_테이블.거래_금액_만원, 옵션.예산_상한_만원));
    }

    // 단일 집계 쿼리 — 시군구별 모든 지표 한 번에
    const 집계 = await DB.select({
      시군구_코드: 실거래_테이블.시군구_코드,
      시군구명: 시군구_테이블.이름,
      시도_코드: 실거래_테이블.시도_코드,
      시도명: 시도_테이블.이름,

      매매_최근: sql<number>`
        avg(CASE
          WHEN ${실거래_테이블.거래_유형} = '1' AND ${실거래_테이블.계약_일자} > ${T_90}
          THEN ${실거래_테이블.거래_금액_만원} END)::int
      `,
      매매_3개월전: sql<number>`
        avg(CASE
          WHEN ${실거래_테이블.거래_유형} = '1'
          AND ${실거래_테이블.계약_일자} > ${T_180}
          AND ${실거래_테이블.계약_일자} <= ${T_90}
          THEN ${실거래_테이블.거래_금액_만원} END)::int
      `,
      매매_6개월전: sql<number>`
        avg(CASE
          WHEN ${실거래_테이블.거래_유형} = '1'
          AND ${실거래_테이블.계약_일자} > ${T_270}
          AND ${실거래_테이블.계약_일자} <= ${T_180}
          THEN ${실거래_테이블.거래_금액_만원} END)::int
      `,
      전세_평균: sql<number>`
        avg(CASE
          WHEN ${실거래_테이블.거래_유형} = '2'
          AND ${실거래_테이블.계약_일자} > ${T_90}
          THEN ${실거래_테이블.보증금_만원} END)::int
      `,
      거래_최근: sql<number>`
        count(CASE WHEN ${실거래_테이블.계약_일자} > ${T_90} THEN 1 END)::int
      `,
      거래_이전: sql<number>`
        count(CASE
          WHEN ${실거래_테이블.계약_일자} > ${T_180}
          AND ${실거래_테이블.계약_일자} <= ${T_90}
          THEN 1 END)::int
      `,
    })
      .from(실거래_테이블)
      .leftJoin(시군구_테이블, eq(시군구_테이블.코드, 실거래_테이블.시군구_코드))
      .leftJoin(시도_테이블, eq(시도_테이블.코드, 실거래_테이블.시도_코드))
      .where(and(...공통_절들))
      .groupBy(
        실거래_테이블.시군구_코드,
        시군구_테이블.이름,
        실거래_테이블.시도_코드,
        시도_테이블.이름,
      )
      .having(sql`count(*) > 20`);

    // 월별 평균가 (12개월) — sparkline용
    const 월별 = await DB.select({
      시군구_코드: 실거래_테이블.시군구_코드,
      년월: sql<string>`to_char(${실거래_테이블.계약_일자}, 'YYYY-MM')`,
      평균: sql<number>`avg(${실거래_테이블.거래_금액_만원})::int`,
    })
      .from(실거래_테이블)
      .where(
        and(
          ...공통_절들,
          eq(실거래_테이블.거래_유형, "1"),
        ),
      )
      .groupBy(
        실거래_테이블.시군구_코드,
        sql`to_char(${실거래_테이블.계약_일자}, 'YYYY-MM')`,
      )
      .orderBy(sql`to_char(${실거래_테이블.계약_일자}, 'YYYY-MM')`);

    const 월별_맵 = new Map<string, Array<{ 년월: string; 평균_만원: number }>>();
    for (const m of 월별) {
      if (!월별_맵.has(m.시군구_코드)) 월별_맵.set(m.시군구_코드, []);
      월별_맵.get(m.시군구_코드)!.push({ 년월: m.년월, 평균_만원: m.평균 });
    }

    return 집계
      .map((g) => {
        const 변화_3 = 백분율_변화(g.매매_최근, g.매매_3개월전);
        const 변화_6 = 백분율_변화(g.매매_최근, g.매매_6개월전);
        const 전세가율 =
          g.매매_최근 && g.전세_평균
            ? Math.round((g.전세_평균 / g.매매_최근) * 1000) / 10
            : null;
        const 모멘텀 =
          g.거래_이전 > 0
            ? Math.round((g.거래_최근 / g.거래_이전) * 100) / 100
            : null;

        const 행: Omit<매수추천_행, "종합_점수" | "월별_평균가"> = {
          시도_코드: g.시도_코드,
          시도명: g.시도명 ?? g.시도_코드,
          시군구_코드: g.시군구_코드,
          시군구명: g.시군구명 ?? g.시군구_코드,
          평균_매매가_만원: g.매매_최근,
          매매_3개월전_만원: g.매매_3개월전,
          매매_6개월전_만원: g.매매_6개월전,
          전세_평균_만원: g.전세_평균,
          거래_최근_3개월: g.거래_최근,
          거래_이전_3개월: g.거래_이전,
          변화_3개월_퍼센트: 변화_3,
          변화_6개월_퍼센트: 변화_6,
          전세가율_퍼센트: 전세가율,
          거래량_모멘텀: 모멘텀,
        };

        return {
          ...행,
          종합_점수: 종합_점수_계산(행),
          월별_평균가: 월별_맵.get(g.시군구_코드) ?? [],
        };
      })
      .sort((a, b) => b.종합_점수 - a.종합_점수);
  }
}
