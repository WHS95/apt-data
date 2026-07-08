import { and, asc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { DB } from "../infrastructure/persistence/접속";
import {
  공동주택_테이블,
  시군구_테이블,
  시도_테이블,
  실거래_테이블,
} from "../infrastructure/persistence/스키마";
import { 면적_구간 } from "../domain/공통/코드";
import type { 면적_구간_코드 } from "../domain/공통/코드";
import { 도로명_정규화, 시군구_매칭키 } from "../domain/공통/kapt_매칭";

export interface 단지_상세_옵션 {
  시군구_코드: string;
  단지명: string;
  거래_유형?: "1" | "2" | "전체";
  면적_구간?: 면적_구간_코드 | "전체";
  직거래_제외?: boolean;
  이상치_제외?: boolean;
}

export interface 단지_거래_레코드 {
  계약_일자: string;
  거래_유형: string;
  전용_면적_제곱미터: number;
  층: number | null;
  거래_금액_만원: number | null;
  보증금_만원: number | null;
  월세_만원: number | null;
  거래_경위: string | null;
  이상치_의심: boolean;
  의심_사유: string | null;
}

export interface 단지_상세_결과 {
  메타: {
    단지명: string;
    시도명: string;
    시군구명: string;
    건축_연도: number | null;
    단지분류: string | null; // K-apt 단지분류(아파트/주상복합/연립…). 미매칭 null
    세대수: number | null; // K-apt 매칭(시군구+도로명/지번). 소형·미관리 단지는 null
    총_동수: number | null;
    지번: string | null; // 실거래 지번(예: "453-2")
    본번: string | null;
    부번: string | null;
    도로명: string | null;
    평형_목록: Array<{ 제곱미터: number; 평: number; 건수: number }>; // 단지가 거래된 전용면적들
    평형_옵션: Array<{ 코드: 면적_구간_코드; 라벨: string; 거래수: number }>;
    // 데이터가 있는 가장 최근 월 기준(1개월 고정 아님). 월 = 그 값이 언제 것인지
    최근_매매: { 평균_만원: number | null; 건수: number; 월: string | null };
    최근_전세: { 평균_만원: number | null; 건수: number; 월: string | null };
    역대_최고가_만원: number | null;
    역대_최고가_월: string | null;
    전세가율: number | null;
    경위_분포: Record<string, number>; // 중개거래 N, 직거래 M, ...
    이상치_건수: number;
  };
  월별_평균: Array<{
    년월: string;
    매매_평균: number | null;
    전세_평균: number | null;
    매매_건수: number;
    전세_건수: number;
  }>;
  거래들: 단지_거래_레코드[];
}

const 일자_뒤로 = (기준: Date, 일수: number): string => {
  const d = new Date(기준);
  d.setDate(d.getDate() - 일수);
  return d.toISOString().slice(0, 10);
};

export class 단지_상세_유스케이스 {
  async 실행(옵션: 단지_상세_옵션): Promise<단지_상세_결과 | null> {
    const 오늘 = new Date();
    const T_60개월 = 일자_뒤로(오늘, 60 * 30);

    const 절들 = [
      eq(실거래_테이블.시군구_코드, 옵션.시군구_코드),
      ilike(실거래_테이블.단지명, 옵션.단지명),
      eq(실거래_테이블.해제_여부, false),
      gte(실거래_테이블.계약_일자, T_60개월),
    ];

    if (옵션.면적_구간 && 옵션.면적_구간 !== "전체") {
      const 구간 = 면적_구간[옵션.면적_구간];
      절들.push(gte(실거래_테이블.전용_면적_제곱미터, 구간.최소));
      if (Number.isFinite(구간.최대)) {
        절들.push(sql`${실거래_테이블.전용_면적_제곱미터} <= ${구간.최대}`);
      }
    }
    if (옵션.거래_유형 === "1" || 옵션.거래_유형 === "2") {
      절들.push(eq(실거래_테이블.거래_유형, 옵션.거래_유형));
    }

    if (옵션.직거래_제외) {
      절들.push(sql`(${실거래_테이블.거래_경위} IS NULL OR ${실거래_테이블.거래_경위} <> '직거래')`);
    }

    const 행들_원본 = await DB.select({
      계약_일자: 실거래_테이블.계약_일자,
      거래_유형: 실거래_테이블.거래_유형,
      전용_면적_제곱미터: 실거래_테이블.전용_면적_제곱미터,
      층: 실거래_테이블.층,
      거래_금액_만원: 실거래_테이블.거래_금액_만원,
      보증금_만원: 실거래_테이블.보증금_만원,
      월세_만원: 실거래_테이블.월세_만원,
      거래_경위: 실거래_테이블.거래_경위,
      지번: 실거래_테이블.지번,
      도로명: 실거래_테이블.도로명,
    })
      .from(실거래_테이블)
      .where(and(...절들))
      .orderBy(asc(실거래_테이블.계약_일자));

    if (행들_원본.length === 0) return null;

    // 이상치 감지 — 같은 평형 구간 + 같은 거래유형 그룹 내 평균 대비 ±35% 벗어남
    const 그룹_가격 = new Map<string, number[]>();
    for (const r of 행들_원본) {
      const 가격 = r.거래_유형 === "1" ? r.거래_금액_만원 : r.보증금_만원;
      if (!가격) continue;
      const 구간 =
        r.전용_면적_제곱미터 <= 60 ? "1" :
        r.전용_면적_제곱미터 <= 85 ? "2" :
        r.전용_면적_제곱미터 <= 102 ? "3" :
        r.전용_면적_제곱미터 <= 135 ? "4" : "5";
      const 키 = `${r.거래_유형}_${구간}`;
      if (!그룹_가격.has(키)) 그룹_가격.set(키, []);
      그룹_가격.get(키)!.push(가격);
    }
    const 그룹_중위 = new Map<string, number>();
    for (const [k, v] of 그룹_가격.entries()) {
      const 정렬 = [...v].sort((a, b) => a - b);
      그룹_중위.set(k, 정렬[Math.floor(정렬.length / 2)]);
    }

    const 거래들: 단지_거래_레코드[] = 행들_원본.map((r) => {
      const 가격 = r.거래_유형 === "1" ? r.거래_금액_만원 : r.보증금_만원;
      const 구간 =
        r.전용_면적_제곱미터 <= 60 ? "1" :
        r.전용_면적_제곱미터 <= 85 ? "2" :
        r.전용_면적_제곱미터 <= 102 ? "3" :
        r.전용_면적_제곱미터 <= 135 ? "4" : "5";
      const 중위 = 그룹_중위.get(`${r.거래_유형}_${구간}`);
      let 이상치 = false;
      let 사유: string | null = null;
      if (가격 && 중위 && 그룹_가격.get(`${r.거래_유형}_${구간}`)!.length >= 5) {
        const 편차 = (가격 - 중위) / 중위;
        if (편차 <= -0.35) {
          이상치 = true;
          사유 = `평형 중위가 대비 ${(편차 * 100).toFixed(0)}% — 가족 간 거래·증여 의심`;
        } else if (편차 >= 0.5) {
          이상치 = true;
          사유 = `평형 중위가 대비 +${(편차 * 100).toFixed(0)}% — 신고가 이상 거래`;
        }
      }
      if (r.거래_경위 === "직거래") {
        이상치 = true;
        사유 = 사유 ?? "직거래 (중개사 미경유)";
      }
      return {
        계약_일자: r.계약_일자,
        거래_유형: r.거래_유형,
        전용_면적_제곱미터: r.전용_면적_제곱미터,
        층: r.층,
        거래_금액_만원: r.거래_금액_만원,
        보증금_만원: r.보증금_만원,
        월세_만원: r.월세_만원,
        거래_경위: r.거래_경위 ?? null,
        이상치_의심: 이상치,
        의심_사유: 사유,
      };
    });

    // 경위 분포 집계
    const 경위_분포: Record<string, number> = {};
    let 이상치_건수 = 0;
    for (const t of 거래들) {
      const k = t.거래_경위 ?? "미상";
      경위_분포[k] = (경위_분포[k] ?? 0) + 1;
      if (t.이상치_의심) 이상치_건수++;
    }

    // 메타
    const 메타_쿼리 = await DB.select({
      건축_연도: sql<number>`max(${실거래_테이블.건축_연도})::int`,
      시도명: 시도_테이블.이름,
      시군구명: 시군구_테이블.이름,
    })
      .from(실거래_테이블)
      .leftJoin(시군구_테이블, eq(시군구_테이블.코드, 실거래_테이블.시군구_코드))
      .leftJoin(시도_테이블, eq(시도_테이블.코드, 실거래_테이블.시도_코드))
      .where(
        and(
          eq(실거래_테이블.시군구_코드, 옵션.시군구_코드),
          ilike(실거래_테이블.단지명, 옵션.단지명),
        ),
      )
      .groupBy(시도_테이블.이름, 시군구_테이블.이름)
      .limit(1);
    const 메타_행 = 메타_쿼리[0];

    // 평형 옵션
    const 평형_원본 = await DB.select({
      면적: 실거래_테이블.전용_면적_제곱미터,
      거래수: sql<number>`count(*)::int`,
    })
      .from(실거래_테이블)
      .where(
        and(
          eq(실거래_테이블.시군구_코드, 옵션.시군구_코드),
          ilike(실거래_테이블.단지명, 옵션.단지명),
          eq(실거래_테이블.해제_여부, false),
        ),
      )
      .groupBy(실거래_테이블.전용_면적_제곱미터);

    const 평형_맵 = new Map<면적_구간_코드, number>();
    for (const r of 평형_원본) {
      const 코드: 면적_구간_코드 =
        r.면적 <= 60 ? "1" :
        r.면적 <= 85 ? "2" :
        r.면적 <= 102 ? "3" :
        r.면적 <= 135 ? "4" : "5";
      평형_맵.set(코드, (평형_맵.get(코드) ?? 0) + r.거래수);
    }
    const 평형_옵션 = Array.from(평형_맵.entries())
      .map(([코드, 거래수]) => ({
        코드,
        라벨: 면적_구간[코드].라벨,
        거래수,
      }))
      .sort((a, b) => Number(a.코드) - Number(b.코드));

    // 월별 평균 (매매, 전세 분리) — 라인 차트용. 캔들(평형별 총액)은 거래들로 클라에서 계산
    const 월별_맵 = new Map<string, { 매매: number[]; 전세: number[] }>();
    for (const t of 거래들) {
      const 키 = t.계약_일자.slice(0, 7);
      if (!월별_맵.has(키)) 월별_맵.set(키, { 매매: [], 전세: [] });
      if (t.거래_유형 === "1" && t.거래_금액_만원) {
        월별_맵.get(키)!.매매.push(t.거래_금액_만원);
      } else if (
        t.거래_유형 === "2" &&
        t.보증금_만원 &&
        (t.월세_만원 == null || t.월세_만원 === 0)
      ) {
        // 순수전세만 (월세/반전세 제외) — 전세 시세·전세가율 왜곡 방지
        월별_맵.get(키)!.전세.push(t.보증금_만원);
      }
    }
    const 월별_평균 = Array.from(월별_맵.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([년월, v]) => ({
        년월,
        매매_평균:
          v.매매.length > 0
            ? Math.round(v.매매.reduce((a, b) => a + b, 0) / v.매매.length)
            : null,
        전세_평균:
          v.전세.length > 0
            ? Math.round(v.전세.reduce((a, b) => a + b, 0) / v.전세.length)
            : null,
        매매_건수: v.매매.length,
        전세_건수: v.전세.length,
      }));

    // 최근 실거래 — 데이터가 있는 가장 최근 월(1개월 고정 아님). 월별_평균은 오름차순
    const 매매_최근 = [...월별_평균].reverse().find((m) => m.매매_평균 != null) ?? null;
    const 전세_최근 = [...월별_평균].reverse().find((m) => m.전세_평균 != null) ?? null;

    // 역대 최고가
    const 최고가_거래 = 거래들
      .filter((t) => t.거래_유형 === "1" && t.거래_금액_만원)
      .reduce<단지_거래_레코드 | null>(
        (a, b) => (!a || (b.거래_금액_만원! > a.거래_금액_만원!) ? b : a),
        null,
      );

    // 최근 실거래 매매·전세로 전세가율 (각각 가장 최근 월 기준)
    const 매매_avg = 매매_최근?.매매_평균 ?? null;
    const 전세_avg = 전세_최근?.전세_평균 ?? null;
    const 전세가율 =
      매매_avg && 전세_avg
        ? Math.round((전세_avg / 매매_avg) * 1000) / 10
        : null;

    // 지번/도로명 대표값(최빈) + 본번·부번 파싱 + 거래된 전용면적(평형) 목록
    const 최빈 = (값들: (string | null)[]): string | null => {
      const c = new Map<string, number>();
      for (const v of 값들) if (v) c.set(v, (c.get(v) ?? 0) + 1);
      let 대표: string | null = null;
      let 최대 = 0;
      for (const [k, cnt] of c) if (cnt > 최대) { 대표 = k; 최대 = cnt; }
      return 대표;
    };
    const 대표_지번 = 최빈(행들_원본.map((r) => r.지번));
    const 본번 = 대표_지번 ? 대표_지번.split("-")[0] : null;
    const 부번 = 대표_지번 ? 대표_지번.split("-")[1] ?? null : null;
    const 대표_도로명 = 최빈(행들_원본.map((r) => r.도로명));
    const 평형맵 = new Map<number, number>();
    for (const r of 행들_원본) {
      const m = Math.round(r.전용_면적_제곱미터);
      if (m > 0) 평형맵.set(m, (평형맵.get(m) ?? 0) + 1);
    }
    const 평형_목록 = [...평형맵.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([제곱미터, 건수]) => ({
        제곱미터,
        평: Math.round(제곱미터 / 3.305785),
        건수,
      }));

    // K-apt 매칭: 시군구키 + (도로명 끝 앵커 OR 지번 일치) — 소형·미관리 단지는 미매칭.
    // 실거래 도로명은 100% 건물번호로 끝나므로 kapt 도로명주소의 "끝"에 붙여야
    // 345 ⊂ 3450 류 오매칭이 없다.
    const 도로명2 = 도로명_정규화(대표_도로명);
    const 시군구키 = 시군구_매칭키(메타_행?.시군구명 ?? "");
    let 단지분류: string | null = null;
    let 세대수: number | null = null;
    let 총_동수: number | null = null;
    if (도로명2 || 대표_지번) {
      const kapt = await DB.select({
        단지분류: 공동주택_테이블.단지분류,
        세대수: 공동주택_테이블.세대수,
        동수: 공동주택_테이블.동수,
      })
        .from(공동주택_테이블)
        .where(
          and(
            eq(공동주택_테이블.시군구, 시군구키),
            or(
              도로명2
                ? sql`replace(${공동주택_테이블.도로명주소}, ' ', '') LIKE ${"%" + 도로명2}`
                : undefined,
              대표_지번 ? eq(공동주택_테이블.지번, 대표_지번) : undefined,
            ),
          ),
        )
        .limit(1);
      if (kapt[0]) {
        단지분류 = kapt[0].단지분류 ?? null;
        세대수 = kapt[0].세대수 ?? null;
        총_동수 = kapt[0].동수 ?? null;
      }
    }

    return {
      메타: {
        단지명: 옵션.단지명,
        시도명: 메타_행?.시도명 ?? "",
        시군구명: 메타_행?.시군구명 ?? 옵션.시군구_코드,
        건축_연도: 메타_행?.건축_연도 ?? null,
        단지분류,
        세대수,
        총_동수,
        지번: 대표_지번,
        본번,
        부번,
        도로명: 대표_도로명,
        평형_목록,
        평형_옵션,
        최근_매매: {
          평균_만원: 매매_avg,
          건수: 매매_최근?.매매_건수 ?? 0,
          월: 매매_최근?.년월 ?? null,
        },
        최근_전세: {
          평균_만원: 전세_avg,
          건수: 전세_최근?.전세_건수 ?? 0,
          월: 전세_최근?.년월 ?? null,
        },
        역대_최고가_만원: 최고가_거래?.거래_금액_만원 ?? null,
        역대_최고가_월: 최고가_거래?.계약_일자.slice(0, 7) ?? null,
        전세가율,
        경위_분포,
        이상치_건수,
      },
      월별_평균,
      거래들: 옵션.이상치_제외
        ? 거래들.filter((t) => !t.이상치_의심)
        : 거래들,
    };
  }
}
