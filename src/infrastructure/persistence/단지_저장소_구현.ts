import { and, eq, ilike, inArray, sql } from "drizzle-orm";
import type { 단지 } from "../../domain/단지/엔티티";
import type { 단지_저장소, 단지_조회_조건 } from "../../domain/단지/저장소";
import type { 물건_유형_코드 } from "../../domain/공통/코드";
import { DB } from "./접속";
import { 단지_테이블, 시군구_테이블 } from "./스키마";

const 행_매핑 = (r: typeof 단지_테이블.$inferSelect): 단지 => ({
  코드: r.코드,
  이름: r.이름,
  시군구_코드: r.시군구_코드,
  읍면동_코드: r.읍면동_코드,
  도로명: r.도로명,
  지번_주소: r.지번_주소,
  물건_유형: r.물건_유형 as 물건_유형_코드,
  준공_연도: r.준공_연도,
});

export class 단지_저장소_PG implements 단지_저장소 {
  async 단지_조회(코드: string): Promise<단지 | null> {
    const 행들 = await DB.select().from(단지_테이블).where(eq(단지_테이블.코드, 코드)).limit(1);
    const 첫 = 행들[0];
    return 첫 ? 행_매핑(첫) : null;
  }

  async 단지_검색(조건: 단지_조회_조건): Promise<단지[]> {
    const 조건문: ReturnType<typeof eq>[] = [];
    if (조건.시군구_코드) 조건문.push(eq(단지_테이블.시군구_코드, 조건.시군구_코드));
    if (조건.검색어) 조건문.push(ilike(단지_테이블.이름, `%${조건.검색어}%`));
    if (조건.시도_코드 && !조건.시군구_코드) {
      const 시군구들 = await DB.select({ 코드: 시군구_테이블.코드 })
        .from(시군구_테이블)
        .where(eq(시군구_테이블.시도_코드, 조건.시도_코드));
      const 코드들 = 시군구들.map((s) => s.코드);
      if (코드들.length === 0) return [];
      조건문.push(inArray(단지_테이블.시군구_코드, 코드들));
    }
    const 행들 = await DB.select()
      .from(단지_테이블)
      .where(조건문.length > 0 ? and(...조건문) : undefined)
      .limit(조건.최대 ?? 50);
    return 행들.map(행_매핑);
  }

  async 단지_저장_또는_갱신(단지_목록: 단지[]): Promise<void> {
    if (단지_목록.length === 0) return;
    await DB.insert(단지_테이블)
      .values(단지_목록)
      .onConflictDoUpdate({
        target: 단지_테이블.코드,
        set: { 이름: sql`excluded.name` },
      });
  }
}
