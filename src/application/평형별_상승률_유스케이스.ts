import { and, eq, gt, gte, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { DB } from "../infrastructure/persistence/접속";
import { 실거래_테이블 } from "../infrastructure/persistence/스키마";

// 아파트 평형대별(전용 평 기준) 월간 평당가 중위 → 지수(첫 달=100) → 상승률.
// "20평대 상승률 / 30평대 상승률 ..." 을 지역 단위로 비교.
export interface 평형_밴드_추세 {
  키: string;
  라벨: string;
  월간: Array<{ 시각: string; 지수: number; 평당: number }>; // 지수 = 첫 달 대비 100 기준
  상승률: number | null; // 기간 전체 (마지막/처음 − 1) × 100
  건수: number;
}

// 전용면적(㎡) 경계 = 평 기준(1평=3.305785㎡): 20평≈66, 30평≈99, 40평≈132
const 밴드_정의 = [
  { 키: "1", 라벨: "~19평 (66㎡↓)", 최소: 0, 최대: 66 },
  { 키: "2", 라벨: "20평대 (66–99㎡)", 최소: 66, 최대: 99 },
  { 키: "3", 라벨: "30평대 (99–132㎡)", 최소: 99, 최대: 132 },
  { 키: "4", 라벨: "40평대+ (132㎡↑)", 최소: 132, 최대: Infinity },
] as const;

const 일_뒤로 = (기준: Date, 일수: number): string => {
  const d = new Date(기준);
  d.setDate(d.getDate() - 일수);
  return d.toISOString().slice(0, 10);
};

export class 평형별_상승률_유스케이스 {
  async 실행(옵션: {
    시도_코드_목록: string[];
    시군구_코드_목록?: string[];
    기간_개월?: number;
  }): Promise<평형_밴드_추세[]> {
    const 기간 = 옵션.기간_개월 ?? 36;
    const 오늘 = new Date();
    const 완결_끝 = 일_뒤로(오늘, 30);
    const 시작 = 일_뒤로(new Date(완결_끝), 기간 * 30);
    const 면적 = 실거래_테이블.전용_면적_제곱미터;
    const 금액 = 실거래_테이블.거래_금액_만원;

    const 밴드식 = sql<string>`CASE WHEN ${면적} < 66 THEN '1' WHEN ${면적} < 99 THEN '2' WHEN ${면적} < 132 THEN '3' ELSE '4' END`;

    const 절들 = [
      inArray(실거래_테이블.시도_코드, 옵션.시도_코드_목록),
      eq(실거래_테이블.물건_유형, "A"),
      eq(실거래_테이블.거래_유형, "1"),
      eq(실거래_테이블.해제_여부, false),
      gt(면적, 0),
      isNotNull(금액),
      gte(실거래_테이블.계약_일자, 시작),
      lt(실거래_테이블.계약_일자, 완결_끝),
    ];
    if (옵션.시군구_코드_목록 && 옵션.시군구_코드_목록.length > 0) {
      절들.push(inArray(실거래_테이블.시군구_코드, 옵션.시군구_코드_목록));
    }

    // 구 × 밴드 × 월 평당 중위 — 구 고정가중으로 합쳐 '구 구성 편향'을 제거(seoul-map 변화율과 동일 철학)
    const 행들 = await DB.select({
      시군구: 실거래_테이블.시군구_코드,
      밴드: 밴드식,
      월: sql<string>`to_char(date_trunc('month', ${실거래_테이블.계약_일자}), 'YYYY-MM-DD')`,
      평당: sql<number>`percentile_cont(0.5) WITHIN GROUP (ORDER BY ${금액}::real / (${면적} / 3.305785))::int`,
      건수: sql<number>`count(*)::int`,
    })
      .from(실거래_테이블)
      .where(and(...절들))
      .groupBy(sql`1`, sql`2`, sql`3`);

    const 밴드_최소_월건수 = 50; // 소표본(부분)월 제거
    const 구_최소_월건수 = 5;

    // 밴드 → 구 고정가중, 밴드 → (월 → {가중합, 가중분모, 건수})
    const 가중 = new Map<string, Map<string, number>>(); // 밴드 → 구 → 총건수(가중)
    const 셀 = new Map<string, Map<string, Map<string, { 평당: number; n: number }>>>(); // 밴드→월→구→
    for (const r of 행들) {
      if (r.건수 < 구_최소_월건수) continue;
      if (!가중.has(r.밴드)) 가중.set(r.밴드, new Map());
      가중.get(r.밴드)!.set(r.시군구, (가중.get(r.밴드)!.get(r.시군구) ?? 0) + r.건수);
      if (!셀.has(r.밴드)) 셀.set(r.밴드, new Map());
      if (!셀.get(r.밴드)!.has(r.월)) 셀.get(r.밴드)!.set(r.월, new Map());
      셀.get(r.밴드)!.get(r.월)!.set(r.시군구, { 평당: r.평당, n: r.건수 });
    }

    return 밴드_정의
      .map((b): 평형_밴드_추세 | null => {
        const w = 가중.get(b.키);
        const 월맵 = 셀.get(b.키);
        if (!w || !월맵) return null;

        const 월간_원본: Array<{ 시각: string; 평당: number; n: number }> = [];
        for (const [시각, 구맵] of [...월맵.entries()].sort()) {
          let num = 0, den = 0, n = 0;
          for (const [구, v] of 구맵) {
            const 가중치 = w.get(구) ?? 0;
            num += 가중치 * v.평당;
            den += 가중치;
            n += v.n;
          }
          if (den > 0 && n >= 밴드_최소_월건수) {
            월간_원본.push({ 시각, 평당: Math.round(num / den), n });
          }
        }
        if (월간_원본.length < 2) return null;

        const 기준 = 월간_원본[0].평당;
        let 건수합 = 0;
        const 월간 = 월간_원본.map((m) => {
          건수합 += m.n;
          return { 시각: m.시각, 평당: m.평당, 지수: Math.round((m.평당 / 기준) * 1000) / 10 };
        });
        const 마지막 = 월간[월간.length - 1].평당;
        return {
          키: b.키,
          라벨: b.라벨,
          월간,
          상승률: Math.round((마지막 / 기준 - 1) * 1000) / 10,
          건수: 건수합,
        };
      })
      .filter((x): x is 평형_밴드_추세 => x !== null);
  }
}
