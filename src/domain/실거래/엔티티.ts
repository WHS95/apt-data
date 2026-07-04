import type { 거래_유형_코드, 물건_유형_코드 } from "../공통/코드";

export interface 실거래 {
  ID: string;
  시도_코드: string;
  시군구_코드: string;
  읍면동_코드: string | null;
  단지_코드: string | null;
  단지명: string | null;
  도로명: string | null;
  지번: string | null;

  물건_유형: 물건_유형_코드;
  거래_유형: 거래_유형_코드;

  계약_연도: number;
  계약_월: number;
  계약_일: number;
  계약_일자: string;

  전용_면적_제곱미터: number;
  층: number | null;
  건축_연도: number | null;

  거래_금액_만원: number | null;
  보증금_만원: number | null;
  월세_만원: number | null;

  해제_여부: boolean;
  거래_경위: string | null;
  가격_이상치: boolean;
  원천_파일명: string | null;
}

export const 실거래_평단가_만원 = (거래: 실거래): number | null => {
  if (!거래.거래_금액_만원 || 거래.전용_면적_제곱미터 <= 0) return null;
  const 평 = 거래.전용_면적_제곱미터 / 3.305785;
  return Math.round(거래.거래_금액_만원 / 평);
};
