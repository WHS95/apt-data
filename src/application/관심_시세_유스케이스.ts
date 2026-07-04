import { and, asc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { DB } from "../infrastructure/persistence/접속";
import { 실거래_테이블 } from "../infrastructure/persistence/스키마";

export interface 관심_시세_요청 {
  단지들: Array<{ 시군구_코드: string; 단지명: string }>;
}

export interface 관심_시세_행 {
  시군구_코드: string;
  단지명: string;
  최근_거래가_만원: number | null;
  최근_거래일: string | null;
  월별_평균가: Array<{ 년월: string; 평균_만원: number }>;
  거래_건수: number;
  변화_6개월_퍼센트: number | null;
  이상치_제외_최신가: number | null;
}

const 일자_뒤로 = (일수: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - 일수);
  return d.toISOString().slice(0, 10);
};

const 중위값 = (값들: number[]): number | null => {
  if (값들.length === 0) return null;
  const 정렬 = [...값들].sort((a, b) => a - b);
  return 정렬[Math.floor(정렬.length / 2)];
};

export class 관심_시세_유스케이스 {
  async 실행(요청: 관심_시세_요청): Promise<관심_시세_행[]> {
    if (요청.단지들.length === 0) return [];

    const T_365 = 일자_뒤로(365);
    const T_90 = 일자_뒤로(90);
    const T_180 = 일자_뒤로(180);
    const T_270 = 일자_뒤로(270);

    // 여러 단지를 OR 로 한 번에 조회 (단지명 + 시군구 조합)
    const 조건들 = 요청.단지들.map((d) =>
      and(
        eq(실거래_테이블.시군구_코드, d.시군구_코드),
        ilike(실거래_테이블.단지명, d.단지명),
      ),
    );

    const 거래들 = await DB.select({
      시군구_코드: 실거래_테이블.시군구_코드,
      단지명: 실거래_테이블.단지명,
      계약_일자: 실거래_테이블.계약_일자,
      계약_연도: 실거래_테이블.계약_연도,
      계약_월: 실거래_테이블.계약_월,
      거래_유형: 실거래_테이블.거래_유형,
      거래_금액_만원: 실거래_테이블.거래_금액_만원,
      거래_경위: 실거래_테이블.거래_경위,
      전용_면적_제곱미터: 실거래_테이블.전용_면적_제곱미터,
    })
      .from(실거래_테이블)
      .where(
        and(
          eq(실거래_테이블.해제_여부, false),
          eq(실거래_테이블.거래_유형, "1"),
          gte(실거래_테이블.계약_일자, T_365),
          or(...조건들),
        ),
      )
      .orderBy(asc(실거래_테이블.계약_일자));

    // 단지 키별 그룹
    const 그룹: Map<
      string,
      {
        시군구_코드: string;
        단지명: string;
        거래_원본: Array<(typeof 거래들)[number]>;
      }
    > = new Map();
    for (const t of 거래들) {
      const 키 = `${t.시군구_코드}|${t.단지명}`;
      if (!그룹.has(키)) {
        그룹.set(키, {
          시군구_코드: t.시군구_코드,
          단지명: t.단지명!,
          거래_원본: [],
        });
      }
      그룹.get(키)!.거래_원본.push(t);
    }

    const 결과: 관심_시세_행[] = [];
    for (const d of 요청.단지들) {
      const 키 = `${d.시군구_코드}|${d.단지명}`;
      const g = 그룹.get(키);
      if (!g) {
        결과.push({
          시군구_코드: d.시군구_코드,
          단지명: d.단지명,
          최근_거래가_만원: null,
          최근_거래일: null,
          월별_평균가: [],
          거래_건수: 0,
          변화_6개월_퍼센트: null,
          이상치_제외_최신가: null,
        });
        continue;
      }

      // 월별 평균가
      const 월별_맵 = new Map<string, number[]>();
      for (const t of g.거래_원본) {
        if (!t.거래_금액_만원) continue;
        const 년월 = `${t.계약_연도}-${String(t.계약_월).padStart(2, "0")}`;
        if (!월별_맵.has(년월)) 월별_맵.set(년월, []);
        월별_맵.get(년월)!.push(t.거래_금액_만원);
      }
      const 월별_평균가 = Array.from(월별_맵.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([년월, 가격들]) => ({
          년월,
          평균_만원: Math.round(
            가격들.reduce((a, b) => a + b, 0) / 가격들.length,
          ),
        }));

      // 최신 거래
      const 최신 = g.거래_원본[g.거래_원본.length - 1];

      // 이상치 제외 최신가
      const 전체_가격들 = g.거래_원본
        .map((t) => t.거래_금액_만원)
        .filter((v): v is number => v != null);
      const 중위 = 중위값(전체_가격들);
      let 이상치_제외_최신가: number | null = null;
      if (중위) {
        const 정상 = [...g.거래_원본]
          .reverse()
          .find(
            (t) =>
              t.거래_금액_만원 &&
              t.거래_경위 !== "직거래" &&
              t.거래_금액_만원 >= 중위 * 0.65 &&
              t.거래_금액_만원 <= 중위 * 1.35,
          );
        이상치_제외_최신가 = 정상?.거래_금액_만원 ?? null;
      }

      // 6개월 변화율
      const 최근_평균 =
        중위값(
          g.거래_원본
            .filter((t) => t.계약_일자 >= T_90 && t.거래_금액_만원)
            .map((t) => t.거래_금액_만원!),
        );
      const 이전_평균 =
        중위값(
          g.거래_원본
            .filter(
              (t) =>
                t.계약_일자 >= T_270 &&
                t.계약_일자 < T_180 &&
                t.거래_금액_만원,
            )
            .map((t) => t.거래_금액_만원!),
        );
      const 변화_6개월 =
        최근_평균 && 이전_평균
          ? Math.round(((최근_평균 - 이전_평균) / 이전_평균) * 1000) / 10
          : null;

      결과.push({
        시군구_코드: d.시군구_코드,
        단지명: d.단지명,
        최근_거래가_만원: 최신?.거래_금액_만원 ?? null,
        최근_거래일: 최신?.계약_일자 ?? null,
        월별_평균가,
        거래_건수: g.거래_원본.length,
        변화_6개월_퍼센트: 변화_6개월,
        이상치_제외_최신가,
      });
    }

    return 결과;
  }
}
