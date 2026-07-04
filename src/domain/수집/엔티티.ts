import type { 거래_유형_코드, 물건_유형_코드 } from "../공통/코드";

export interface 수집_설정 {
  키: string;
  활성: boolean;
  요청_딜레이_MS: number;
  청크_개월: number;
  쿨다운_HTML_MS: number;
  최대_재시도: number;
  년수_제한: number;
  갱신_시각: Date;
}

export type 수집_상태 = "success" | "empty" | "blocked" | "error";

export interface 수집_기록 {
  ID: string;
  시도_코드: string;
  물건_유형: 물건_유형_코드;
  거래_유형: 거래_유형_코드;
  청크_시작: string;
  청크_종료: string;
  상태: 수집_상태;
  저장_건수: number;
  파싱_건수: number;
  소요_MS: number;
  오류_메시지: string | null;
  실행_시각: Date;
}

export interface 수집_작업 {
  시도_코드: string;
  시도명: string;
  물건_유형: 물건_유형_코드;
  거래_유형: 거래_유형_코드;
  청크_시작: string;
  청크_종료: string;
}
