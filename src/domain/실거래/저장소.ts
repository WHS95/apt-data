import type { 거래_유형_코드, 물건_유형_코드, 면적_구간_코드 } from "../공통/코드";
import type { 실거래 } from "./엔티티";

export interface 실거래_조회_조건 {
  시도_코드?: string;
  시군구_코드?: string;
  단지_코드?: string;
  물건_유형?: 물건_유형_코드;
  거래_유형?: 거래_유형_코드;
  면적_구간?: 면적_구간_코드;
  계약_시작일?: string;
  계약_종료일?: string;
  최대_금액_만원?: number;
  최소_금액_만원?: number;
  포함_해제?: boolean;
  직거래_제외?: boolean;
  이상치_제외?: boolean;
  단지명_부분?: string;
  정렬?: "최신순" | "오래된순" | "금액_높은순" | "금액_낮은순";
  최대?: number;
  건너뛰기?: number;
}

export interface 실거래_저장소 {
  실거래_조회(조건: 실거래_조회_조건): Promise<실거래[]>;
  실거래_개수(조건: 실거래_조회_조건): Promise<number>;
  실거래_대량_저장(거래_목록: 실거래[]): Promise<number>;
  마지막_계약일_조회(
    시도_코드: string,
    물건_유형: 물건_유형_코드,
    거래_유형: 거래_유형_코드,
  ): Promise<string | null>;
}
