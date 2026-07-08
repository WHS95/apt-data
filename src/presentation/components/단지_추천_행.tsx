"use client";

import { useRouter } from "next/navigation";
import type { 단지_추천_행 as 행_타입 } from "../../domain/통계/단지추천";
import { 만원_표시 } from "./숫자_표시";
import { 스파크라인 } from "./스파크라인";
import { 관심_하트 } from "./관심_하트";

interface 속성 {
  단지: 행_타입;
  순위: number;
}

const 시도_색 = (코드: string): string => {
  switch (코드) {
    case "11000": return "bg-[var(--color-up-soft)] text-[var(--color-up)]";
    case "41000": return "bg-[var(--color-brand-soft)] text-[var(--color-brand)]";
    case "28000": return "bg-[var(--color-down-soft)] text-[var(--color-down)]";
    default: return "bg-[var(--color-bg-mute)] text-[var(--color-ink-2)]";
  }
};

const 시도_약 = (코드: string): string => {
  switch (코드) {
    case "11000": return "서울";
    case "41000": return "경기";
    case "28000": return "인천";
    case "26000": return "부산";
    default: return 코드;
  }
};

const 점수_색 = (점수: number): string => {
  if (점수 >= 75) return "bg-[var(--color-up-soft)] text-[var(--color-up)]";
  if (점수 >= 55) return "bg-[var(--color-bg-mute)] text-[var(--color-ink)]";
  return "bg-[var(--color-warn-soft)] text-[var(--color-warn)]";
};

const 평형_라벨 = (m2: number): string => {
  const 평 = Math.round(m2 / 3.305785);
  return `${Math.round(m2)}㎡·${평}평`;
};

// 단지분류 배지: 아파트는 기본이라 생략(노이즈↓), 주상복합/연립/도시형만 강조
const 분류_배지 = (분류: string | null): string | null => {
  if (!분류) return null;
  if (분류.includes("주상복합")) return "주상복합";
  if (분류.includes("도시형")) return "도시형";
  if (분류.includes("연립")) return "연립";
  if (분류.includes("다세대")) return "다세대";
  return null; // 아파트
};

// 갭(만원) → "N억 N천" 압축 표기 (음수는 깡통, 3천만도 "0억"으로 뭉개지지 않게)
const 갭_라벨 = (만원: number): string => {
  const 음수 = 만원 < 0;
  const 절대 = Math.abs(만원);
  const 억 = Math.floor(절대 / 10000);
  const 천 = Math.round((절대 % 10000) / 1000);
  let 본문: string;
  if (억 >= 1) 본문 = 천 > 0 ? `${억}억 ${천}천` : `${억}억`;
  else 본문 = `${(절대 / 1000).toFixed(0)}천`;
  return 음수 ? `-${본문}` : 본문;
};

const 그리드 =
  "grid grid-cols-[28px_28px_minmax(0,1.9fr)_minmax(0,0.9fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(60px,84px)_44px_48px_28px] gap-2 items-center px-3 overflow-hidden";

const 네이버_부동산_URL = (단지명: string, 시군구명: string): string => {
  const 검색어 = `${단지명} ${시군구명}`;
  return `https://m.land.naver.com/search/result/${encodeURIComponent(검색어)}`;
};

export const 단지_추천_행 = ({ 단지, 순위 }: 속성) => {
  const 라우터 = useRouter();
  const 상세_경로 = `/picks/detail?sgg=${단지.시군구_코드}&name=${encodeURIComponent(단지.단지명)}`;
  const 네이버_URL = 네이버_부동산_URL(단지.단지명, 단지.시군구명);
  const 변화 = 단지.변화_6개월_퍼센트 ?? 0;
  const 상승 = 변화 > 0;

  const 행_클릭 = () => 라우터.push(상세_경로);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={행_클릭}
      onKeyDown={(e) => {
        if (e.key === "Enter") 행_클릭();
      }}
      className={`${그리드} py-2.5 hover:bg-[var(--color-bg-soft)] transition-colors border-b hairline last:border-b-0 cursor-pointer`}
    >
      <span className="num text-[12px] font-bold text-[var(--color-ink-4)] text-center">
        {String(순위).padStart(2, "0")}
      </span>

      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold ${시도_색(단지.시도_코드)}`}>
        {시도_약(단지.시도_코드).slice(0, 2)}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1 min-w-0">
          <div className="text-[13px] font-extrabold tracking-tight truncate leading-tight min-w-0">
            {단지.단지명}
          </div>
          {분류_배지(단지.단지분류) && (
            <span className="flex-shrink-0 text-[9px] font-extrabold px-1 py-0.5 rounded bg-[var(--color-brand-soft)] text-[var(--color-brand)] leading-none">
              {분류_배지(단지.단지분류)}
            </span>
          )}
          {단지.직거래_비율 >= 10 || 단지.이상치_건수 >= 3 ? (
            <span
              title={`직거래 ${단지.직거래_비율}% · 이상치 ${단지.이상치_건수}건`}
              className="flex-shrink-0 text-[11px] text-[var(--color-warn)] leading-none"
            >
              ⚠
            </span>
          ) : null}
        </div>
        <div className="text-[10px] text-[var(--color-ink-3)] mt-0.5 font-medium truncate">
          {단지.시군구명} · {평형_라벨(단지.평균_면적_제곱미터)}
          {단지.세대수 != null && ` · ${단지.세대수.toLocaleString("ko-KR")}세대`}
          {단지.건축_연도 && ` · ${단지.건축_연도}년`}
          {단지.지번 && ` · 지번 ${단지.지번}`}
        </div>
      </div>

      <div className="text-right">
        <div className="num text-[13px] font-extrabold leading-none">
          <만원_표시 만원={단지.최신_거래가_만원 ?? 단지.현재_평균가_만원} />
        </div>
        {단지.최신_거래일 ? (
          <div className="text-[9px] text-[var(--color-ink-3)] mt-0.5 font-medium num">
            {단지.최신_거래일.slice(5).replace("-", "/")}
          </div>
        ) : null}
        {단지.평당가_만원 != null ? (
          <div className="text-[10px] text-[var(--color-ink-3)] mt-0.5 font-medium num">
            평당 {단지.평당가_만원.toLocaleString("ko-KR")}만
          </div>
        ) : null}
      </div>

      <div className="text-right">
        <div className="num text-[12px] font-bold leading-none">
          {단지.거래_건수.toLocaleString("ko-KR")}
        </div>
        {단지.점수_유동성 >= 75 && (
          <div className="text-[9px] text-[var(--color-up)] mt-0.5 font-bold">활발</div>
        )}
        {단지.점수_유동성 < 40 && (
          <div className="text-[9px] text-[var(--color-ink-4)] mt-0.5 font-bold">한산</div>
        )}
      </div>

      <div className="text-right">
        {단지.변화_6개월_퍼센트 != null && Math.abs(단지.변화_6개월_퍼센트) >= 0.1 ? (
          <span className={`num text-[12px] font-bold ${상승 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>
            {상승 ? "+" : ""}
            {단지.변화_6개월_퍼센트.toFixed(1)}%
          </span>
        ) : (
          <span className="num text-[11px] text-[var(--color-ink-4)]">—</span>
        )}
      </div>

      <div className="text-right">
        {단지.가성비_퍼센트 != null ? (
          <span className={`num text-[11px] font-bold ${단지.가성비_퍼센트 > 0 ? "text-[var(--color-down)]" : 단지.가성비_퍼센트 < 0 ? "text-[var(--color-up)]" : "text-[var(--color-ink-3)]"}`}>
            {단지.가성비_퍼센트 > 0 ? "−" : "+"}
            {Math.abs(단지.가성비_퍼센트).toFixed(0)}%
          </span>
        ) : (
          <span className="num text-[11px] text-[var(--color-ink-4)]">—</span>
        )}
      </div>

      <div className="text-right">
        {단지.전세가율_퍼센트 != null ? (
          <div className={`num text-[11px] font-bold leading-none ${단지.전세가율_퍼센트 >= 80 ? "text-[var(--color-warn)]" : 단지.전세가율_퍼센트 <= 55 ? "text-[var(--color-down)]" : "text-[var(--color-ink-2)]"}`}>
            {단지.전세가율_퍼센트.toFixed(0)}%
          </div>
        ) : (
          <div className="num text-[11px] text-[var(--color-ink-4)] leading-none">—</div>
        )}
        {단지.갭_만원 != null ? (
          <div className="text-[9px] text-[var(--color-ink-3)] mt-0.5 font-medium num">
            갭 {갭_라벨(단지.갭_만원)}
          </div>
        ) : null}
      </div>

      <div className="flex justify-center items-center">
        <스파크라인
          값들={단지.월별_평균가.map((m) => m.평균_만원)}
          너비={76}
          높이={24}
          색={상승 ? "var(--color-up)" : "var(--color-down)"}
        />
      </div>

      <div className="text-center">
        <span className={`num text-[12px] font-extrabold px-1.5 py-0.5 rounded ${점수_색(단지.종합_점수)}`}>
          {단지.종합_점수}
        </span>
      </div>

      {/* 네이버 부동산 바로가기 */}
      <div className="flex justify-center">
        <a
          href={네이버_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="네이버 부동산에서 검색"
          className="flex items-center gap-1 w-[42px] h-6 rounded bg-[#03C75A] text-white font-extrabold text-[10px] justify-center hover:opacity-90 transition-opacity"
        >
          <span className="leading-none">N</span>
          <span className="leading-none">매물</span>
        </a>
      </div>

      {/* 관심 하트 */}
      <div className="flex justify-center">
        <관심_하트
          시도_코드={단지.시도_코드}
          시군구_코드={단지.시군구_코드}
          시군구명={단지.시군구명}
          단지명={단지.단지명}
          최근_거래가_만원={단지.최신_거래가_만원 ?? 단지.현재_평균가_만원}
        />
      </div>
    </div>
  );
};

export const 단지_추천_헤더 = () => (
  <div className={`${그리드} py-2.5 border-b hairline-strong bg-[var(--color-bg-soft)]`}>
    <span className="label text-center">#</span>
    <span />
    <span className="label">단지 / 시군구</span>
    <span
      className="label text-right cursor-help"
      title="이상치·직거래를 제외한 최근 정상 거래가"
    >
      최신 거래가
    </span>
    <span
      className="label text-right cursor-help"
      title="최근 1년 매매+전세 거래 건수 (활발/한산)"
    >
      거래량
    </span>
    <span
      className="label text-right cursor-help"
      title="6개월 전 대비 매매가 변화율 (+상승/−하락)"
    >
      6개월
    </span>
    <span
      className="label text-right cursor-help"
      title="시군구 평균가 대비 이 단지 가격 (−저렴 / +비쌈)"
    >
      가성비
    </span>
    <span
      className="label text-right cursor-help"
      title="전세가 ÷ 매매가 (70% 부근이 안정)"
    >
      전세가율
    </span>
    <span
      className="label text-center cursor-help"
      title="최근 12개월 월별 평균 매매가 흐름"
    >
      추이
    </span>
    <span
      className="label text-center cursor-help"
      title="가성비·모멘텀·거래량·안정성·신축도 종합 점수"
    >
      점수
    </span>
    <span
      className="label text-center cursor-help"
      title="네이버 부동산 매물 검색"
    >
      매물
    </span>
    <span
      className="label text-center cursor-help"
      title="관심 단지로 저장"
    >
      관심
    </span>
  </div>
);
