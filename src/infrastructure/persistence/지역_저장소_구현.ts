import { eq, sql } from "drizzle-orm";
import type { 시군구, 시도, 읍면동 } from "../../domain/지역/엔티티";
import type { 지역_저장소 } from "../../domain/지역/저장소";
import { DB } from "./접속";
import { 시군구_테이블, 시도_테이블, 읍면동_테이블 } from "./스키마";

export class 지역_저장소_PG implements 지역_저장소 {
  async 시도_목록_조회(): Promise<시도[]> {
    const 행들 = await DB.select().from(시도_테이블).orderBy(시도_테이블.코드);
    return 행들.map((r) => ({ 코드: r.코드, 이름: r.이름 }));
  }

  async 시군구_목록_조회(시도_코드: string): Promise<시군구[]> {
    const 행들 = await DB.select()
      .from(시군구_테이블)
      .where(eq(시군구_테이블.시도_코드, 시도_코드))
      .orderBy(시군구_테이블.이름);
    return 행들.map((r) => ({
      코드: r.코드,
      이름: r.이름,
      시도_코드: r.시도_코드,
    }));
  }

  async 읍면동_목록_조회(시군구_코드: string): Promise<읍면동[]> {
    const 행들 = await DB.select()
      .from(읍면동_테이블)
      .where(eq(읍면동_테이블.시군구_코드, 시군구_코드))
      .orderBy(읍면동_테이블.이름);
    return 행들.map((r) => ({
      코드: r.코드,
      이름: r.이름,
      시군구_코드: r.시군구_코드,
    }));
  }

  async 시도_저장(시도_목록: 시도[]): Promise<void> {
    if (시도_목록.length === 0) return;
    await DB.insert(시도_테이블)
      .values(시도_목록.map((s) => ({ 코드: s.코드, 이름: s.이름 })))
      .onConflictDoUpdate({
        target: 시도_테이블.코드,
        set: { 이름: sql`excluded.name` },
      });
  }

  async 시군구_저장(시군구_목록: 시군구[]): Promise<void> {
    if (시군구_목록.length === 0) return;
    await DB.insert(시군구_테이블)
      .values(시군구_목록)
      .onConflictDoUpdate({
        target: 시군구_테이블.코드,
        set: { 이름: sql`excluded.name` },
      });
  }
}
