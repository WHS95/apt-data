import { sql } from "drizzle-orm";
import {
  거래_유형 as 거래_유형_맵,
  물건_유형 as 물건_유형_맵,
} from "../domain/공통/코드";
import type { 거래_유형_코드, 물건_유형_코드 } from "../domain/공통/코드";
import type { 수집_작업 } from "../domain/수집/엔티티";
import type {
  수집_기록_저장소,
  수집_설정_저장소,
} from "../domain/수집/저장소";
import type { 지역_저장소 } from "../domain/지역/저장소";
import type { 실거래_저장소 } from "../domain/실거래/저장소";
import type { molit_client } from "../infrastructure/molit/molit_client";
import { CSV_파싱 } from "../infrastructure/molit/csv_parser";
import { DB } from "../infrastructure/persistence/접속";
import { 실거래_테이블 } from "../infrastructure/persistence/스키마";
import { 로거 } from "../shared/로거";

const 대기 = (ms: number) => new Promise((r) => setTimeout(r, ms));

const 청크_생성 = (
  시작: Date,
  종료: Date,
  개월: number,
): Array<{ 시작: string; 끝: string }> => {
  const 결과: Array<{ 시작: string; 끝: string }> = [];
  let 현재 = new Date(시작);
  while (현재 <= 종료) {
    const 다음 = new Date(현재);
    다음.setMonth(다음.getMonth() + 개월);
    다음.setDate(다음.getDate() - 1);
    const 끝 = 다음 > 종료 ? 종료 : 다음;
    결과.push({
      시작: 현재.toISOString().slice(0, 10),
      끝: 끝.toISOString().slice(0, 10),
    });
    현재 = new Date(끝);
    현재.setDate(현재.getDate() + 1);
  }
  return 결과;
};

export class 연속_수집_유스케이스 {
  private 시군구_맵_시도별 = new Map<string, Map<string, string>>();

  constructor(
    private readonly client: molit_client,
    private readonly 지역_저장소: 지역_저장소,
    private readonly 실거래_저장소: 실거래_저장소,
    private readonly 설정_저장소: 수집_설정_저장소,
    private readonly 기록_저장소: 수집_기록_저장소,
  ) {}

  async 워커_시작(): Promise<void> {
    로거.정보("연속 수집 워커 시작");
    await this.client.세션_초기화();
    await this.지역_사전_적재();
    await this.부트스트랩_기존_데이터_표시();

    let html_연속 = 0;

    while (true) {
      const 설정 = await this.설정_저장소.설정_조회();
      if (!설정.활성) {
        로거.정보("일시정지 상태. 30s 후 재확인.");
        await 대기(30000);
        continue;
      }

      const 다음 = await this.다음_작업(설정);
      if (!다음) {
        로거.정보("작업 없음. 5분 후 재확인 (신규 신고분 대비).");
        await 대기(5 * 60 * 1000);
        continue;
      }

      const t시작 = Date.now();
      const CSV = await this.client
        .CSV_다운로드({
          시도_코드: 다음.시도_코드,
          물건_유형: 다음.물건_유형,
          거래_유형: 다음.거래_유형,
          시작_일자: 다음.청크_시작,
          종료_일자: 다음.청크_종료,
        })
        .catch((e) => {
          로거.경고("CSV 요청 예외", e);
          return null;
        });

      const 소요 = Date.now() - t시작;

      if (CSV === null) {
        html_연속++;
        await this.기록_저장소.기록_저장({
          ...다음,
          상태: "blocked",
          저장_건수: 0,
          파싱_건수: 0,
          소요_MS: 소요,
          오류_메시지: "HTML 또는 빈 응답",
        });
        로거.경고(
          `차단 [${다음.시도명}/${물건_유형_맵[다음.물건_유형]}/${거래_유형_맵[다음.거래_유형]}] ${다음.청크_시작}~${다음.청크_종료} (연속 ${html_연속})`,
        );
        if (html_연속 >= 2) {
          const 쿨 = Math.round(설정.쿨다운_HTML_MS / 1000);
          로거.경고(`HTML ${html_연속}회 연속 → ${쿨}s 쿨다운`);
          await 대기(설정.쿨다운_HTML_MS);
          await this.client.세션_초기화().catch(() => {});
          html_연속 = 0;
        } else {
          await 대기(설정.요청_딜레이_MS);
        }
        continue;
      }

      html_연속 = 0;
      const 파싱 = CSV_파싱(CSV, {
        시도_코드: 다음.시도_코드,
        물건_유형: 다음.물건_유형,
        거래_유형: 다음.거래_유형,
        시군구_이름_코드_맵: this.시군구_맵_시도별.get(다음.시도_코드),
        원천_파일명: `${다음.시도_코드}_${다음.물건_유형}_${다음.거래_유형}_${다음.청크_시작}_${다음.청크_종료}.csv`,
      });

      let 건수 = 0;
      if (파싱.length > 0) {
        건수 = await this.실거래_저장소.실거래_대량_저장(파싱);
      }

      await this.기록_저장소.기록_저장({
        ...다음,
        상태: 파싱.length > 0 ? "success" : "empty",
        저장_건수: 건수,
        파싱_건수: 파싱.length,
        소요_MS: 소요,
        오류_메시지: null,
      });

      로거.정보(
        `[${다음.시도명}] ${물건_유형_맵[다음.물건_유형]}/${거래_유형_맵[다음.거래_유형]} ${다음.청크_시작}~${다음.청크_종료} → ${건수}건 (${파싱.length} 파싱, ${소요}ms)`,
      );

      await 대기(설정.요청_딜레이_MS);
    }
  }

  private async 부트스트랩_기존_데이터_표시(): Promise<void> {
    const 설정 = await this.설정_저장소.설정_조회();
    const 오늘 = new Date();
    const 시작_제한 = new Date();
    시작_제한.setFullYear(시작_제한.getFullYear() - 설정.년수_제한);

    // 어떤 (시도, 물건, 거래) 조합에 데이터가 1건이라도 있으면
    // 해당 시도 전체가 이미 한 번 스크랩됐다고 가정하고 시도의 모든 콤보 × 모든 청크를 success 처리.
    // 빈 콤보(예: 서울 단독다가구 매매)도 원래 시도됐으므로 재시도 안 함.
    const 시도_원본 = await DB.select({
      시도: 실거래_테이블.시도_코드,
      개수: sql<number>`count(*)::int`,
    })
      .from(실거래_테이블)
      .groupBy(실거래_테이블.시도_코드);

    const 청크들 = 청크_생성(시작_제한, 오늘, 설정.청크_개월);
    const 물건들 = Object.keys(물건_유형_맵) as 물건_유형_코드[];
    const 거래들 = Object.keys(거래_유형_맵) as 거래_유형_코드[];
    let 표시_건수 = 0;
    for (const 행 of 시도_원본) {
      if (행.개수 === 0) continue;
      for (const 물건 of 물건들) {
        for (const 거래 of 거래들) {
          for (const 청크 of 청크들) {
            await this.기록_저장소.기록_저장({
              ID: `${행.시도}_${물건}_${거래}_${청크.시작}_${청크.끝}_seed`,
              시도_코드: 행.시도,
              물건_유형: 물건,
              거래_유형: 거래,
              청크_시작: 청크.시작,
              청크_종료: 청크.끝,
              상태: "success",
              저장_건수: 0,
              파싱_건수: 0,
              소요_MS: 0,
              오류_메시지: "기존 시도 전체 자동 표시",
            });
            표시_건수++;
          }
        }
      }
    }
    로거.정보(`부트스트랩: ${시도_원본.length}개 시도의 ${표시_건수}개 청크 success 표시`);
  }

  private async 지역_사전_적재(): Promise<void> {
    const 시도_원본 = await this.client.시도_목록_조회();
    await this.지역_저장소.시도_저장(시도_원본);
    for (const 시도 of 시도_원본) {
      try {
        const 시군구 = await this.client.시군구_목록_조회(시도.코드);
        await this.지역_저장소.시군구_저장(시군구);
        this.시군구_맵_시도별.set(
          시도.코드,
          new Map(시군구.map((s) => [s.이름, s.코드])),
        );
        await 대기(800);
      } catch (e) {
        로거.경고(`시군구 적재 실패: ${시도.이름}`, e);
      }
    }
    로거.정보(`지역 사전 적재 완료 (시도 ${시도_원본.length}개)`);
  }

  private async 다음_작업(
    설정: { 년수_제한: number; 청크_개월: number },
  ): Promise<수집_작업 | null> {
    const 오늘 = new Date();
    const 시작_제한 = new Date();
    시작_제한.setFullYear(시작_제한.getFullYear() - 설정.년수_제한);

    const 완료_키 = await this.기록_저장소.완료_청크_목록();
    // 최근 24시간 안에 차단(HTML)됐던 청크는 후순위로 밀어 다른 작업 우선 진행
    const 최근_차단_키 = await this.기록_저장소.최근_차단_청크(
      24 * 60 * 60 * 1000,
    );

    const 시도_목록 = await this.지역_저장소.시도_목록_조회();
    const 청크들 = 청크_생성(시작_제한, 오늘, 설정.청크_개월);
    // 물건 우선순위: 아파트 > 연립 > 오피스텔 > 분양권 > 단독 > 상업 > 토지 > 공장
    const 물건_우선순위: 물건_유형_코드[] = [
      "A", "B", "D", "E", "C", "F", "G", "H",
    ];
    const 물건들 = (Object.keys(물건_유형_맵) as 물건_유형_코드[]).sort(
      (a, b) => 물건_우선순위.indexOf(a) - 물건_우선순위.indexOf(b),
    );
    const 거래들 = Object.keys(거래_유형_맵) as 거래_유형_코드[];

    const 찾기 = (차단_스킵: boolean): 수집_작업 | null => {
      // 물건 → 청크(오래된순) → 시도 → 거래 순
      for (const 물건 of 물건들) {
        for (const 청크 of 청크들) {
          for (const 시도 of 시도_목록) {
            for (const 거래 of 거래들) {
              const 키 = `${시도.코드}_${물건}_${거래}_${청크.시작}_${청크.끝}`;
              if (완료_키.has(키)) continue;
              if (차단_스킵 && 최근_차단_키.has(키)) continue;
              return {
                시도_코드: 시도.코드,
                시도명: 시도.이름,
                물건_유형: 물건,
                거래_유형: 거래,
                청크_시작: 청크.시작,
                청크_종료: 청크.끝,
              };
            }
          }
        }
      }
      return null;
    };

    // 1차: 최근 차단 청크는 스킵하고 다른 작업 먼저
    const 신규 = 찾기(true);
    if (신규) return 신규;

    // 2차: 남은 게 차단 청크뿐이면 재시도 (24시간 지나면 자연 해제됨)
    로거.정보("신규 청크 없음 — 차단 청크 재시도 대상 탐색");
    return 찾기(false);
  }
}
