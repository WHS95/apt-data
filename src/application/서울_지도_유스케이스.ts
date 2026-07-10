import { and, eq, gt, gte, isNotNull, lt, sql } from "drizzle-orm";
import { DB } from "../infrastructure/persistence/접속";
import { 시군구_테이블, 실거래_테이블 } from "../infrastructure/persistence/스키마";

// 서울 자치구 히트맵 지표 — 전문가 토론(데이터/부동산/통계) 검증식 반영.
// 핵심 설계:
//  · 평당가(만원/평) 중위(percentile_cont) — 총액 산술평균의 size-mix·우편향 제거
//  · 면적버킷(60/85/102/135, 코드.ts 면적_구간_분류와 동일 <= 경계) 고정가중 층화
//  · 순수전세(월세_만원=0)만 — 현행은 전월세(월세 43.4%) 혼입으로 전세가율 과소추정
//  · 신고지연 완결창(종료=오늘-30일) 절단
//  · 소표본 suppression(버킷 n<10 제외, 구 유효표본 부족 시 null→회색)
//  · 거래량 색상은 YoY 자기정규화(외부 분모 없음), 원건수는 병기. 1년전 데이터 없으면 인접창 폴백.
export interface 지도_지표 {
  시군구_코드: string;
  시군구명: string;
  매매_평당_만원: number | null; // 색상(매매가): 면적버킷 고정가중 평당 중위
  국민평형_총액_만원: number | null; // 툴팁·예산비교용 60~85㎡ 총액 중위
  전세가율_퍼센트: number | null; // 색상(전세가율): 순수전세 층화 ㎡당 ratio-of-medians
  변화율_퍼센트: number | null; // 색상(변화율): 라스파이레스 고정가중 층화 지수
  거래_건수: number; // 원건수(툴팁/절대)
  거래_YoY_퍼센트: number | null; // 색상(거래량): 전년동기 대비 증감률
  YoY_폴백: boolean; // true = 1년전 데이터 부족 → 인접 직전창으로 폴백
  거래단지수: number; // 약한 규모 프록시(툴팁)
  유효_표본_n: number; // 현재창 유효 매매 건수(신뢰도)
}

const 일ISO = (d: Date): string => d.toISOString().slice(0, 10);
const 일_뒤로 = (기준: Date, 일수: number): Date => {
  const x = new Date(기준);
  x.setDate(x.getDate() - 일수);
  return x;
};

const 버킷_최소_n = 10; // 층화 버킷 유효 하한
const 구_최소_n = 20; // 구 표시(suppression) 하한
const YoY_최소_n = 30; // YoY 분모 유효 하한

export class 서울_지도_유스케이스 {
  async 실행(옵션: { 기간_개월?: number } = {}): Promise<지도_지표[]> {
    const 기간 = 옵션.기간_개월 ?? 6;
    const 오늘 = new Date();
    const 완결_끝 = 일_뒤로(오늘, 30); // 신고지연 완결창 종료
    const 현재_시작 = 일_뒤로(완결_끝, 기간 * 30);
    const 직전_시작 = 일_뒤로(현재_시작, 기간 * 30);
    const YoY_끝 = 일_뒤로(완결_끝, 365);
    const YoY_시작 = 일_뒤로(현재_시작, 365);

    const s_완결_끝 = 일ISO(완결_끝);
    const s_현재_시작 = 일ISO(현재_시작);
    const s_직전_시작 = 일ISO(직전_시작);
    const s_YoY_끝 = 일ISO(YoY_끝);
    const s_YoY_시작 = 일ISO(YoY_시작);

    const 면적 = 실거래_테이블.전용_면적_제곱미터;
    const 금액 = 실거래_테이블.거래_금액_만원;
    const 보증금 = 실거래_테이블.보증금_만원;

    // 면적버킷: 코드.ts 면적_구간_분류(<=)와 동일 경계 (width_bucket 반열림 불일치 회피)
    const 버킷식 = sql<number>`CASE WHEN ${면적}<=60 THEN 1 WHEN ${면적}<=85 THEN 2 WHEN ${면적}<=102 THEN 3 WHEN ${면적}<=135 THEN 4 ELSE 5 END`;
    const 창식 = sql<string>`CASE WHEN ${실거래_테이블.계약_일자} >= ${s_현재_시작} THEN 'cur' ELSE 'prev' END`;
    const 매매평당_중위 = sql<number>`percentile_cont(0.5) WITHIN GROUP (ORDER BY ${금액}::real / (${면적} / 3.305785))::int`;
    const 전세평당_중위 = sql<number>`percentile_cont(0.5) WITHIN GROUP (ORDER BY ${보증금}::real / (${면적} / 3.305785))::int`;

    // 1) 매매: 시군구×버킷×창 평당 중위 + 건수 (현재+직전창)
    const 매매행들_P = DB.select({
      시군구_코드: 실거래_테이블.시군구_코드,
      버킷: 버킷식,
      창: 창식,
      평당: 매매평당_중위,
      건수: sql<number>`count(*)::int`,
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
          gte(실거래_테이블.계약_일자, s_직전_시작),
          lt(실거래_테이블.계약_일자, s_완결_끝),
        ),
      )
      // 창식(CASE)이 파라미터를 써서 GROUP BY 표현식 재사용 시 매칭 실패 → 순서번호로 그룹핑
      .groupBy(sql`1`, sql`2`, sql`3`);

    // 2) 순수전세(월세=0): 시군구×버킷 평당 중위 + 건수 (현재창)
    const 전세행들_P = DB.select({
      시군구_코드: 실거래_테이블.시군구_코드,
      버킷: 버킷식,
      평당: 전세평당_중위,
      건수: sql<number>`count(*)::int`,
    })
      .from(실거래_테이블)
      .where(
        and(
          eq(실거래_테이블.시도_코드, "11000"),
          eq(실거래_테이블.물건_유형, "A"),
          eq(실거래_테이블.거래_유형, "2"),
          eq(실거래_테이블.해제_여부, false),
          gt(면적, 0),
          isNotNull(보증금),
          sql`COALESCE(${실거래_테이블.월세_만원}, 0) = 0`,
          gte(실거래_테이블.계약_일자, s_현재_시작),
          lt(실거래_테이블.계약_일자, s_완결_끝),
        ),
      )
      .groupBy(실거래_테이블.시군구_코드, 버킷식);

    // 3) 구 요약(현재창): 시군구명, 국민평형(60~85㎡) 총액 중위, 거래단지수, 원건수
    const 요약행들_P = DB.select({
      시군구_코드: 실거래_테이블.시군구_코드,
      시군구명: 시군구_테이블.이름,
      국민총액: sql<number | null>`percentile_cont(0.5) WITHIN GROUP (ORDER BY ${금액}) FILTER (WHERE ${면적} > 60 AND ${면적} <= 85)::int`,
      거래단지수: sql<number>`count(DISTINCT COALESCE(${실거래_테이블.단지_코드}, ${실거래_테이블.단지명}))::int`,
      원건수: sql<number>`count(*)::int`,
    })
      .from(실거래_테이블)
      .leftJoin(시군구_테이블, eq(시군구_테이블.코드, 실거래_테이블.시군구_코드))
      .where(
        and(
          eq(실거래_테이블.시도_코드, "11000"),
          eq(실거래_테이블.물건_유형, "A"),
          eq(실거래_테이블.거래_유형, "1"),
          eq(실거래_테이블.해제_여부, false),
          gte(실거래_테이블.계약_일자, s_현재_시작),
          lt(실거래_테이블.계약_일자, s_완결_끝),
        ),
      )
      .groupBy(실거래_테이블.시군구_코드, 시군구_테이블.이름);

    // 4) YoY: 1년 전 동기 완결창 매매 건수 (시군구별)
    const YoY행들_P = DB.select({
      시군구_코드: 실거래_테이블.시군구_코드,
      건수: sql<number>`count(*)::int`,
    })
      .from(실거래_테이블)
      .where(
        and(
          eq(실거래_테이블.시도_코드, "11000"),
          eq(실거래_테이블.물건_유형, "A"),
          eq(실거래_테이블.거래_유형, "1"),
          eq(실거래_테이블.해제_여부, false),
          gte(실거래_테이블.계약_일자, s_YoY_시작),
          lt(실거래_테이블.계약_일자, s_YoY_끝),
        ),
      )
      .groupBy(실거래_테이블.시군구_코드);

    // 데이터 최소일: YoY/폴백 창이 데이터 범위 안에 완전히 들어올 때만 유효(잘린 창=왜곡)
    const 최소일행_P = DB.select({
      최소일: sql<string>`min(${실거래_테이블.계약_일자})`,
    })
      .from(실거래_테이블)
      .where(
        and(
          eq(실거래_테이블.시도_코드, "11000"),
          eq(실거래_테이블.물건_유형, "A"),
        ),
      );

    // 5개 독립 쿼리 병렬 실행 (순차 await → Promise.all: 지연=합→최대)
    const [매매행들, 전세행들, 요약행들, YoY행들, 최소일행] = await Promise.all([
      매매행들_P,
      전세행들_P,
      요약행들_P,
      YoY행들_P,
      최소일행_P,
    ]);
    const data_min = 최소일행[0]?.최소일
      ? new Date(최소일행[0].최소일)
      : new Date(0);
    // 창 시작이 데이터 최소일보다 소폭(경계 오차) 앞서는 것은 허용(예: 12개월창이 며칠 모자란 경우).
    // 장기창(24·36개월)은 1년 전이 데이터를 크게 벗어나므로 여전히 억제됨.
    const 창_여유_기준 = 일_뒤로(data_min, 45); // data_min − 45일
    const yoy_유효 = YoY_시작 >= 창_여유_기준; // 1년 전 동기창이 (여유 내) 데이터 안
    const prev_유효 = 직전_시작 >= 창_여유_기준; // 인접 직전창이 (여유 내) 데이터 안

    // ---- 서울 전체 고정가중 w_b (구 무관, 버킷별 1회) ----
    const w매매 = new Map<number, number>(); // 매매평균가용: 현재창 매매 버킷건수
    const w비율 = new Map<number, number>(); // 전세가율용: (매매현재+전세) 버킷건수
    for (const r of 매매행들) {
      if (r.창 === "cur") {
        w매매.set(r.버킷, (w매매.get(r.버킷) ?? 0) + r.건수);
        w비율.set(r.버킷, (w비율.get(r.버킷) ?? 0) + r.건수);
      }
    }
    for (const r of 전세행들) {
      w비율.set(r.버킷, (w비율.get(r.버킷) ?? 0) + r.건수);
    }

    // ---- 구×버킷 인덱싱 ----
    type 셀 = { med: number; n: number };
    const 매매cur = new Map<string, Map<number, 셀>>();
    const 매매prev = new Map<string, Map<number, 셀>>();
    const 전세 = new Map<string, Map<number, 셀>>();
    const 담기 = (
      m: Map<string, Map<number, 셀>>,
       구: string,
      b: number,
      c: 셀,
    ) => {
      if (!m.has(구)) m.set(구, new Map());
      m.get(구)!.set(b, c);
    };
    for (const r of 매매행들) {
      담기(r.창 === "cur" ? 매매cur : 매매prev, r.시군구_코드, r.버킷, {
        med: r.평당,
        n: r.건수,
      });
    }
    for (const r of 전세행들) {
      담기(전세, r.시군구_코드, r.버킷, { med: r.평당, n: r.건수 });
    }
    const YoY맵 = new Map(YoY행들.map((r) => [r.시군구_코드, r.건수]));

    const 반올림1 = (v: number) => Math.round(v * 10) / 10;

    return 요약행들.map((s): 지도_지표 => {
      const 구 = s.시군구_코드;
      const cur = 매매cur.get(구);
      const prev = 매매prev.get(구);
      const jeon = 전세.get(구);

      // 매매평균가: 서울 고정가중 평당 중위 (유효버킷 n>=10)
      let num = 0,
        den = 0,
        cur총 = 0;
      for (let b = 1; b <= 5; b++) {
        const c = cur?.get(b);
        if (c) cur총 += c.n;
        const w = w매매.get(b);
        if (c && c.n >= 버킷_최소_n && w) {
          num += w * c.med;
          den += w;
        }
      }
      const 매매_평당_만원 =
        den > 0 && cur총 >= 구_최소_n ? Math.round(num / den) : null;

      // 전세가율: 서울 고정가중 ㎡당 ratio-of-medians (매매·전세 각 n>=10)
      let numR = 0,
        denR = 0;
      for (let b = 1; b <= 5; b++) {
        const cm = cur?.get(b);
        const cj = jeon?.get(b);
        const w = w비율.get(b);
        if (cm && cj && cm.n >= 버킷_최소_n && cj.n >= 버킷_최소_n && w && cm.med > 0) {
          numR += w * (cj.med / cm.med);
          denR += w;
        }
      }
      const 전세가율_퍼센트 = denR > 0 ? 반올림1((numR / denR) * 100) : null;

      // 변화율: 라스파이레스 고정가중(직전창 구별 버킷건수) 층화 지수 (현재·직전 각 n>=10)
      let numC = 0,
        denC = 0;
      for (let b = 1; b <= 5; b++) {
        const c = cur?.get(b);
        const p = prev?.get(b);
        if (c && p && c.n >= 버킷_최소_n && p.n >= 버킷_최소_n && p.med > 0) {
          numC += p.n * c.med;
          denC += p.n * p.med;
        }
      }
      const 변화율_퍼센트 = denC > 0 ? 반올림1((numC / denC - 1) * 100) : null;

      // 거래량: 원건수 + YoY 자기정규화(1년전 부족 시 인접 직전창 폴백)
      const 원건수 = s.원건수;
      let prev총 = 0;
      if (prev) for (const c of prev.values()) prev총 += c.n;
      const yoyN = YoY맵.get(구) ?? 0;
      let 거래_YoY_퍼센트: number | null = null;
      let YoY_폴백 = false;
      if (yoy_유효 && yoyN >= YoY_최소_n) {
        거래_YoY_퍼센트 = 반올림1((원건수 / yoyN - 1) * 100);
      } else if (prev_유효 && prev총 >= YoY_최소_n) {
        // 1년 전 창이 데이터 밖이면 인접 직전창으로 폴백(계절 왜곡 감수, 배지 표기)
        거래_YoY_퍼센트 = 반올림1((원건수 / prev총 - 1) * 100);
        YoY_폴백 = true;
      }
      // 둘 다 데이터 밖이면(장기 창) null → 회색(정직한 억제)

      return {
        시군구_코드: 구,
        시군구명: s.시군구명 ?? 구,
        매매_평당_만원,
        국민평형_총액_만원: s.국민총액 ?? null,
        전세가율_퍼센트,
        변화율_퍼센트,
        거래_건수: 원건수,
        거래_YoY_퍼센트,
        YoY_폴백,
        거래단지수: s.거래단지수,
        유효_표본_n: cur총,
      };
    });
  }
}
