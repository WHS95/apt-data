import type { 면적_구간_코드 } from "../공통/코드";

export interface 전세가율_셀 {
  시군구_코드: string;
  시군구명: string;
  면적_구간: 면적_구간_코드;
  매매_평균_만원: number | null;
  전세_평균_만원: number | null;
  전세가율: number | null;
  거래_건수: number;
}

export interface 가격_추이_포인트 {
  년월: string;
  매매_중위_만원: number | null;
  전세_중위_만원: number | null;
  거래_건수: number;
}

export interface 권역_요약 {
  시군구_코드: string;
  시군구명: string;
  평균_매매가_만원: number | null;
  전세가율: number | null;
  거래_건수: number;
  가성비_점수: number;
}

export interface 예산별_분포_버킷 {
  시도_코드: string;
  시도명: string;
  매물_건수: number;
}

export interface 분양_캘린더_항목 {
  계약일: string;
  단지명: string | null;
  시군구명: string;
  거래_건수: number;
  평균_금액_만원: number | null;
}
