import { and, eq, gte, lte, sql } from "drizzle-orm";
import { DB } from "../infrastructure/persistence/접속";
import { 시군구_테이블, 실거래_테이블 } from "../infrastructure/persistence/스키마";
import type { 분양_캘린더_항목 } from "../domain/통계/지표";

export interface 분양_캘린더_옵션 {
  계약_시작일: string;
  계약_종료일: string;
  시도_코드?: string;
}

export class 분양_캘린더_유스케이스 {
  async 실행(옵션: 분양_캘린더_옵션): Promise<분양_캘린더_항목[]> {
    const 절들 = [
      eq(실거래_테이블.물건_유형, "E"),
      eq(실거래_테이블.해제_여부, false),
      gte(실거래_테이블.계약_일자, 옵션.계약_시작일),
      lte(실거래_테이블.계약_일자, 옵션.계약_종료일),
    ];
    if (옵션.시도_코드) 절들.push(eq(실거래_테이블.시도_코드, 옵션.시도_코드));

    const 행들 = await DB.select({
      계약일: 실거래_테이블.계약_일자,
      단지명: 실거래_테이블.단지명,
      시군구명: 시군구_테이블.이름,
      건수: sql<number>`count(*)::int`,
      평균: sql<number>`avg(${실거래_테이블.거래_금액_만원})::int`,
    })
      .from(실거래_테이블)
      .leftJoin(시군구_테이블, eq(시군구_테이블.코드, 실거래_테이블.시군구_코드))
      .where(and(...절들))
      .groupBy(실거래_테이블.계약_일자, 실거래_테이블.단지명, 시군구_테이블.이름)
      .orderBy(실거래_테이블.계약_일자);

    return 행들.map((r) => ({
      계약일: r.계약일,
      단지명: r.단지명,
      시군구명: r.시군구명 ?? "",
      거래_건수: r.건수,
      평균_금액_만원: r.평균,
    }));
  }
}
