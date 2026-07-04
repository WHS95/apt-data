import { and, asc, between, desc, eq, gte, ilike, lte, max, sql } from "drizzle-orm";
import type {
  거래_유형_코드,
  면적_구간_코드,
  물건_유형_코드,
} from "../../domain/공통/코드";
import { 면적_구간 } from "../../domain/공통/코드";
import type { 실거래 } from "../../domain/실거래/엔티티";
import type {
  실거래_저장소,
  실거래_조회_조건,
} from "../../domain/실거래/저장소";
import { DB } from "./접속";
import { 실거래_테이블 } from "./스키마";

const 행_매핑 = (r: typeof 실거래_테이블.$inferSelect): 실거래 => ({
  ID: r.ID,
  시도_코드: r.시도_코드,
  시군구_코드: r.시군구_코드,
  읍면동_코드: r.읍면동_코드,
  단지_코드: r.단지_코드,
  단지명: r.단지명,
  도로명: r.도로명,
  지번: r.지번,
  물건_유형: r.물건_유형 as 물건_유형_코드,
  거래_유형: r.거래_유형 as 거래_유형_코드,
  계약_연도: r.계약_연도,
  계약_월: r.계약_월,
  계약_일: r.계약_일,
  계약_일자: r.계약_일자,
  전용_면적_제곱미터: r.전용_면적_제곱미터,
  층: r.층,
  건축_연도: r.건축_연도,
  거래_금액_만원: r.거래_금액_만원,
  보증금_만원: r.보증금_만원,
  월세_만원: r.월세_만원,
  해제_여부: r.해제_여부,
  거래_경위: r.거래_경위 ?? null,
  가격_이상치: r.가격_이상치,
  원천_파일명: r.원천_파일명,
});

const 조건_조립 = (조건: 실거래_조회_조건) => {
  const 절들 = [];
  if (조건.시도_코드) 절들.push(eq(실거래_테이블.시도_코드, 조건.시도_코드));
  if (조건.시군구_코드) 절들.push(eq(실거래_테이블.시군구_코드, 조건.시군구_코드));
  if (조건.단지_코드) 절들.push(eq(실거래_테이블.단지_코드, 조건.단지_코드));
  if (조건.물건_유형) 절들.push(eq(실거래_테이블.물건_유형, 조건.물건_유형));
  if (조건.거래_유형) 절들.push(eq(실거래_테이블.거래_유형, 조건.거래_유형));
  if (조건.계약_시작일 && 조건.계약_종료일) {
    절들.push(between(실거래_테이블.계약_일자, 조건.계약_시작일, 조건.계약_종료일));
  } else if (조건.계약_시작일) {
    절들.push(gte(실거래_테이블.계약_일자, 조건.계약_시작일));
  } else if (조건.계약_종료일) {
    절들.push(lte(실거래_테이블.계약_일자, 조건.계약_종료일));
  }
  if (조건.최소_금액_만원 !== undefined) {
    절들.push(gte(실거래_테이블.거래_금액_만원, 조건.최소_금액_만원));
  }
  if (조건.최대_금액_만원 !== undefined) {
    절들.push(lte(실거래_테이블.거래_금액_만원, 조건.최대_금액_만원));
  }
  if (조건.면적_구간) {
    const 구간 = 면적_구간[조건.면적_구간];
    절들.push(gte(실거래_테이블.전용_면적_제곱미터, 구간.최소));
    if (Number.isFinite(구간.최대)) {
      절들.push(lte(실거래_테이블.전용_면적_제곱미터, 구간.최대));
    }
  }
  if (!조건.포함_해제) {
    절들.push(eq(실거래_테이블.해제_여부, false));
  }
  if (조건.직거래_제외) {
    절들.push(sql`(${실거래_테이블.거래_경위} IS NULL OR ${실거래_테이블.거래_경위} <> '직거래')`);
  }
  if (조건.이상치_제외) {
    절들.push(eq(실거래_테이블.가격_이상치, false));
  }
  if (조건.단지명_부분) {
    절들.push(ilike(실거래_테이블.단지명, `%${조건.단지명_부분}%`));
  }
  return 절들.length > 0 ? and(...절들) : undefined;
};

export class 실거래_저장소_PG implements 실거래_저장소 {
  async 실거래_조회(조건: 실거래_조회_조건): Promise<실거래[]> {
    const 정렬 =
      조건.정렬 === "금액_높은순"
        ? desc(실거래_테이블.거래_금액_만원)
        : 조건.정렬 === "금액_낮은순"
          ? asc(실거래_테이블.거래_금액_만원)
          : 조건.정렬 === "오래된순"
            ? asc(실거래_테이블.계약_일자)
            : desc(실거래_테이블.계약_일자);
    const 행들 = await DB.select()
      .from(실거래_테이블)
      .where(조건_조립(조건))
      .orderBy(정렬)
      .limit(조건.최대 ?? 100)
      .offset(조건.건너뛰기 ?? 0);
    return 행들.map(행_매핑);
  }

  async 실거래_개수(조건: 실거래_조회_조건): Promise<number> {
    const 결과 = await DB.select({ 개수: sql<number>`count(*)::int` })
      .from(실거래_테이블)
      .where(조건_조립(조건));
    return 결과[0]?.개수 ?? 0;
  }

  async 실거래_대량_저장(거래_목록: 실거래[]): Promise<number> {
    if (거래_목록.length === 0) return 0;
    let 누적 = 0;
    const 묶음_크기 = 500;
    for (let i = 0; i < 거래_목록.length; i += 묶음_크기) {
      const 묶음 = 거래_목록.slice(i, i + 묶음_크기);
      const 결과 = await DB.insert(실거래_테이블)
        .values(묶음)
        .onConflictDoNothing()
        .returning({ ID: 실거래_테이블.ID });
      누적 += 결과.length;
    }
    return 누적;
  }

  async 마지막_계약일_조회(
    시도_코드: string,
    물건_유형: 물건_유형_코드,
    거래_유형: 거래_유형_코드,
  ): Promise<string | null> {
    const 행들 = await DB.select({ 최대일: max(실거래_테이블.계약_일자) })
      .from(실거래_테이블)
      .where(
        and(
          eq(실거래_테이블.시도_코드, 시도_코드),
          eq(실거래_테이블.물건_유형, 물건_유형),
          eq(실거래_테이블.거래_유형, 거래_유형),
        ),
      );
    return 행들[0]?.최대일 ?? null;
  }
}
