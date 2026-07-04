import Papa from "papaparse";
import type { 거래_유형_코드, 물건_유형_코드 } from "../../domain/공통/코드";
import type { 실거래 } from "../../domain/실거래/엔티티";

const 숫자_변환 = (값: string | undefined): number | null => {
  if (!값) return null;
  const 정리 = 값.replace(/[,\s원]/g, "");
  if (!정리) return null;
  const n = Number(정리);
  return Number.isFinite(n) ? n : null;
};

export interface 파싱_컨텍스트 {
  시도_코드: string;
  시군구_코드?: string;
  물건_유형: 물건_유형_코드;
  거래_유형: 거래_유형_코드;
  원천_파일명?: string;
  // 시군구 이름 → 코드 변환 맵 (CSV에는 이름만 있음)
  시군구_이름_코드_맵?: Map<string, string>;
}

const 시군구_코드_해석 = (
  시군구_텍스트: string,
  맵?: Map<string, string>,
): string => {
  if (!맵 || 맵.size === 0) return 시군구_텍스트;
  // 가장 긴 매칭부터 시도 (예: "수원시 영통구" > "영통구")
  const 후보들 = Array.from(맵.entries()).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [이름, 코드] of 후보들) {
    if (시군구_텍스트.includes(이름)) return 코드;
  }
  return 시군구_텍스트;
};

export const CSV_파싱 = (
  CSV_텍스트: string,
  컨텍스트: 파싱_컨텍스트,
): 실거래[] => {
  const 시작_색인 = CSV_텍스트.search(/^"?(NO|순번|시군구|단지명)"?,/m);
  const 절단 = 시작_색인 >= 0 ? CSV_텍스트.slice(시작_색인) : CSV_텍스트;

  const 결과 = Papa.parse<Record<string, string>>(절단, {
    header: true,
    skipEmptyLines: true,
  });

  return 결과.data
    .map((행, 색인): 실거래 | null => {
      const 단지명 = 행["단지명"] ?? 행["건물명"] ?? null;
      const 시군구_텍스트 = 행["시군구"] ?? "";
      const 도로명 = 행["도로명"] ?? null;
      const 지번 = 행["번지"] ?? 행["지번"] ?? null;
      const 면적 = 숫자_변환(행["전용면적(㎡)"] ?? 행["전용면적"]);
      if (!면적) return null;
      const 계약_년월 = 행["계약년월"] ?? "";
      const 계약_일_텍스트 = 행["계약일"] ?? 행["계약일자"] ?? "";
      const 년 = Number(계약_년월.slice(0, 4));
      const 월 = Number(계약_년월.slice(4, 6));
      const 일 = Number(계약_일_텍스트.replace(/[^0-9]/g, "")) || 1;
      if (!Number.isFinite(년) || !Number.isFinite(월)) return null;
      const 계약_일자 = `${년}-${String(월).padStart(2, "0")}-${String(일).padStart(2, "0")}`;

      const 거래_금액 = 숫자_변환(행["거래금액(만원)"]);
      const 보증금 = 숫자_변환(행["보증금(만원)"]);
      const 월세 = 숫자_변환(행["월세금(만원)"] ?? 행["월세(만원)"]);
      const 층 = 숫자_변환(행["층"]);
      const 건축_연도 = 숫자_변환(행["건축년도"]);
      const 해제 = (행["해제여부"] ?? "").trim() === "O";
      const 거래_경위 = (행["거래유형"] ?? "").trim() || null;

      const 시군구_코드_해석값 =
        컨텍스트.시군구_코드 ??
        시군구_코드_해석(시군구_텍스트, 컨텍스트.시군구_이름_코드_맵);
      const ID = `${컨텍스트.시도_코드}_${컨텍스트.물건_유형}_${컨텍스트.거래_유형}_${계약_일자}_${색인}_${(단지명 ?? "").slice(0, 12)}_${면적}`;

      return {
        ID,
        시도_코드: 컨텍스트.시도_코드,
        시군구_코드: 시군구_코드_해석값,
        읍면동_코드: null,
        단지_코드: null,
        단지명,
        도로명,
        지번,
        물건_유형: 컨텍스트.물건_유형,
        거래_유형: 컨텍스트.거래_유형,
        계약_연도: 년,
        계약_월: 월,
        계약_일: 일,
        계약_일자,
        전용_면적_제곱미터: 면적,
        층: 층,
        건축_연도,
        거래_금액_만원: 거래_금액,
        보증금_만원: 보증금,
        월세_만원: 월세,
        해제_여부: 해제,
        거래_경위: 거래_경위,
        가격_이상치: false,
        원천_파일명: 컨텍스트.원천_파일명 ?? null,
      };
    })
    .filter((x): x is 실거래 => x !== null);
};
