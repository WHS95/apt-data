// K-apt(공동주택) ↔ 실거래 매칭 공통 규칙.
// 지번은 두 시스템이 서로 달라(예: 헬리오시티 실거래 913 ≠ kapt 479) 신뢰 불가 →
// 도로명(도로+건물번호) 기준으로 매칭한다. 실거래 도로명은 100% 건물번호로 끝나므로
// kapt 도로명주소의 "끝"에 앵커해 붙여야 345 ⊂ 3450 류 부분일치 오매칭을 막는다.

// 시군구명 → kapt.sigungu 키. 서울/인천은 "송파구"=="송파구"로 동일하지만
// 경기 자치구는 실거래 "고양시 덕양구" vs kapt "고양덕양구"라 "시 "를 제거해야 맞는다.
export const 시군구_매칭키 = (시군구명: string): string =>
  시군구명.replace(/시\s+/g, "").replace(/\s+/g, "");

// 도로명 정규화: 공백 제거. 매칭은 kaptNorm.endsWith(도로명Norm) 로 앵커.
export const 도로명_정규화 = (도로명: string | null | undefined): string =>
  (도로명 ?? "").replace(/\s/g, "");

// 단지분류(K-apt 원문) → 필터 그룹 코드. 상세 표기는 원문을 쓰고, 필터만 그룹으로 묶는다.
export const 단지분류_그룹 = (분류: string | null): string => {
  if (!분류) return "미분류";
  if (분류.includes("주상복합")) return "주상복합";
  if (분류.includes("연립") || 분류.includes("다세대")) return "연립";
  if (분류.includes("도시형")) return "도시형";
  if (분류.includes("아파트")) return "아파트";
  return "미분류";
};

// 세대수 → 규모 코드
export const 세대수_규모 = (세대수: number | null): "대" | "중" | "소" | null => {
  if (세대수 == null) return null;
  if (세대수 >= 1000) return "대";
  if (세대수 >= 300) return "중";
  return "소";
};
