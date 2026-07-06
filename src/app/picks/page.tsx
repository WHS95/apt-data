import {
  단지_추천_유스케이스,
  type 단지_추천_옵션,
} from "../../application/단지_추천_유스케이스";
import {
  네이버_스타일_필터,
  type 필터,
} from "../../presentation/components/네이버_스타일_필터";
import { 검색바 } from "../../presentation/components/검색바";
import { 단지_추천_헤더 } from "../../presentation/components/단지_추천_행";
import { 단지_추천_리스트 } from "../../presentation/components/단지_추천_리스트";
import { 컨테이너 } from "../../infrastructure/di/컨테이너";
import type { 물건_유형_코드 } from "../../domain/공통/코드";
import type { 추천_카테고리 } from "../../domain/통계/단지추천";

export const dynamic = "force-dynamic";

// 무한 스크롤 상한: 추천은 랭킹 상위가 핵심이라 상위 N개만 프리로드하고
// 클라이언트에서 30개씩 점진 노출한다. 전체 매칭은 필터에 따라 수만 개까지 가므로
// 캡을 두어 페이로드/DOM 을 제한하고, 잘렸을 땐 안내로 정직하게 표시한다.
const 표시_상한 = 200;

const 권역_선택지 = [
  { 값: "서울", 라벨: "서울" },
  { 값: "경기", 라벨: "경기" },
  { 값: "인천", 라벨: "인천" },
  { 값: "수도권", 라벨: "수도권" },
];

const 카테고리_선택지 = [
  { 값: "종합", 라벨: "종합", 설명: "5개 지표 균형" },
  { 값: "가성비", 라벨: "가성비", 설명: "시군구 평균보다 저렴" },
  { 값: "모멘텀", 라벨: "모멘텀", 설명: "최근 가격 상승세" },
  { 값: "안정성", 라벨: "안정성", 설명: "전세가율 안전 구간" },
  { 값: "신축", 라벨: "신축", 설명: "최근 준공 연차" },
];

const 정렬_선택지 = [
  { 값: "추천순", 라벨: "추천순", 설명: "관점 종합점수순" },
  { 값: "갭낮은순", 라벨: "갭 낮은순", 설명: "매매-전세 차 작은순" },
  { 값: "갭높은순", 라벨: "갭 높은순", 설명: "차 큰순" },
  { 값: "평당가낮은순", 라벨: "평당가 낮은순", 설명: "3.3㎡당 저렴" },
  { 값: "평당가높은순", 라벨: "평당가 높은순", 설명: "비쌈" },
  { 값: "최신거래가높은순", 라벨: "최신가 높은순", 설명: "최근 고가순" },
  { 값: "상승률높은순", 라벨: "상승률순", 설명: "6개월 상승순" },
  { 값: "거래량높은순", 라벨: "거래량 많은순", 설명: "거래 활발순" },
];

const 기간_선택지 = [
  { 값: "1", 라벨: "1개월" },
  { 값: "3", 라벨: "3개월" },
  { 값: "6", 라벨: "6개월" },
  { 값: "12", 라벨: "12개월" },
  { 값: "24", 라벨: "24개월" },
  { 값: "36", 라벨: "36개월" },
];

const 연식_선택지 = [
  { 값: "전체", 라벨: "전체" },
  { 값: "5", 라벨: "5년이내" },
  { 값: "10", 라벨: "10년이내" },
  { 값: "15", 라벨: "15년이내" },
  { 값: "20", 라벨: "20년이내" },
  { 값: "구축", 라벨: "20년이상" },
];

const 물건_선택지 = [
  { 값: "A", 라벨: "아파트" },
  { 값: "AB", 라벨: "아파트+빌라" },
];

const 가격_포맷 = (만원: number): string => {
  if (만원 >= 10000) {
    const 억 = Math.floor(만원 / 10000);
    const 천 = Math.round((만원 % 10000) / 1000);
    return 천 > 0 ? `${억}억 ${천}천` : `${억}억`;
  }
  return `${만원.toLocaleString("ko-KR")}만`;
};

const 권역_시도_코드 = (v: string): string[] => {
  switch (v) {
    case "서울": return ["11000"];
    case "경기": return ["41000"];
    case "인천": return ["28000"];
    default:    return ["11000", "41000", "28000"];
  }
};

const 물건_코드 = (v: string): 물건_유형_코드[] =>
  v === "AB" ? ["A", "B"] : ["A"];

const 범위_파싱 = (값: string | undefined): { 최소?: number; 최대?: number } => {
  if (!값) return {};
  const [a, b] = 값.split("-").map((s) => Number(s.trim()));
  return {
    최소: Number.isFinite(a) ? a : undefined,
    최대: Number.isFinite(b) ? b : undefined,
  };
};

const 연식_건축연도_범위 = (
  값: string,
): { 건축_연도_최소?: number; 건축_연도_최대?: number } => {
  const 올해 = new Date().getFullYear();
  switch (값) {
    case "5":  return { 건축_연도_최소: 올해 - 5 };
    case "10": return { 건축_연도_최소: 올해 - 10 };
    case "15": return { 건축_연도_최소: 올해 - 15 };
    case "20": return { 건축_연도_최소: 올해 - 20 };
    case "구축": return { 건축_연도_최대: 올해 - 20 };
    default:   return {};
  }
};

export default async function 단지추천_페이지({
  searchParams,
}: {
  searchParams: Promise<{
    region?: string;
    perspective?: string;
    area?: string;
    price?: string;
    type?: string;
    months?: string;
    age?: string;
    district?: string;
    sort?: string;
    deal?: string;
  }>;
}) {
  const p = await searchParams;
  const 권역 = p.region ?? "서울";
  const 카테고리 = (p.perspective ?? "종합") as 추천_카테고리;
  const 정렬값 = (p.sort ?? "추천순") as 단지_추천_옵션["정렬"];
  const 거래량_기준 = p.deal === "전월세" ? "전월세" : "매매";
  const 면적_범위 = 범위_파싱(p.area);
  const 예산_범위 = 범위_파싱(p.price);
  const 물건 = p.type ?? "A";
  const 기간_개월 = Number(p.months ?? "6");
  const 연식값 = p.age ?? "전체";
  const 연식_범위 = 연식_건축연도_범위(연식값);
  const 지역값 = p.district ?? "";

  const 시도_코드_목록 = 권역_시도_코드(권역);

  let 시군구_선택지: Array<{ 값: string; 라벨: string }> = [];
  let 시군구_필터_표시 = false;
  if (시도_코드_목록.length === 1) {
    const 시군구목록 = await 컨테이너.지역_저장소.시군구_목록_조회(
      시도_코드_목록[0],
    );
    시군구_선택지 = 시군구목록.map((s) => ({ 값: s.코드, 라벨: s.이름 }));
    시군구_필터_표시 = true;
  }

  const 선택_시군구_코드들 = 지역값
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && s !== "전체" && /^\d+$/.test(s));

  const 단지들 = await new 단지_추천_유스케이스()
    .실행({
      시도_코드_목록,
      시군구_코드_목록:
        시군구_필터_표시 && 선택_시군구_코드들.length > 0
          ? 선택_시군구_코드들
          : undefined,
      물건_유형들: 물건_코드(물건),
      카테고리,
      면적_최소_제곱미터: 면적_범위.최소,
      면적_최대_제곱미터: 면적_범위.최대,
      건축_연도_최소: 연식_범위.건축_연도_최소,
      건축_연도_최대: 연식_범위.건축_연도_최대,
      기간_개월,
      예산_하한_만원: 예산_범위.최소,
      예산_상한_만원: 예산_범위.최대,
      정렬: 정렬값,
      거래량_기준,
      최대: 표시_상한 + 1, // +1 로 상한 초과(잘림) 여부를 판별
    })
    .catch(() => []);

  const 잘림 = 단지들.length > 표시_상한;
  const 표시_목록 = 단지들.slice(0, 표시_상한);

  const 최소_거래 =
    기간_개월 <= 1 ? 1 :
    기간_개월 <= 3 ? 3 :
    기간_개월 <= 6 ? 5 :
    기간_개월 <= 12 ? 8 : 12;

  // 실제 조회에 사용된 기간 (현재 → 과거 N개월)
  const 데이터_기간 = (() => {
    const 종료 = new Date();
    const 시작 = new Date();
    시작.setMonth(시작.getMonth() - 기간_개월);
    return {
      시작: 시작.toISOString().slice(0, 10),
      종료: 종료.toISOString().slice(0, 10),
    };
  })();

  const 지역_라벨 = (() => {
    if (!시군구_필터_표시 || 선택_시군구_코드들.length === 0) return null;
    const 이름들 = 선택_시군구_코드들.map(
      (코드) => 시군구_선택지.find((s) => s.값 === 코드)?.라벨 ?? 코드,
    );
    return 이름들.length <= 2
      ? 이름들.join(", ")
      : `${이름들[0]} 외 ${이름들.length - 1}`;
  })();

  return (
    <>
      <section className="border-b hairline bg-[var(--color-bg)]">
        <div className="mx-auto w-full px-6 pt-5 pb-3">
          <div className="text-[12px] font-bold text-[var(--color-brand)] mb-1">
            PICKS · {권역}{지역_라벨 ? ` ${지역_라벨}` : ""} · {카테고리} · {기간_개월}개월
            {정렬값 !== "추천순" && ` · ${정렬_선택지.find((o) => o.값 === 정렬값)?.라벨 ?? 정렬값}`}
            {연식값 !== "전체" && ` · ${연식_선택지.find((o) => o.값 === 연식값)?.라벨 ?? 연식값}`}
            {면적_범위.최소 && ` · 전용 ${면적_범위.최소}~${면적_범위.최대 ?? 300}㎡`}
            {예산_범위.최대 && ` · ${가격_포맷(예산_범위.최대)} 이하`}
          </div>
          <div className="flex items-end justify-between flex-wrap gap-y-2">
            <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">
              단지 추천
            </h1>
            <div className="flex items-baseline gap-3 text-[12px] text-[var(--color-ink-3)] font-medium">
              <span className="num font-bold text-[var(--color-ink-2)]">
                {데이터_기간.시작} ~ {데이터_기간.종료}
              </span>
              <span>·</span>
              <span>
                {표시_목록.length.toLocaleString("ko-KR")}개{잘림 ? "+" : ""} · 최소 거래 {최소_거래}건
              </span>
            </div>
          </div>
        </div>
      </section>

      {(() => {
        const 시군구_필터: 필터[] = 시군구_필터_표시
          ? [
              {
                종류: "다중_드롭다운",
                키: "district",
                라벨: 권역 === "서울" ? "구" : 권역 === "경기" ? "시" : "구",
                옵션들: 시군구_선택지,
                그리드열: 4,
              },
            ]
          : [];
        const 필터들: 필터[] = [
          {
            종류: "칩",
            키: "region",
            옵션들: 권역_선택지,
            기본값: "서울",
          },
          ...시군구_필터,
          { 종류: "구분" },
          {
            종류: "드롭다운",
            키: "perspective",
            라벨: "관점",
            옵션들: 카테고리_선택지,
            기본값: "종합",
            그리드열: 3,
          },
          {
            종류: "드롭다운",
            키: "sort",
            라벨: "정렬",
            옵션들: 정렬_선택지,
            기본값: "추천순",
            그리드열: 3,
          },
          {
            종류: "드롭다운",
            키: "deal",
            라벨: "거래량 기준",
            옵션들: [
              { 값: "매매", 라벨: "매매" },
              { 값: "전월세", 라벨: "전월세" },
            ],
            기본값: "매매",
            그리드열: 2,
          },
          {
            종류: "드롭다운",
            키: "months",
            라벨: "기간",
            옵션들: 기간_선택지,
            기본값: "6",
            그리드열: 3,
          },
          {
            종류: "드롭다운",
            키: "age",
            라벨: "연식",
            옵션들: 연식_선택지,
            기본값: "전체",
            그리드열: 3,
          },
          {
            종류: "범위",
            키: "area",
            라벨: "전용면적",
            최소: 0,
            최대: 300,
            단계: 5,
            단위_유형: "면적",
            프리셋: [
              { 라벨: "전체", 최소: 0, 최대: 300 },
              { 라벨: "~10평", 최소: 0, 최대: 33 },
              { 라벨: "10평대", 최소: 33, 최대: 66 },
              { 라벨: "20평대", 최소: 66, 최대: 99 },
              { 라벨: "30평대", 최소: 99, 최대: 132 },
              { 라벨: "40평대", 최소: 132, 최대: 165 },
              { 라벨: "50평대", 최소: 165, 최대: 200 },
              { 라벨: "60평~", 최소: 200, 최대: 300 },
            ],
          },
          {
            종류: "범위",
            키: "price",
            라벨: "가격대",
            최소: 0,
            최대: 500000,
            단계: 5000,
            단위_유형: "가격",
            프리셋: [
              { 라벨: "전체", 최소: 0, 최대: 500000 },
              { 라벨: "3억↓", 최소: 0, 최대: 30000 },
              { 라벨: "5억↓", 최소: 0, 최대: 50000 },
              { 라벨: "5–7억", 최소: 50000, 최대: 70000 },
              { 라벨: "7–10억", 최소: 70000, 최대: 100000 },
              { 라벨: "10–15억", 최소: 100000, 최대: 150000 },
              { 라벨: "15–20억", 최소: 150000, 최대: 200000 },
              { 라벨: "20억↑", 최소: 200000, 최대: 500000 },
            ],
          },
          {
            종류: "드롭다운",
            키: "type",
            라벨: "유형",
            옵션들: 물건_선택지,
            기본값: "A",
            그리드열: 2,
            우측정렬: true,
          },
        ];
        return <네이버_스타일_필터 필터들={필터들} />;
      })()}

      <div className="border-b hairline">
        <div className="mx-auto w-full px-6 py-2">
          <검색바 자리표시="단지명 검색" />
        </div>
      </div>

      <section className="mx-auto w-full px-6 py-4">
        {표시_목록.length === 0 ? (
          <div className="toss-card p-12 text-center text-[var(--color-ink-3)]">
            조건에 맞는 단지가 없습니다. 필터를 완화해보세요.
          </div>
        ) : (
          <div className="toss-card overflow-hidden">
            <단지_추천_헤더 />
            <단지_추천_리스트
              key={JSON.stringify(p)}
              행들={표시_목록}
              잘림={잘림}
            />
          </div>
        )}
      </section>
    </>
  );
}
