import type { 물건_유형_코드 } from "../공통/코드";

export interface 단지_추천_행 {
  단지_키: string;
  시도_코드: string;
  시도명: string;
  시군구_코드: string;
  시군구명: string;
  단지명: string;
  물건_유형: 물건_유형_코드;
  평균_면적_제곱미터: number;
  건축_연도: number | null;

  현재_평균가_만원: number | null;
  최신_거래가_만원: number | null;
  최신_거래일: string | null;
  전세_평균_만원: number | null;
  거래_건수: number;
  정상_거래_건수: number;

  시군구_평균가_만원: number | null;
  가성비_퍼센트: number | null;
  변화_6개월_퍼센트: number | null;
  전세가율_퍼센트: number | null;

  평당가_만원: number | null;
  갭_만원: number | null;
  직거래_비율: number;
  이상치_건수: number;

  점수_가성비: number;
  점수_모멘텀: number;
  점수_유동성: number;
  점수_안정성: number;
  점수_신축도: number;
  종합_점수: number;

  강점들: string[];
  약점들: string[];

  월별_평균가: Array<{ 년월: string; 평균_만원: number }>;
}

export type 추천_카테고리 = "종합" | "가성비" | "모멘텀" | "안정성" | "신축";
