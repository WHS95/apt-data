import { and, eq, gte, sql } from "drizzle-orm";
import { DB } from "../infrastructure/persistence/접속";
import { 시군구_테이블, 실거래_테이블 } from "../infrastructure/persistence/스키마";

export interface 지도_지표 {
  시군구_코드: string;
  시군구명: string;
  매매_평균가_만원: number | null;
  전세_평균가_만원: number | null;
  전세가율_퍼센트: number | null;
  거래_건수: number;
  변화_6개월_퍼센트: number | null;
  최신_거래가_만원: number | null;
}

const 일자_뒤로 = (일수: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - 일수);
  return d.toISOString().slice(0, 10);
};

const 중위 = (값들: number[]): number | null => {
  if (값들.length === 0) return null;
  const 정렬 = [...값들].sort((a, b) => a - b);
  return 정렬[Math.floor(정렬.length / 2)];
};

export class 서울_지도_유스케이스 {
  async 실행(옵션: { 기간_개월?: number } = {}): Promise<지도_지표[]> {
    const 기간 = 옵션.기간_개월 ?? 6;
    const T_현재 = 일자_뒤로(기간 * 30);
    const T_이전 = 일자_뒤로(기간 * 30 * 2);
    const T_이전_끝 = 일자_뒤로(기간 * 30);

    // 시군구별 매매 평균, 거래량, 최신 거래
    const 매매_집계 = await DB.select({
      시군구_코드: 실거래_테이블.시군구_코드,
      시군구명: 시군구_테이블.이름,
      매매_평균: sql<number>`avg(${실거래_테이블.거래_금액_만원})::int`,
      거래_건수: sql<number>`count(*)::int`,
      최신_거래가: sql<number>`(array_agg(${실거래_테이블.거래_금액_만원} order by ${실거래_테이블.계약_일자} desc))[1]`,
    })
      .from(실거래_테이블)
      .leftJoin(시군구_테이블, eq(시군구_테이블.코드, 실거래_테이블.시군구_코드))
      .where(
        and(
          eq(실거래_테이블.시도_코드, "11000"),
          eq(실거래_테이블.물건_유형, "A"),
          eq(실거래_테이블.거래_유형, "1"),
          eq(실거래_테이블.해제_여부, false),
          gte(실거래_테이블.계약_일자, T_현재),
        ),
      )
      .groupBy(실거래_테이블.시군구_코드, 시군구_테이블.이름);

    // 시군구별 전세 평균
    const 전세_집계 = await DB.select({
      시군구_코드: 실거래_테이블.시군구_코드,
      전세_평균: sql<number>`avg(${실거래_테이블.보증금_만원})::int`,
    })
      .from(실거래_테이블)
      .where(
        and(
          eq(실거래_테이블.시도_코드, "11000"),
          eq(실거래_테이블.물건_유형, "A"),
          eq(실거래_테이블.거래_유형, "2"),
          eq(실거래_테이블.해제_여부, false),
          gte(실거래_테이블.계약_일자, T_현재),
        ),
      )
      .groupBy(실거래_테이블.시군구_코드);
    const 전세_맵 = new Map(전세_집계.map((r) => [r.시군구_코드, r.전세_평균]));

    // 시군구별 이전 기간 평균 (변화율용)
    const 이전_집계 = await DB.select({
      시군구_코드: 실거래_테이블.시군구_코드,
      평균: sql<number>`avg(${실거래_테이블.거래_금액_만원})::int`,
    })
      .from(실거래_테이블)
      .where(
        and(
          eq(실거래_테이블.시도_코드, "11000"),
          eq(실거래_테이블.물건_유형, "A"),
          eq(실거래_테이블.거래_유형, "1"),
          eq(실거래_테이블.해제_여부, false),
          gte(실거래_테이블.계약_일자, T_이전),
          sql`${실거래_테이블.계약_일자} < ${T_이전_끝}`,
        ),
      )
      .groupBy(실거래_테이블.시군구_코드);
    const 이전_맵 = new Map(이전_집계.map((r) => [r.시군구_코드, r.평균]));

    return 매매_집계.map((r) => {
      const 매매 = r.매매_평균;
      const 전세 = 전세_맵.get(r.시군구_코드) ?? null;
      const 이전 = 이전_맵.get(r.시군구_코드) ?? null;
      return {
        시군구_코드: r.시군구_코드,
        시군구명: r.시군구명 ?? r.시군구_코드,
        매매_평균가_만원: 매매,
        전세_평균가_만원: 전세,
        전세가율_퍼센트:
          매매 && 전세 ? Math.round((전세 / 매매) * 1000) / 10 : null,
        거래_건수: r.거래_건수,
        변화_6개월_퍼센트:
          매매 && 이전
            ? Math.round(((매매 - 이전) / 이전) * 1000) / 10
            : null,
        최신_거래가_만원: r.최신_거래가 ?? null,
      };
    });
  }
}
