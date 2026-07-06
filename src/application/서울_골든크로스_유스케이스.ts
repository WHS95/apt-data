import { and, eq, gt, gte, isNotNull, lt, sql } from "drizzle-orm";
import { DB } from "../infrastructure/persistence/접속";
import { 시군구_테이블, 실거래_테이블 } from "../infrastructure/persistence/스키마";

// 서울 자치구별 주간 평당가 + 단기(8주)·장기(24주) 이동평균 + 골든/데드크로스.
// 주식차트 스타일 '상승신호' 뷰(/signal)의 데이터. 25개 구를 한 번에 계산해 전달.
export interface 골든크로스_주점 {
  시각: string; // 주 시작(월요일) YYYY-MM-DD — lightweight-charts time
  평당: number; // 주별 평당가 중위(만원/평)
  단기: number | null; // 8주 이동평균
  장기: number | null; // 24주 이동평균
}
export interface 골든크로스_구 {
  시군구_코드: string;
  시군구명: string;
  주간: 골든크로스_주점[];
  골든크로스: Array<{ 시각: string; 평당: number }>;
  데드크로스: Array<{ 시각: string; 평당: number }>;
  현재_상태: "골든" | "데드" | "중립";
  최근_골든_시각: string | null;
  현재_스프레드: number | null; // (단기-장기)/장기 × 100
}

const 단기_창 = 8;
const 장기_창 = 24;

const 일_뒤로 = (기준: Date, 일수: number): Date => {
  const d = new Date(기준);
  d.setDate(d.getDate() - 일수);
  return d;
};
const 일ISO = (d: Date) => d.toISOString().slice(0, 10);

// 캐리포워드 필()된 배열에서 i 위치의 w주 단순이동평균
const 이동평균 = (arr: number[], i: number, w: number): number | null => {
  if (i < w - 1) return null;
  let s = 0;
  for (let k = i - w + 1; k <= i; k++) s += arr[k];
  return Math.round(s / w);
};

export class 서울_골든크로스_유스케이스 {
  async 실행(): Promise<골든크로스_구[]> {
    const 오늘 = new Date();
    const 완결_끝 = 일_뒤로(오늘, 30); // 신고지연 완결창
    const 시작 = 일_뒤로(완결_끝, 730); // 약 2년
    const 면적 = 실거래_테이블.전용_면적_제곱미터;
    const 금액 = 실거래_테이블.거래_금액_만원;

    // 구 × 주(월요일) 평당가 중위
    const 행들 = await DB.select({
      시군구: 실거래_테이블.시군구_코드,
      주: sql<string>`to_char(date_trunc('week', ${실거래_테이블.계약_일자}), 'YYYY-MM-DD')`,
      평당: sql<number>`percentile_cont(0.5) WITHIN GROUP (ORDER BY ${금액}::real / (${면적} / 3.305785))::int`,
    })
      .from(실거래_테이블)
      .where(
        and(
          eq(실거래_테이블.시도_코드, "11000"),
          eq(실거래_테이블.물건_유형, "A"),
          eq(실거래_테이블.거래_유형, "1"),
          eq(실거래_테이블.해제_여부, false),
          gt(면적, 0),
          isNotNull(금액),
          gte(실거래_테이블.계약_일자, 일ISO(시작)),
          lt(실거래_테이블.계약_일자, 일ISO(완결_끝)),
        ),
      )
      .groupBy(sql`1`, sql`2`);

    const 구목록 = await DB.select({
      코드: 시군구_테이블.코드,
      이름: 시군구_테이블.이름,
    })
      .from(시군구_테이블)
      .where(eq(시군구_테이블.시도_코드, "11000"));

    // 전체 주 그리드(관측된 주들의 정렬 집합 — 서울은 매주 거래 있어 사실상 연속)
    const 주그리드 = [...new Set(행들.map((r) => r.주))].sort();
    const 구별 = new Map<string, Map<string, number>>();
    for (const r of 행들) {
      if (!구별.has(r.시군구)) 구별.set(r.시군구, new Map());
      구별.get(r.시군구)!.set(r.주, r.평당);
    }

    const 결과: 골든크로스_구[] = [];
    for (const g of 구목록) {
      const wm = 구별.get(g.코드);
      if (!wm) continue;

      // 첫 관측 주부터 캐리포워드로 연속 시계열 구성(이평선 연속성)
      const 주열: string[] = [];
      const 평당열: number[] = [];
      let 직전: number | null = null;
      for (const wk of 주그리드) {
        const v = wm.get(wk);
        if (v != null) 직전 = v;
        if (직전 == null) continue;
        주열.push(wk);
        평당열.push(직전);
      }
      const n = 평당열.length;
      if (n < 장기_창) continue; // 장기선도 못 그리면 스킵

      const 단기 = 평당열.map((_, i) => 이동평균(평당열, i, 단기_창));
      const 장기 = 평당열.map((_, i) => 이동평균(평당열, i, 장기_창));

      const 주간: 골든크로스_주점[] = 주열.map((시각, i) => ({
        시각,
        평당: 평당열[i],
        단기: 단기[i],
        장기: 장기[i],
      }));

      const 골든: Array<{ 시각: string; 평당: number }> = [];
      const 데드: Array<{ 시각: string; 평당: number }> = [];
      for (let i = 1; i < n; i++) {
        const s0 = 단기[i - 1], l0 = 장기[i - 1], s1 = 단기[i], l1 = 장기[i];
        if (s0 == null || l0 == null || s1 == null || l1 == null) continue;
        if (s0 <= l0 && s1 > l1) 골든.push({ 시각: 주열[i], 평당: 평당열[i] });
        else if (s0 >= l0 && s1 < l1) 데드.push({ 시각: 주열[i], 평당: 평당열[i] });
      }

      // 현재 상태: 마지막으로 단기·장기 모두 정의된 주 기준
      let 현재_상태: "골든" | "데드" | "중립" = "중립";
      let 현재_스프레드: number | null = null;
      for (let i = n - 1; i >= 0; i--) {
        const s = 단기[i], l = 장기[i];
        if (s != null && l != null) {
          현재_상태 = s > l ? "골든" : s < l ? "데드" : "중립";
          현재_스프레드 = Math.round(((s - l) / l) * 1000) / 10;
          break;
        }
      }

      결과.push({
        시군구_코드: g.코드,
        시군구명: g.이름,
        주간,
        골든크로스: 골든,
        데드크로스: 데드,
        현재_상태,
        최근_골든_시각: 골든.length ? 골든[골든.length - 1].시각 : null,
        현재_스프레드,
      });
    }

    // 현재 골든 → 스프레드 큰 순으로 정렬(스캐너에서 상단 노출)
    결과.sort((a, b) => {
      const 순 = (r: 골든크로스_구) => (r.현재_상태 === "골든" ? 0 : r.현재_상태 === "중립" ? 1 : 2);
      if (순(a) !== 순(b)) return 순(a) - 순(b);
      return (b.현재_스프레드 ?? -99) - (a.현재_스프레드 ?? -99);
    });
    return 결과;
  }
}
