"use client";

import Link from "next/link";
import { useState } from "react";
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

const 억_표기 = (만원: number): string => {
  const 억 = 만원 / 10000;
  return Number.isInteger(억) ? `${억}억` : `${억.toFixed(1)}억`;
};

export type 지표_종류 = "매매가" | "전세가율" | "변화율" | "거래량";

const 라벨: Record<지표_종류, string> = {
  매매가: "매매 평균가",
  전세가율: "전세가율",
  변화율: "6개월 변화",
  거래량: "거래량",
};

const 값_뽑기 = (지표: 지도_지표, 종류: 지표_종류): number | null => {
  switch (종류) {
    case "매매가": return 지표.매매_평균가_만원;
    case "전세가율": return 지표.전세가율_퍼센트;
    case "변화율": return 지표.변화_6개월_퍼센트;
    case "거래량": return 지표.거래_건수;
  }
};

const 포맷 = (값: number | null, 종류: 지표_종류): string => {
  if (값 == null) return "—";
  switch (종류) {
    case "매매가":
      if (값 >= 10000) {
        const 억 = Math.floor(값 / 10000);
        const 천 = Math.round((값 % 10000) / 1000);
        return 천 > 0 ? `${억}억 ${천}천` : `${억}억`;
      }
      return `${값.toLocaleString("ko-KR")}만`;
    case "전세가율":
      return `${값.toFixed(1)}%`;
    case "변화율":
      return `${값 > 0 ? "+" : ""}${값.toFixed(1)}%`;
    case "거래량":
      return `${값.toLocaleString("ko-KR")}건`;
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
  if (종류 === "변화율") {
    const 절대 = Math.max(Math.abs(최소), Math.abs(최대));
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
  if (종류 === "전세가율") {
    if (t < 0.5) return 보간([228, 241, 255], [245, 245, 245], t * 2);
    return 보간([245, 245, 245], [255, 149, 0], (t - 0.5) * 2);
  }
  return 보간([236, 240, 244], [49, 130, 246], t);
};

export const 서울_지도 = ({
  지표들,
  기본_지표 = "매매가",
}: 속성) => {
  const [지표, 지표_설정] = useState<지표_종류>(기본_지표);
  const [호버, 호버_설정] = useState<string | null>(null);

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

  const 정렬 = [...지표들]
    .map((r) => ({ ...r, 값: 값_뽑기(r, 지표) }))
    .filter((r) => r.값 != null)
    .sort((a, b) => (b.값 as number) - (a.값 as number));
  const 상위 = 정렬.slice(0, 3);
  const 하위 = 정렬.slice(-3).reverse();

  const 상위_라벨 =
    지표 === "매매가" ? "가장 비싼" :
    지표 === "전세가율" ? "가장 높은" :
    지표 === "변화율" ? "가장 오른" : "가장 활발한";
  const 하위_라벨 =
    지표 === "매매가" ? "가장 저렴한" :
    지표 === "전세가율" ? "가장 낮은" :
    지표 === "변화율" ? "가장 내린" : "가장 한산한";

  const 호버_지표 = 호버 ? 값_맵.get(호버) : null;

  const 예산_적용 = 예산_상한_만원 != null && 예산_상한_만원 > 0;
  const 예산_이하_구 = (코드: string): boolean => {
    if (!예산_적용) return false;
    const 데이터 = 값_맵.get(코드);
    const 가격 = 데이터?.매매_평균가_만원;
    return 가격 != null && 가격 <= (예산_상한_만원 as number);
  };
  const 예산_이하_개수 = 예산_적용
    ? 지표들.filter((r) => 예산_이하_구(r.시군구_코드)).length
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div className="toss-card p-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {(Object.keys(라벨) as 지표_종류[]).map((k) => (
            <button
              key={k}
              onClick={() => 지표_설정(k)}
              className={`pill ${k === 지표 ? "pill-active" : ""}`}
            >
              {라벨[k]}
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
                const 활성 = 호버 === 구.코드;
                const 이하 = 예산_이하_구(구.코드);
                // 예산 이하 → 초록 강조, 호버 → 진한 잉크, 그 외 → 기존 빨강
                const 선_색 = 이하 ? "#22C55E" : 활성 ? "#191F28" : "#CC3333";
                const 선_두께 = 이하 ? 3 : 활성 ? 3 : 1.5;
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

          {호버_지표 && (
            <div className="absolute top-3 right-3 toss-card p-4 min-w-[220px] shadow-md">
              <div className="text-[15px] font-extrabold mb-2">
                {호버_지표.시군구명}
              </div>
              <dl className="space-y-1 text-[12px]">
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-3)] font-medium">매매 평균</dt>
                  <dd className="font-bold num">{포맷(호버_지표.매매_평균가_만원, "매매가")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-3)] font-medium">전세가율</dt>
                  <dd className="font-bold num">{포맷(호버_지표.전세가율_퍼센트, "전세가율")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-3)] font-medium">6개월 변화</dt>
                  <dd
                    className={`font-bold num ${
                      (호버_지표.변화_6개월_퍼센트 ?? 0) > 0
                        ? "text-[var(--color-up)]"
                        : (호버_지표.변화_6개월_퍼센트 ?? 0) < 0
                          ? "text-[var(--color-down)]"
                          : ""
                    }`}
                  >
                    {포맷(호버_지표.변화_6개월_퍼센트, "변화율")}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-3)] font-medium">거래량</dt>
                  <dd className="font-bold num">{포맷(호버_지표.거래_건수, "거래량")}</dd>
                </div>
              </dl>
              <Link
                href={`/picks?region=서울&district=${호버_지표.시군구_코드}`}
                className="mt-3 block text-center text-[12px] font-bold text-[var(--color-brand)] hover:underline"
              >
                이 구의 단지 추천 보기 →
              </Link>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-bold text-[var(--color-ink-3)]">범례</span>
          <div className="flex items-center gap-1 text-[11px]">
            <span
              className="inline-block w-24 h-3 rounded"
              style={{
                background:
                  지표 === "변화율"
                    ? "linear-gradient(to right, rgb(65,145,255), white, rgb(240,68,82))"
                    : 지표 === "매매가"
                      ? "linear-gradient(to right, rgb(232,245,233), rgb(255,236,179), rgb(240,68,82))"
                      : 지표 === "전세가율"
                        ? "linear-gradient(to right, rgb(228,241,255), rgb(245,245,245), rgb(255,149,0))"
                        : "linear-gradient(to right, rgb(236,240,244), rgb(49,130,246))",
              }}
            />
            <span className="text-[var(--color-ink-3)] font-medium num">{포맷(최소, 지표)}</span>
            <span className="text-[var(--color-ink-4)]">~</span>
            <span className="text-[var(--color-ink-3)] font-medium num">{포맷(최대, 지표)}</span>
          </div>
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
          <div className="text-[11px] font-bold text-[var(--color-ink-3)] mb-2">사용법</div>
          <div className="text-[12px] font-medium text-[var(--color-ink-2)] leading-relaxed">
            각 자치구가 지표 값에 따라 색으로 채워집니다. 마우스를 올리면 상세 4개 지표 카드가, 클릭하면 단지 추천으로 이동합니다.
            {예산_적용 && (
              <>
                {" "}
                <span className="font-bold" style={{ color: "#15803D" }}>
                  매매 평균 {억_표기(예산_상한_만원 as number)} 이하 구는 초록
                  테두리로 강조되고, 초과 구는 흐리게 표시됩니다.
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
