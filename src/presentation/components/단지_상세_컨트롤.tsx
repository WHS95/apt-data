"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { 면적_구간_코드 } from "../../domain/공통/코드";

interface 평형 {
  코드: 면적_구간_코드;
  라벨: string;
  거래수: number;
}

interface 속성 {
  평형_옵션: 평형[];
  현재_평형: string;
  현재_거래유형: "전체" | "1" | "2";
  정상만: boolean;
}

export const 단지_상세_컨트롤 = ({
  평형_옵션,
  현재_평형,
  현재_거래유형,
  정상만,
}: 속성) => {
  const 라우터 = useRouter();
  const sp = useSearchParams();
  const [전환중, 시작] = useTransition();

  const 갱신 = (키: string, 값: string) => {
    const 다음 = new URLSearchParams(sp.toString());
    if (값 === "" || 값 === "전체") 다음.delete(키);
    else 다음.set(키, 값);
    시작(() => 라우터.push(`?${다음.toString()}`));
  };

  const 정상_토글 = () => 갱신("정상", 정상만 ? "" : "1");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {[
        { 값: "전체", 라벨: "전체" },
        { 값: "1", 라벨: "매매" },
        { 값: "2", 라벨: "전·월세" },
      ].map((옵션) => (
        <button
          key={옵션.값}
          onClick={() => 갱신("거래", 옵션.값)}
          className={`pill ${현재_거래유형 === 옵션.값 ? "pill-active" : ""}`}
        >
          {옵션.라벨}
        </button>
      ))}

      <span className="w-px h-5 bg-[var(--color-line)] mx-2" />

      {/* 평형 */}
      <button
        onClick={() => 갱신("평형", "전체")}
        className={`pill ${현재_평형 === "전체" ? "pill-active" : ""}`}
      >
        전체 평형
      </button>
      {평형_옵션.map((p) => (
        <button
          key={p.코드}
          onClick={() => 갱신("평형", p.코드)}
          className={`pill ${현재_평형 === p.코드 ? "pill-active" : ""}`}
        >
          {p.라벨} <span className="text-[var(--color-ink-4)] font-medium">({p.거래수})</span>
        </button>
      ))}

      <span className="w-px h-5 bg-[var(--color-line)] mx-2" />

      <button
        onClick={정상_토글}
        className={`pill ${정상만 ? "pill-brand" : ""}`}
        title="중위가 ±35% 벗어난 거래 / 직거래(가족간 의심) 제외"
      >
        {정상만 ? "✓ 정상 거래만" : "정상 거래만 보기"}
      </button>

      {전환중 && (
        <span className="text-[12px] font-semibold text-[var(--color-brand)] ml-2">
          불러오는 중…
        </span>
      )}
    </div>
  );
};
