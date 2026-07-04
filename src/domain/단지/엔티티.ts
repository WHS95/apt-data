import type { 물건_유형_코드 } from "../공통/코드";

export interface 단지 {
  코드: string;
  이름: string;
  시군구_코드: string;
  읍면동_코드: string | null;
  도로명: string | null;
  지번_주소: string | null;
  물건_유형: 물건_유형_코드;
  준공_연도: number | null;
}
