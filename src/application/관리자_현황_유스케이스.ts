import { sql } from "drizzle-orm";
import type { 수집_설정, 수집_기록 } from "../domain/수집/엔티티";
import type {
  수집_기록_저장소,
  수집_설정_저장소,
} from "../domain/수집/저장소";
import type { 지역_저장소 } from "../domain/지역/저장소";
import type { 실거래_저장소 } from "../domain/실거래/저장소";
import { DB } from "../infrastructure/persistence/접속";
import { 실거래_테이블 } from "../infrastructure/persistence/스키마";

export interface 관리자_현황 {
  설정: 수집_설정;
  총_거래_건수: number;
  상태별_개수: Record<string, number>;
  시도별_진행: Array<{
    시도_코드: string;
    시도명: string;
    누적_저장: number;
  }>;
  최근_기록: 수집_기록[];
  마지막_실행_시각: Date | null;
}

export class 관리자_현황_유스케이스 {
  constructor(
    private readonly 실거래_저장소: 실거래_저장소,
    private readonly 지역_저장소: 지역_저장소,
    private readonly 설정_저장소: 수집_설정_저장소,
    private readonly 기록_저장소: 수집_기록_저장소,
  ) {}

  async 실행(): Promise<관리자_현황> {
    const [설정, 총_거래, 상태별, 시도_목록, 시도_DB_카운트, 최근] = await Promise.all([
      this.설정_저장소.설정_조회(),
      this.실거래_저장소.실거래_개수({}),
      this.기록_저장소.상태별_개수(),
      this.지역_저장소.시도_목록_조회(),
      DB.select({
        시도_코드: 실거래_테이블.시도_코드,
        카운트: sql<number>`count(*)::int`,
      })
        .from(실거래_테이블)
        .groupBy(실거래_테이블.시도_코드),
      this.기록_저장소.최근_기록_조회(40),
    ]);

    const 누적_맵 = new Map(시도_DB_카운트.map((s) => [s.시도_코드, s.카운트]));
    const 시도별_진행 = 시도_목록
      .map((s) => ({
        시도_코드: s.코드,
        시도명: s.이름,
        누적_저장: 누적_맵.get(s.코드) ?? 0,
      }))
      .sort((a, b) => b.누적_저장 - a.누적_저장);

    return {
      설정,
      총_거래_건수: 총_거래,
      상태별_개수: 상태별,
      시도별_진행,
      최근_기록: 최근,
      마지막_실행_시각: 최근[0]?.실행_시각 ?? null,
    };
  }
}
