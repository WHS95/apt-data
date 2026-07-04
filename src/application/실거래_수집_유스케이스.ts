import type { molit_client } from "../infrastructure/molit/molit_client";
import { CSV_파싱 } from "../infrastructure/molit/csv_parser";
import type { 지역_저장소 } from "../domain/지역/저장소";
import type { 실거래_저장소 } from "../domain/실거래/저장소";
import {
  거래_유형 as 거래_유형_맵,
  물건_유형 as 물건_유형_맵,
} from "../domain/공통/코드";
import { 로거 } from "../shared/로거";

export interface 수집_옵션 {
  모드: "full" | "incremental";
  대상_물건?: Array<keyof typeof 물건_유형_맵>;
  대상_거래?: Array<keyof typeof 거래_유형_맵>;
  대상_시도?: string[];
  요청_딜레이_MS?: number;
  // 모드="full" 일 때 시작점 강제 (예: 최근 N년만)
  시작_일자_강제?: string;
}

const 대기 = (밀리초: number) => new Promise((r) => setTimeout(r, 밀리초));

const 날짜_분할 = function* (시작: Date, 종료: Date, 개월: number = 12) {
  let 현재 = new Date(시작);
  while (현재 <= 종료) {
    const 다음 = new Date(현재);
    다음.setMonth(다음.getMonth() + 개월);
    다음.setDate(다음.getDate() - 1);
    const 끝 = 다음 > 종료 ? 종료 : 다음;
    yield {
      시작: 현재.toISOString().slice(0, 10),
      끝: 끝.toISOString().slice(0, 10),
    };
    현재 = new Date(끝);
    현재.setDate(현재.getDate() + 1);
  }
};

export class 실거래_수집_유스케이스 {
  constructor(
    private readonly client: molit_client,
    private readonly 지역_저장소: 지역_저장소,
    private readonly 실거래_저장소: 실거래_저장소,
  ) {}

  async 실행(옵션: 수집_옵션): Promise<{ 저장_건수: number }> {
    await this.client.세션_초기화();
    const 시도_원본 = await this.client.시도_목록_조회();
    await this.지역_저장소.시도_저장(시도_원본);

    const 시도_목록 = 옵션.대상_시도
      ? 시도_원본.filter((s) => 옵션.대상_시도!.includes(s.코드))
      : 시도_원본;
    const 물건_목록 =
      옵션.대상_물건 ?? (Object.keys(물건_유형_맵) as Array<keyof typeof 물건_유형_맵>);
    const 거래_목록 =
      옵션.대상_거래 ?? (Object.keys(거래_유형_맵) as Array<keyof typeof 거래_유형_맵>);
    const 딜레이 = 옵션.요청_딜레이_MS ?? 1500;
    const 오늘 = new Date();

    // 시군구 사전 적재 + 이름→코드 맵 구성
    로거.정보("시군구 마스터 사전 적재 시작");
    const 시군구_맵_시도별 = new Map<string, Map<string, string>>();
    for (const 시도 of 시도_목록) {
      const 시군구_목록 = await this.client.시군구_목록_조회(시도.코드);
      await this.지역_저장소.시군구_저장(시군구_목록);
      const 이름_코드 = new Map(시군구_목록.map((s) => [s.이름, s.코드]));
      시군구_맵_시도별.set(시도.코드, 이름_코드);
      로거.정보(`[${시도.이름}] 시군구 ${시군구_목록.length}개 적재`);
      await 대기(딜레이);
    }

    let 총_저장 = 0;
    let 진행 = 0;
    const 총_조합 = 시도_목록.length * 물건_목록.length * 거래_목록.length;

    for (const 시도 of 시도_목록) {
      const 시군구_맵 = 시군구_맵_시도별.get(시도.코드);
      for (const 물건 of 물건_목록) {
        for (const 거래 of 거래_목록) {
          진행++;
          const 시작일 =
            옵션.시작_일자_강제 != null
              ? new Date(옵션.시작_일자_강제)
              : 옵션.모드 === "full"
                ? new Date("2006-01-01")
                : await this.이어받기_시작일(시도.코드, 물건, 거래);

          for (const 구간 of 날짜_분할(시작일, 오늘)) {
            로거.정보(
              `[${진행}/${총_조합}] [${시도.이름}] ${물건_유형_맵[물건]}/${거래_유형_맵[거래]} ${구간.시작}~${구간.끝}`,
            );
            const CSV = await this.client.CSV_다운로드({
              시도_코드: 시도.코드,
              물건_유형: 물건,
              거래_유형: 거래,
              시작_일자: 구간.시작,
              종료_일자: 구간.끝,
            }).catch((오류) => {
              로거.경고("CSV 다운로드 실패", 오류);
              return null;
            });
            if (CSV) {
              const 거래_목록_파싱 = CSV_파싱(CSV, {
                시도_코드: 시도.코드,
                물건_유형: 물건,
                거래_유형: 거래,
                원천_파일명: `${시도.코드}_${물건}_${거래}_${구간.시작}_${구간.끝}.csv`,
                시군구_이름_코드_맵: 시군구_맵,
              });
              if (거래_목록_파싱.length > 0) {
                const 건수 =
                  await this.실거래_저장소.실거래_대량_저장(거래_목록_파싱);
                총_저장 += 건수;
                로거.정보(`  → 저장 ${건수}/${거래_목록_파싱.length}건 (누적 ${총_저장})`);
              } else {
                로거.정보(`  → 파싱 0건 (CSV ${CSV.length}자)`);
              }
            } else {
              로거.정보(`  → CSV 없음 (HTML/빈 응답)`);
            }
            await 대기(딜레이);
          }
        }
      }
    }
    return { 저장_건수: 총_저장 };
  }

  private async 이어받기_시작일(
    시도_코드: string,
    물건: keyof typeof 물건_유형_맵,
    거래: keyof typeof 거래_유형_맵,
  ): Promise<Date> {
    const 마지막 = await this.실거래_저장소.마지막_계약일_조회(시도_코드, 물건, 거래);
    if (!마지막) return new Date("2006-01-01");
    const d = new Date(마지막);
    d.setDate(d.getDate() + 1);
    return d;
  }
}
