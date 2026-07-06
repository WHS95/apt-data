"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { 골든크로스_구 } from "../../application/서울_골든크로스_유스케이스";
import type { 기간_종류 } from "./골든크로스_차트";

// canvas 기반 lightweight-charts → ssr:false 동적 임포트
const 골든크로스_차트 = dynamic(() => import("./골든크로스_차트"), {
  ssr: false,
  loading: () => (
    <div className="h-[380px] flex items-center justify-center text-[13px] text-[var(--color-ink-3)]">
      차트 불러오는 중…
    </div>
  ),
});

const 기간_선택지: 기간_종류[] = ["1년", "2년", "전체"];

const 상태_색 = (상태: 골든크로스_구["현재_상태"]) =>
  상태 === "골든"
    ? { bg: "var(--color-up-soft)", fg: "var(--color-up)", 라벨: "🔺 골든크로스" }
    : 상태 === "데드"
      ? { bg: "var(--color-down-soft)", fg: "var(--color-down)", 라벨: "🔻 데드크로스" }
      : { bg: "var(--color-bg-mute)", fg: "var(--color-ink-2)", 라벨: "중립" };

export const 상승신호_뷰 = ({ 구들 }: { 구들: 골든크로스_구[] }) => {
  const [코드, 코드_설정] = useState<string>(
    () => (구들.find((g) => g.시군구명 === "노원구") ?? 구들[0])?.시군구_코드 ?? "",
  );
  const [기간, 기간_설정] = useState<기간_종류>("2년");

  const 선택 = useMemo(
    () => 구들.find((g) => g.시군구_코드 === 코드) ?? 구들[0],
    [구들, 코드],
  );
  const 이름순 = useMemo(
    () => [...구들].sort((a, b) => a.시군구명.localeCompare(b.시군구명, "ko")),
    [구들],
  );
  const 골든구 = useMemo(
    () =>
      구들
        .filter((g) => g.현재_상태 === "골든")
        .sort((a, b) => (b.현재_스프레드 ?? 0) - (a.현재_스프레드 ?? 0)),
    [구들],
  );

  if (!선택) {
    return (
      <div className="toss-card p-12 text-center text-[var(--color-ink-3)]">
        데이터가 없습니다.
      </div>
    );
  }
  const 상태 = 상태_색(선택.현재_상태);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      <div className="toss-card p-4">
        {/* 컨트롤 */}
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <select
              value={코드}
              onChange={(e) => 코드_설정(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-[14px] font-bold text-[var(--color-ink)] outline-none focus:border-[var(--color-ink)]"
              aria-label="자치구 선택"
            >
              {이름순.map((g) => (
                <option key={g.시군구_코드} value={g.시군구_코드}>
                  {g.시군구명}
                </option>
              ))}
            </select>
            <span
              className="px-2.5 py-1 rounded-lg text-[12px] font-extrabold"
              style={{ background: 상태.bg, color: 상태.fg }}
            >
              {상태.라벨}
              {선택.현재_스프레드 != null && (
                <span className="num ml-1">
                  {선택.현재_스프레드 > 0 ? "+" : ""}
                  {선택.현재_스프레드}%
                </span>
              )}
            </span>
          </div>
          <div className="flex gap-1">
            {기간_선택지.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => 기간_설정(k)}
                className={`pill ${k === 기간 ? "pill-active" : ""}`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-3 mb-2 text-[11px] font-medium text-[var(--color-ink-3)] flex-wrap">
          <span className="flex items-center gap-1">
            <i className="inline-block w-3 h-[2px] bg-[#3182f6]" /> 단기 8주
          </span>
          <span className="flex items-center gap-1">
            <i className="inline-block w-3 h-[2px] bg-[#f04452]" /> 장기 24주
          </span>
          <span className="flex items-center gap-1">
            <i className="inline-block w-3 h-[2px] bg-[#c4cad2]" /> 평당가(주별 중위)
          </span>
          <span style={{ color: "#f5a623" }}>▲ 골든크로스</span>
        </div>

        {/* 차트 */}
        <골든크로스_차트 구={선택} 기간={기간} />

        {/* 상태 요약 */}
        <div className="mt-3 text-[12px] font-medium text-[var(--color-ink-2)] leading-relaxed">
          {선택.현재_상태 === "골든" ? (
            <>
              <b className="text-[var(--color-up)]">🔺 {선택.시군구명} 골든크로스 유지 중</b> — 단기(8주)선이
              장기(24주)선 위. 최근 발생 <b className="num">{선택.최근_골든_시각}</b>, 스프레드{" "}
              <b className="num">
                {(선택.현재_스프레드 ?? 0) > 0 ? "+" : ""}
                {선택.현재_스프레드}%
              </b>
              . 상승 초입 신호입니다.
            </>
          ) : 선택.현재_상태 === "데드" ? (
            <>
              <b className="text-[var(--color-down)]">🔻 {선택.시군구명} 데드크로스</b> — 단기선이 장기선
              아래. 하락/조정 국면 신호.
            </>
          ) : (
            <>{선택.시군구명}는 단기·장기선이 붙어 있는 중립 구간입니다.</>
          )}
        </div>
      </div>

      {/* 사이드: 스캐너 + 설명 */}
      <div className="space-y-4">
        <div className="toss-card p-4">
          <div className="text-[11px] font-bold text-[var(--color-ink-3)] mb-2">
            현재 골든크로스 <span className="num text-[var(--color-up)]">{골든구.length}</span>개 구
          </div>
          <ol className="space-y-0.5">
            {골든구.map((g, i) => (
              <li key={g.시군구_코드}>
                <button
                  type="button"
                  onClick={() => 코드_설정(g.시군구_코드)}
                  className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-lg text-left hover:bg-[var(--color-bg-mute)] transition-colors ${
                    g.시군구_코드 === 코드 ? "bg-[var(--color-bg-mute)]" : ""
                  }`}
                >
                  <span className="num text-[10px] font-bold text-[var(--color-ink-4)] w-4">
                    {i + 1}
                  </span>
                  <span className="text-[13px] font-bold flex-1">{g.시군구명}</span>
                  <span className="num text-[12px] font-extrabold text-[var(--color-up)]">
                    +{g.현재_스프레드}%
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="toss-card p-4 bg-[var(--color-bg-soft)]">
          <div className="text-[11px] font-bold text-[var(--color-ink-3)] mb-2">읽는 법</div>
          <div className="text-[12px] font-medium text-[var(--color-ink-2)] leading-relaxed">
            자치구 아파트 <b>주별 평당가 중위</b>에 <b>단기 8주</b>·<b>장기 24주</b> 이동평균선을
            그립니다. 단기선이 장기선을 아래→위로 뚫는 <b style={{ color: "#f5a623" }}>골든크로스(▲)</b>가
            상승 진입 신호, 위→아래로 뚫는 데드크로스가 하락 신호입니다. 스프레드(단기−장기)가 클수록
            상승 탄력이 강합니다.
          </div>
        </div>
      </div>
    </div>
  );
};
