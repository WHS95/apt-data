import { and, eq, gte, lte, sql } from "drizzle-orm";
import { DB } from "../infrastructure/persistence/접속";
import { 시도_테이블, 실거래_테이블 } from "../infrastructure/persistence/스키마";
import type { 예산별_분포_버킷 } from "../domain/통계/지표";
import type { 물건_유형_코드 } from "../domain/공통/코드";

export interface 예산별_분포_옵션 {
  예산_만원: number;
  허용_초과율: number;
  물건_유형: 물건_유형_코드;
  계약_시작일: string;
  계약_종료일: string;
}

export class 예산별_매물분포_유스케이스 {
  async 실행(옵션: 예산별_분포_옵션): Promise<예산별_분포_버킷[]> {
    const 상한 = Math.round(옵션.예산_만원 * (1 + 옵션.허용_초과율));
    const 행들 = await DB.select({
      시도_코드: 실거래_테이블.시도_코드,
      시도명: 시도_테이블.이름,
      건수: sql<number>`count(*)::int`,
    })
      .from(실거래_테이블)
      .leftJoin(시도_테이블, eq(시도_테이블.코드, 실거래_테이블.시도_코드))
      .where(
        and(
          eq(실거래_테이블.물건_유형, 옵션.물건_유형),
          eq(실거래_테이블.거래_유형, "1"),
          eq(실거래_테이블.해제_여부, false),
          gte(실거래_테이블.계약_일자, 옵션.계약_시작일),
          lte(실거래_테이블.계약_일자, 옵션.계약_종료일),
          lte(실거래_테이블.거래_금액_만원, 상한),
        ),
      )
      .groupBy(실거래_테이블.시도_코드, 시도_테이블.이름)
      .orderBy(sql`count(*) desc`);

    return 행들.map((r) => ({
      시도_코드: r.시도_코드,
      시도명: r.시도명 ?? r.시도_코드,
      매물_건수: r.건수,
    }));
  }
}
