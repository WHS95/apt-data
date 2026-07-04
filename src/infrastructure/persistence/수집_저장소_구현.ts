import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { 거래_유형_코드, 물건_유형_코드 } from "../../domain/공통/코드";
import type {
  수집_기록,
  수집_상태,
  수집_설정,
} from "../../domain/수집/엔티티";
import type {
  수집_기록_저장소,
  수집_설정_저장소,
} from "../../domain/수집/저장소";
import { DB } from "./접속";
import { 수집_기록_테이블, 수집_설정_테이블 } from "./스키마";

export class 수집_설정_저장소_PG implements 수집_설정_저장소 {
  async 설정_조회(): Promise<수집_설정> {
    const 행들 = await DB.select()
      .from(수집_설정_테이블)
      .where(eq(수집_설정_테이블.키, "global"))
      .limit(1);
    const 첫 = 행들[0];
    if (!첫) {
      // 자동 생성
      const [신규] = await DB.insert(수집_설정_테이블)
        .values({ 키: "global" })
        .returning();
      return 신규;
    }
    return 첫;
  }

  async 설정_갱신(
    부분: Partial<Omit<수집_설정, "키" | "갱신_시각">>,
  ): Promise<수집_설정> {
    const [갱신됨] = await DB.update(수집_설정_테이블)
      .set({ ...부분, 갱신_시각: new Date() })
      .where(eq(수집_설정_테이블.키, "global"))
      .returning();
    return 갱신됨;
  }
}

const 키_생성 = (
  시도: string,
  물건: string,
  거래: string,
  시작: string,
  종료: string,
) => `${시도}_${물건}_${거래}_${시작}_${종료}`;

export class 수집_기록_저장소_PG implements 수집_기록_저장소 {
  async 기록_저장(
    기록: Omit<수집_기록, "ID" | "실행_시각"> & { ID?: string },
  ): Promise<void> {
    const ID =
      기록.ID ??
      `${키_생성(기록.시도_코드, 기록.물건_유형, 기록.거래_유형, 기록.청크_시작, 기록.청크_종료)}_${Date.now()}`;
    await DB.insert(수집_기록_테이블)
      .values({
        ID,
        시도_코드: 기록.시도_코드,
        물건_유형: 기록.물건_유형,
        거래_유형: 기록.거래_유형,
        청크_시작: 기록.청크_시작,
        청크_종료: 기록.청크_종료,
        상태: 기록.상태,
        저장_건수: 기록.저장_건수,
        파싱_건수: 기록.파싱_건수,
        소요_MS: 기록.소요_MS,
        오류_메시지: 기록.오류_메시지,
      })
      .onConflictDoNothing();
  }

  async 최근_기록_조회(최대: number): Promise<수집_기록[]> {
    const 행들 = await DB.select()
      .from(수집_기록_테이블)
      .orderBy(desc(수집_기록_테이블.실행_시각))
      .limit(최대);
    return 행들.map((r) => ({
      ID: r.ID,
      시도_코드: r.시도_코드,
      물건_유형: r.물건_유형 as 물건_유형_코드,
      거래_유형: r.거래_유형 as 거래_유형_코드,
      청크_시작: r.청크_시작,
      청크_종료: r.청크_종료,
      상태: r.상태 as 수집_상태,
      저장_건수: r.저장_건수,
      파싱_건수: r.파싱_건수,
      소요_MS: r.소요_MS,
      오류_메시지: r.오류_메시지,
      실행_시각: r.실행_시각,
    }));
  }

  async 상태별_개수(): Promise<Record<수집_상태, number>> {
    const 행들 = await DB.select({
      상태: 수집_기록_테이블.상태,
      개수: sql<number>`count(*)::int`,
    })
      .from(수집_기록_테이블)
      .groupBy(수집_기록_테이블.상태);
    const 결과: Record<수집_상태, number> = {
      success: 0,
      empty: 0,
      blocked: 0,
      error: 0,
    };
    for (const r of 행들) {
      결과[r.상태 as 수집_상태] = r.개수;
    }
    return 결과;
  }

  async 완료_청크_목록(): Promise<Set<string>> {
    const 행들 = await DB.select({
      시도_코드: 수집_기록_테이블.시도_코드,
      물건_유형: 수집_기록_테이블.물건_유형,
      거래_유형: 수집_기록_테이블.거래_유형,
      청크_시작: 수집_기록_테이블.청크_시작,
      청크_종료: 수집_기록_테이블.청크_종료,
    })
      .from(수집_기록_테이블)
      .where(eq(수집_기록_테이블.상태, "success"));
    return new Set(
      행들.map((r) =>
        키_생성(r.시도_코드, r.물건_유형, r.거래_유형, r.청크_시작, r.청크_종료),
      ),
    );
  }

  async 최근_차단_청크(시간_이내_MS: number): Promise<Set<string>> {
    const 기준시각 = new Date(Date.now() - 시간_이내_MS);
    const 행들 = await DB.select({
      시도_코드: 수집_기록_테이블.시도_코드,
      물건_유형: 수집_기록_테이블.물건_유형,
      거래_유형: 수집_기록_테이블.거래_유형,
      청크_시작: 수집_기록_테이블.청크_시작,
      청크_종료: 수집_기록_테이블.청크_종료,
    })
      .from(수집_기록_테이블)
      .where(
        and(
          eq(수집_기록_테이블.상태, "blocked"),
          gte(수집_기록_테이블.실행_시각, 기준시각),
        ),
      );
    return new Set(
      행들.map((r) =>
        키_생성(r.시도_코드, r.물건_유형, r.거래_유형, r.청크_시작, r.청크_종료),
      ),
    );
  }

  async 시도별_누적_저장(): Promise<
    Array<{ 시도_코드: string; 저장_건수: number }>
  > {
    const 행들 = await DB.select({
      시도_코드: 수집_기록_테이블.시도_코드,
      합계: sql<number>`sum(${수집_기록_테이블.저장_건수})::int`,
    })
      .from(수집_기록_테이블)
      .groupBy(수집_기록_테이블.시도_코드);
    return 행들.map((r) => ({
      시도_코드: r.시도_코드,
      저장_건수: r.합계 ?? 0,
    }));
  }
}
