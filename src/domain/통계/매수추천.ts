export interface 매수추천_행 {
  시도_코드: string;
  시도명: string;
  시군구_코드: string;
  시군구명: string;

  평균_매매가_만원: number | null;
  매매_3개월전_만원: number | null;
  매매_6개월전_만원: number | null;
  전세_평균_만원: number | null;

  거래_최근_3개월: number;
  거래_이전_3개월: number;

  변화_3개월_퍼센트: number | null;
  변화_6개월_퍼센트: number | null;
  전세가율_퍼센트: number | null;
  거래량_모멘텀: number | null;

  종합_점수: number;

  월별_평균가: Array<{ 년월: string; 평균_만원: number }>;
}
