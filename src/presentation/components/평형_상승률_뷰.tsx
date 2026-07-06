"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { 평형_밴드_추세 } from "../../application/평형별_상승률_유스케이스";
import { 평형_상승률_차트, 밴드_색 } from "./평형_상승률_차트";

const 권역_선택지 = ["서울", "경기", "인천", "수도권"];

export const 평형_상승률_뷰 = ({
  밴드들,
  권역,
}: {
  밴드들: 평형_밴드_추세[];
  권역: string;
}) => {
  const 라우터 = useRouter();
  const [전환중, 시작] = useTransition();
  const 순위 = [...밴드들].sort((a, b) => (b.상승률 ?? -99) - (a.상승률 ?? -99));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      <div className="toss-card p-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[12px] font-extrabold text-[var(--color-ink-2)]">지역</span>
          {권역_선택지.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => k !== 권역 && 시작(() => 라우터.push(`/size-trend?region=${k}`))}
              className={`pill ${k === 권역 ? "pill-active" : ""}`}
            >
              {k}
            </button>
          ))}
          {전환중 && (
            <span className="text-[11px] font-semibold text-[var(--color-brand)]">불러오는 중…</span>
          )}
        </div>

        <div className="flex items-center gap-3 mb-2 text-[11px] font-medium text-[var(--color-ink-3)] flex-wrap">
          {밴드들.map((b, i) => (
            <span key={b.키} className="flex items-center gap-1">
              <i className="inline-block w-3 h-[2px]" style={{ background: 밴드_색[i % 밴드_색.length] }} />
              {b.라벨}
            </span>
          ))}
        </div>

        {밴드들.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-[13px] text-[var(--color-ink-3)]">
            데이터가 없습니다.
          </div>
        ) : (
          <평형_상승률_차트 밴드들={밴드들} />
        )}
      </div>

      <div className="space-y-4">
        <div className="toss-card p-4">
          <div className="text-[11px] font-bold text-[var(--color-ink-3)] mb-2">
            {권역} 평형대별 상승률 (기간 전체)
          </div>
          <ol className="space-y-1">
            {순위.map((b) => (
              <li key={b.키} className="flex items-center gap-2 py-1.5 px-1">
                <i
                  className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ background: 밴드_색[밴드들.indexOf(b) % 밴드_색.length] }}
                />
                <span className="text-[13px] font-bold flex-1">{b.라벨}</span>
                <span
                  className={`num text-[13px] font-extrabold ${
                    (b.상승률 ?? 0) > 0
                      ? "text-[var(--color-up)]"
                      : (b.상승률 ?? 0) < 0
                        ? "text-[var(--color-down)]"
                        : ""
                  }`}
                >
                  {(b.상승률 ?? 0) > 0 ? "+" : ""}
                  {b.상승률}%
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="toss-card p-4 bg-[var(--color-bg-soft)]">
          <div className="text-[11px] font-bold text-[var(--color-ink-3)] mb-2">읽는 법</div>
          <div className="text-[12px] font-medium text-[var(--color-ink-2)] leading-relaxed">
            아파트 매매 평당가를 <b>평형대별로 첫 달=100</b> 지수화한 흐름입니다. 구 구성 편향을
            없애려 <b>자치구 고정가중</b>으로 합쳐, 어느 평형대가 더 올랐는지 비교할 수 있습니다.
            상승률은 기간 첫 달 대비 마지막 달 변화율입니다.
          </div>
        </div>
      </div>
    </div>
  );
};
