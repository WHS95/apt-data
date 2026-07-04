import type { 단지 } from "./엔티티";

export interface 단지_조회_조건 {
  시도_코드?: string;
  시군구_코드?: string;
  검색어?: string;
  최대?: number;
}

export interface 단지_저장소 {
  단지_조회(코드: string): Promise<단지 | null>;
  단지_검색(조건: 단지_조회_조건): Promise<단지[]>;
  단지_저장_또는_갱신(단지_목록: 단지[]): Promise<void>;
}
