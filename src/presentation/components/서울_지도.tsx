"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  서울_뷰박스,
  서울_구_경로,
} from "../data/서울_구_경로";
import type { 지도_지표 } from "../../application/서울_지도_유스케이스";
import { use_예산 } from "../hooks/use_예산";

interface 속성 {
  지표들: 지도_지표[];
  기본_지표?: 지표_종류;
}

// 근거 데이터 기간: 지표(평균가·변화율 등)가 이 기간의 실거래로 재계산된다
const 기간_선택지 = [3, 6, 12, 24, 36] as const;

const 억_표기 = (만원: number): string => {
  const 억 = 만원 / 10000;
  return Number.isInteger(억) ? `${억}억` : `${억.toFixed(1)}억`;
};

export type 지표_종류 = "매매가" | "전세가율" | "변화율" | "거래량";

const 라벨: Record<지표_종류, string> = {
  매매가: "매매 평당가",
  전세가율: "전세가율",
  변화율: "가격 변화",
  거래량: "거래 활성도",
};

const 값_뽑기 = (지표: 지도_지표, 종류: 지표_종류): number | null => {
  switch (종류) {
    case "매매가": return 지표.매매_평당_만원;
    case "전세가율": return 지표.전세가율_퍼센트;
    case "변화율": return 지표.변화율_퍼센트;
    case "거래량": return 지표.거래_YoY_퍼센트;
  }
};

const 포맷 = (값: number | null, 종류: 지표_종류): string => {
  if (값 == null) return "—";
  switch (종류) {
    case "매매가":
      // 평당 중위(만원/평)
      return `${값.toLocaleString("ko-KR")}만/평`;
    case "전세가율":
      return `${값.toFixed(1)}%`;
    case "변화율":
    case "거래량":
      return `${값 > 0 ? "+" : ""}${값.toFixed(1)}%`;
  }
};

const 보간 = (a: [number, number, number], b: [number, number, number], t: number): string => {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
};

const 색_구하기 = (
  값: number | null,
  종류: 지표_종류,
  최소: number,
  최대: number,
): string => {
  if (값 == null) return "#F2F4F6";
  // 변화율·거래활성도(YoY)는 0 중심 발산(파랑↔빨강)
  if (종류 === "변화율" || 종류 === "거래량") {
    const 절대 = Math.max(Math.abs(최소), Math.abs(최대), 1);
    const t = Math.max(-1, Math.min(1, 값 / 절대));
    if (t < 0) return 보간([65, 145, 255], [255, 255, 255], 1 + t);
    return 보간([255, 255, 255], [240, 68, 82], t);
  }
  const 범위 = 최대 - 최소 || 1;
  const t = Math.max(0, Math.min(1, (값 - 최소) / 범위));
  if (종류 === "매매가") {
    if (t < 0.5) return 보간([232, 245, 233], [255, 236, 179], t * 2);
    return 보간([255, 236, 179], [240, 68, 82], (t - 0.5) * 2);
  }
  // 전세가율
  if (t < 0.5) return 보간([228, 241, 255], [245, 245, 245], t * 2);
  return 보간([245, 245, 245], [255, 149, 0], (t - 0.5) * 2);
};

export const 서울_지도 = ({
  지표들,
  기본_지표 = "매매가",
}: 속성) => {
  const [지표, 지표_설정] = useState<지표_종류>(기본_지표);
  const [호버, 호버_설정] = useState<string | null>(null);
  // 클릭 고정: 카드가 고정되어야 다른 구를 지나 카드로 이동해도 안 바뀐다
  const [선택, 선택_설정] = useState<string | null>(null);

  const 라우터 = useRouter();
  const sp = useSearchParams();
  const [전환중, 시작] = useTransition();
  const 현재_개월 = Number(sp.get("months") ?? "6");
  // 변화율 지표 라벨은 "가격 변화 (%)"로 통일 (기간은 상단 기간 선택으로 조정)
  const 변화_라벨 = "가격 변화 (%)";

  // 기간 변경은 서버 재조회(URL 이동). 현재 지표는 유지되도록 함께 실어준다
  const 기간_변경 = (개월: number) => {
    if (개월 === 현재_개월) return;
    const params = new URLSearchParams(sp.toString());
    params.set("months", String(개월));
    params.set("metric", 지표);
    시작(() => 라우터.push(`/seoul-map?${params.toString()}`));
  };

  // 예산은 localStorage 개인 설정에서 self-read (URL/props 아님)
  const { 내_예산_만원, 예산_설정, 예산_해제, 초기화됨 } = use_예산();
  // 하이드레이션 안전: 초기화 전에는 예산 미적용 상태로 렌더
  const 예산_상한_만원 = 초기화됨 ? (내_예산_만원 ?? undefined) : undefined;
  // 직접 입력용 로컬 문자열 상태 (예산 값은 훅에만 존재)
  const [입력_억, 입력_억_설정] = useState<string>("");

  const 값_맵 = new Map(지표들.map((r) => [r.시군구_코드, r]));
  const 값들 = 지표들
    .map((r) => 값_뽑기(r, 지표))
    .filter((v): v is number => v != null);
  const 최소 = 값들.length ? Math.min(...값들) : 0;
  const 최대 = 값들.length ? Math.max(...값들) : 1;
  // 선택 지표가 이 기간에 전부 null(회색) — 장기 창의 변화·활성도는 데이터 부족
  const 표시_불가 = 값들.length === 0;
  const 폴백_있음 = 지표들.some((r) => r.YoY_폴백);

  const 정렬 = [...지표들]
    .map((r) => ({ ...r, 값: 값_뽑기(r, 지표) }))
    .filter((r) => r.값 != null)
    .sort((a, b) => (b.값 as number) - (a.값 as number));
  const 상위 = 정렬.slice(0, 3);
  const 하위 = 정렬.slice(-3).reverse();

  const 상위_라벨 =
    지표 === "매매가" ? "가장 비싼(평당)" :
    지표 === "전세가율" ? "가장 높은" :
    지표 === "변화율" ? "가장 오른" : "거래 급증";
  const 하위_라벨 =
    지표 === "매매가" ? "가장 저렴한(평당)" :
    지표 === "전세가율" ? "가장 낮은" :
    지표 === "변화율" ? "가장 내린" : "거래 급감";

  // 카드는 고정(선택)을 우선, 없으면 호버 미리보기. 고정 시 다른 구 위를 지나도 안 바뀜
  const 카드_코드 = 선택 ?? 호버;
  const 카드_지표 = 카드_코드 ? 값_맵.get(카드_코드) : null;

  const 예산_적용 = 예산_상한_만원 != null && 예산_상한_만원 > 0;
  const 예산_이하_구 = (코드: string): boolean => {
    if (!예산_적용) return false;
    const 데이터 = 값_맵.get(코드);
    // 예산은 '총액'이라 색상값(평당)이 아닌 국민평형 총액 중위와 비교
    const 가격 = 데이터?.국민평형_총액_만원;
    return 가격 != null && 가격 <= (예산_상한_만원 as number);
  };
  const 예산_이하_개수 = 예산_적용
    ? 지표들.filter((r) => 예산_이하_구(r.시군구_코드)).length
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div className="toss-card p-4">
        {/* 기간: 모든 지표·색상·값이 이 기간의 실거래로 재계산되는 최상위 컨트롤 */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b hairline flex-wrap">
          <span className="text-[12px] font-extrabold text-[var(--color-ink-2)]">
            기간
          </span>
          {기간_선택지.map((개월) => (
            <button
              key={개월}
              type="button"
              onClick={() => 기간_변경(개월)}
              className={`pill ${개월 === 현재_개월 ? "pill-active" : ""}`}
            >
              {개월}개월
            </button>
          ))}
          {전환중 && (
            <span className="text-[11px] font-semibold text-[var(--color-brand)]">
              불러오는 중…
            </span>
          )}
        </div>

        {/* 지표: 선택 기간 데이터를 어떤 값으로 볼지 (색상 기준) */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {(Object.keys(라벨) as 지표_종류[]).map((k) => (
            <button
              key={k}
              onClick={() => 지표_설정(k)}
              className={`pill ${k === 지표 ? "pill-active" : ""}`}
            >
              {k === "변화율" ? 변화_라벨 : 라벨[k]}
            </button>
          ))}
          {예산_적용 && (
            <span
              className="pill"
              style={{
                background: "#DCFCE7",
                color: "#15803D",
                cursor: "default",
              }}
            >
              {억_표기(예산_상한_만원 as number)} 이하 {예산_이하_개수}개 구 강조 중
            </span>
          )}
        </div>

        {/* 내 예산 인라인 편집: 클릭 즉시 저장/해제 → 하이라이트 실시간 갱신 */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[11px] font-bold text-[var(--color-ink-3)]">
            내 예산
          </span>
          <span className="text-[12px] font-extrabold num text-[var(--color-ink)]">
            {초기화됨 && 예산_적용
              ? 억_표기(예산_상한_만원 as number)
              : "미설정"}
          </span>
          <span className="text-[var(--color-ink-4)]">·</span>
          {[6.5, 8, 10, 15].map((v) => {
            const 만원 = Math.round(v * 10000);
            const 선택됨 = 예산_적용 && 예산_상한_만원 === 만원;
            return (
              <button
                key={v}
                type="button"
                onClick={() => 예산_설정(만원)}
                className={`pill ${선택됨 ? "pill-active" : ""}`}
              >
                {v}억
              </button>
            );
          })}
          <div className="flex items-center gap-1 rounded-[10px] bg-[var(--color-bg-mute)] px-2.5">
            <input
              type="number"
              inputMode="decimal"
              min={1}
              step={0.5}
              value={입력_억}
              placeholder="직접"
              onChange={(e) => 입력_억_설정(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const n = Number(입력_억);
                if (Number.isFinite(n) && n > 0) {
                  예산_설정(Math.round(n * 10000));
                  입력_억_설정("");
                }
              }}
              aria-label="내 예산 직접 입력 (억)"
              className="num w-14 bg-transparent py-1.5 text-[12px] font-bold outline-none text-[var(--color-ink)]"
            />
            <span className="text-[11px] font-bold text-[var(--color-ink-3)] shrink-0">
              억
            </span>
          </div>
          {예산_적용 && (
            <button
              type="button"
              onClick={() => 예산_해제()}
              className="pill"
            >
              해제
            </button>
          )}
        </div>

        <div className="relative">
          <svg
            viewBox={`0 0 ${서울_뷰박스.width} ${서울_뷰박스.height}`}
            className="w-full h-auto"
            style={{ maxHeight: "620px", background: "var(--color-bg-soft)" }}
          >
            {/* 원본 SVG 좌표가 절대값이라 translate 필요 */}
            <g transform={`translate(${서울_뷰박스.translateX} ${서울_뷰박스.translateY})`}>
              {서울_구_경로.map((구) => {
                const 데이터 = 값_맵.get(구.코드);
                const 값 = 데이터 ? 값_뽑기(데이터, 지표) : null;
                const 채움 = 색_구하기(값, 지표, 최소, 최대);
                const 호버_활성 = 호버 === 구.코드;
                const 선택_활성 = 선택 === 구.코드;
                const 이하 = 예산_이하_구(구.코드);
                // 예산 이하 → 초록, 고정 → 브랜드 블루, 호버 → 진한 잉크, 그 외 → 기존 빨강
                const 선_색 = 이하
                  ? "#22C55E"
                  : 선택_활성
                    ? "#3182F6"
                    : 호버_활성
                      ? "#191F28"
                      : "#CC3333";
                const 선_두께 = 이하 ? 3 : 선택_활성 ? 3.5 : 호버_활성 ? 3 : 1.5;
                // 예산 적용 시 초과 구는 흐리게
                const 불투명 = 예산_적용 && !이하 ? 0.35 : 1;
                return (
                  <path
                    key={구.코드}
                    d={구.d}
                    fill={채움}
                    opacity={불투명}
                    stroke={선_색}
                    strokeWidth={선_두께}
                    fillRule="evenodd"
                    onMouseEnter={() => 호버_설정(구.코드)}
                    onMouseLeave={() => 호버_설정(null)}
                    onClick={() =>
                      선택_설정((이전) => (이전 === 구.코드 ? null : 구.코드))
                    }
                    style={{
                      cursor: "pointer",
                      transition:
                        "stroke 120ms ease, stroke-width 120ms ease, fill-opacity 120ms ease",
                    }}
                  />
                );
              })}
            </g>

            {/* 라벨은 오프셋 이후 좌표라 별도 g 없이 */}
            {서울_구_경로.map((구) => {
              const 데이터 = 값_맵.get(구.코드);
              const 값 = 데이터 ? 값_뽑기(데이터, 지표) : null;
              return (
                <g key={`t-${구.코드}`} style={{ pointerEvents: "none" }}>
                  <text
                    x={구.라벨_x}
                    y={구.라벨_y}
                    fontSize={26}
                    fontWeight={800}
                    fill="#191F28"
                    textAnchor="middle"
                  >
                    {구.이름}
                  </text>
                  {값 != null && (
                    <text
                      x={구.라벨_x}
                      y={구.라벨_y + 26}
                      fontSize={20}
                      fontWeight={700}
                      fill="#191F28"
                      textAnchor="middle"
                    >
                      {포맷(값, 지표)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {카드_지표 && (
            <div className="absolute top-3 right-3 toss-card p-4 min-w-[220px] shadow-md">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="text-[15px] font-extrabold">
                  {카드_지표.시군구명}
                </div>
                {선택 ? (
                  <button
                    onClick={() => 선택_설정(null)}
                    aria-label="고정 해제"
                    className="text-[var(--color-ink-3)] hover:text-[var(--color-ink)] w-5 h-5 flex items-center justify-center -mr-1 -mt-0.5"
                  >
                    ✕
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-[var(--color-ink-4)] mt-0.5 whitespace-nowrap">
                    클릭해 고정
                  </span>
                )}
              </div>
              <dl className="space-y-1 text-[12px]">
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-3)] font-medium">매매 평당</dt>
                  <dd className="font-bold num">{포맷(카드_지표.매매_평당_만원, "매매가")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-3)] font-medium">국민평형 시세</dt>
                  <dd className="font-bold num">
                    {카드_지표.국민평형_총액_만원 != null
                      ? 억_표기(카드_지표.국민평형_총액_만원)
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-3)] font-medium">전세가율</dt>
                  <dd className="font-bold num">{포맷(카드_지표.전세가율_퍼센트, "전세가율")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-3)] font-medium">{변화_라벨}</dt>
                  <dd
                    className={`font-bold num ${
                      (카드_지표.변화율_퍼센트 ?? 0) > 0
                        ? "text-[var(--color-up)]"
                        : (카드_지표.변화율_퍼센트 ?? 0) < 0
                          ? "text-[var(--color-down)]"
                          : ""
                    }`}
                  >
                    {포맷(카드_지표.변화율_퍼센트, "변화율")}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-3)] font-medium">
                    거래량
                    {카드_지표.거래_YoY_퍼센트 != null && (
                      <span
                        className="ml-1 text-[10px] text-[var(--color-ink-4)]"
                        title={카드_지표.YoY_폴백 ? "1년 전 데이터 부족 → 직전 동기간 대비" : "전년 동기간 대비"}
                      >
                        {카드_지표.YoY_폴백 ? "직전비" : "전년비"}
                      </span>
                    )}
                  </dt>
                  <dd className="font-bold num text-right">
                    {카드_지표.거래_건수.toLocaleString("ko-KR")}건
                    {카드_지표.거래_YoY_퍼센트 != null && (
                      <span
                        className={`ml-1.5 text-[11px] ${
                          카드_지표.거래_YoY_퍼센트 > 0
                            ? "text-[var(--color-up)]"
                            : 카드_지표.거래_YoY_퍼센트 < 0
                              ? "text-[var(--color-down)]"
                              : ""
                        }`}
                      >
                        {포맷(카드_지표.거래_YoY_퍼센트, "거래량")}
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
              <Link
                href={`/picks?region=서울&district=${카드_지표.시군구_코드}`}
                className="mt-3 block text-center text-[12px] font-bold text-[var(--color-brand)] hover:underline"
              >
                이 구의 단지 추천 보기 →
              </Link>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          {표시_불가 ? (
            <div className="text-[12px] font-medium text-[var(--color-ink-3)]">
              이 기간에는 <span className="font-bold">{라벨[지표]}</span>를 계산할
              데이터가 부족합니다. 더 짧은 기간(3·6개월)을 선택하세요.
            </div>
          ) : (
            <>
              <span className="text-[11px] font-bold text-[var(--color-ink-3)]">범례</span>
              <div className="flex items-center gap-1 text-[11px]">
                <span
                  className="inline-block w-24 h-3 rounded"
                  style={{
                    background:
                      지표 === "변화율" || 지표 === "거래량"
                        ? "linear-gradient(to right, rgb(65,145,255), white, rgb(240,68,82))"
                        : 지표 === "매매가"
                          ? "linear-gradient(to right, rgb(232,245,233), rgb(255,236,179), rgb(240,68,82))"
                          : "linear-gradient(to right, rgb(228,241,255), rgb(245,245,245), rgb(255,149,0))",
                  }}
                />
                <span className="text-[var(--color-ink-3)] font-medium num">{포맷(최소, 지표)}</span>
                <span className="text-[var(--color-ink-4)]">~</span>
                <span className="text-[var(--color-ink-3)] font-medium num">{포맷(최대, 지표)}</span>
              </div>
              {지표 === "거래량" && 폴백_있음 && (
                <span className="text-[10px] font-medium text-[var(--color-ink-4)]">
                  * 일부 구는 1년 전 데이터 부족 → 직전 동기간 대비
                </span>
              )}
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="toss-card p-4">
          <div className="text-[11px] font-bold text-[var(--color-ink-3)] mb-2">
            {상위_라벨} 자치구 TOP 3
          </div>
          <ol className="space-y-1.5">
            {상위.map((r, i) => (
              <li key={r.시군구_코드}>
                <Link
                  href={`/picks?region=서울&district=${r.시군구_코드}`}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-[var(--color-bg-mute)] transition-colors"
                >
                  <span className="num text-[10px] font-bold text-[var(--color-ink-4)] w-4">{i + 1}</span>
                  <span className="text-[13px] font-bold flex-1">{r.시군구명}</span>
                  <span className="num text-[12px] font-extrabold text-[var(--color-up)]">
                    {포맷(r.값, 지표)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <div className="toss-card p-4">
          <div className="text-[11px] font-bold text-[var(--color-ink-3)] mb-2">
            {하위_라벨} 자치구 TOP 3
          </div>
          <ol className="space-y-1.5">
            {하위.map((r, i) => (
              <li key={r.시군구_코드}>
                <Link
                  href={`/picks?region=서울&district=${r.시군구_코드}`}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-[var(--color-bg-mute)] transition-colors"
                >
                  <span className="num text-[10px] font-bold text-[var(--color-ink-4)] w-4">{i + 1}</span>
                  <span className="text-[13px] font-bold flex-1">{r.시군구명}</span>
                  <span className="num text-[12px] font-extrabold text-[var(--color-down)]">
                    {포맷(r.값, 지표)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <div className="toss-card p-4 bg-[var(--color-bg-soft)]">
          <div className="text-[11px] font-bold text-[var(--color-ink-3)] mb-2">사용법 · 지표 정의</div>
          <div className="text-[12px] font-medium text-[var(--color-ink-2)] leading-relaxed">
            자치구를 클릭하면 카드가 고정되어 다른 구 위를 지나 &lsquo;이 구의 단지 추천 보기&rsquo;까지 이동할 수 있습니다. 표본이 부족한 구는 회색으로 비웁니다.
            <ul className="mt-2 space-y-1 text-[11px] text-[var(--color-ink-3)]">
              <li><b>매매 평당가</b> — 면적버킷 고정가중 <b>평당 중위</b>(만원/평). 면적 구성 편향·고가 이상거래 보정.</li>
              <li><b>전세가율</b> — <b>순수 전세</b>(월세 제외) 면적버킷 ㎡당 중위비. 월세 혼입 과소추정 교정.</li>
              <li><b>가격 변화</b> — 면적버킷 매칭(라스파이레스) 지수. 구성변화 제거. 장기 기간은 데이터 부족 시 회색.</li>
              <li><b>거래 활성도</b> — 전년 동기 대비 매매 증감률(색), 원건수 병기. 1년 전 부족 시 직전기 대비(*).</li>
            </ul>
            {예산_적용 && (
              <div className="mt-2 font-bold" style={{ color: "#15803D" }}>
                국민평형(60~85㎡) 시세 {억_표기(예산_상한_만원 as number)} 이하 구는 초록
                테두리로 강조되고, 초과 구는 흐리게 표시됩니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
