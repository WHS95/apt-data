export const 물건_유형 = {
  A: "아파트",
  B: "연립다세대",
  C: "단독다가구",
  D: "오피스텔",
  E: "분양입주권",
  F: "상업업무용",
  G: "토지",
  H: "공장창고등",
} as const;

export type 물건_유형_코드 = keyof typeof 물건_유형;

export const 거래_유형 = {
  "1": "매매",
  "2": "전월세",
} as const;

export type 거래_유형_코드 = keyof typeof 거래_유형;

export const 면적_구간 = {
  "1": { 라벨: "60㎡ 이하", 최소: 0, 최대: 60 },
  "2": { 라벨: "60–85㎡", 최소: 60, 최대: 85 },
  "3": { 라벨: "85–102㎡", 최소: 85, 최대: 102 },
  "4": { 라벨: "102–135㎡", 최소: 102, 최대: 135 },
  "5": { 라벨: "135㎡ 초과", 최소: 135, 최대: Infinity },
} as const;

export type 면적_구간_코드 = keyof typeof 면적_구간;

export const 면적_구간_분류 = (면적_제곱미터: number): 면적_구간_코드 => {
  if (면적_제곱미터 <= 60) return "1";
  if (면적_제곱미터 <= 85) return "2";
  if (면적_제곱미터 <= 102) return "3";
  if (면적_제곱미터 <= 135) return "4";
  return "5";
};
