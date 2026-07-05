"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use_예산 } from "../hooks/use_예산";

export const 예산_위젯 = () => {
  const router = useRouter();
  const { 내_예산_만원, 예산_설정, 초기화됨 } = use_예산();
  const [억, 억_설정] = useState<string>("8");

  // 마운트 시 localStorage 값을 억으로 역산해 입력창에 1회 반영
  useEffect(() => {
    if (!초기화됨) return;
    if (내_예산_만원 != null && 내_예산_만원 > 0) {
      억_설정(String(내_예산_만원 / 10000));
    }
    // 초기화됨이 true로 바뀔 때 1회만 동기화 (라이브 미러 금지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [초기화됨]);

  const 상한_만원 = (): number => {
    const n = Number(억);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n * 10000);
  };

  const 유효 = 상한_만원() > 0;

  // 빠른선택/입력 변경 시 localStorage 저장
  const 억_변경 = (값: string) => {
    억_설정(값);
    const n = Number(값);
    if (Number.isFinite(n) && n > 0) {
      예산_설정(Math.round(n * 10000));
    }
  };

  const 단지_보기 = () => {
    if (!유효) return;
    router.push(`/picks?region=서울&price=0-${상한_만원()}`);
  };

  const 지도_보기 = () => {
    if (!유효) return;
    // 예산을 localStorage에 저장 후 파라미터 없이 지도로 이동
    예산_설정(상한_만원());
    router.push(`/seoul-map`);
  };

  return (
    <div className="toss-card p-6 md:p-7">
      <div className="text-[13px] font-bold text-[var(--color-brand)] mb-1">
        BUDGET
      </div>
      <div className="text-[18px] font-extrabold tracking-[-0.02em] mb-1">
        내 예산으로 어디까지?
      </div>
      <p className="text-[13px] text-[var(--color-ink-3)] font-medium mb-4">
        가용 자금을 억 단위로 넣으면 그 이하 매물·자치구만 봅니다.
      </p>

      <div className="flex items-stretch gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 rounded-[10px] bg-[var(--color-bg-mute)] px-4 focus-within:ring-2 focus-within:ring-[var(--color-brand)]">
          <input
            type="number"
            inputMode="decimal"
            min={1}
            step={0.5}
            value={억}
            onChange={(e) => 억_변경(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") 단지_보기();
            }}
            aria-label="예산 (억 단위)"
            className="num w-full bg-transparent py-3 text-[22px] font-extrabold tracking-[-0.02em] outline-none text-[var(--color-ink)]"
          />
          <span className="text-[16px] font-bold text-[var(--color-ink-3)] shrink-0">
            억
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[6.5, 8, 10, 15].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => 억_변경(String(v))}
            className={`pill ${Number(억) === v ? "pill-active" : ""}`}
          >
            {v}억
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={단지_보기}
          disabled={!유효}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          단지 보기
        </button>
        <button
          type="button"
          onClick={지도_보기}
          disabled={!유효}
          className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
        >
          지도에서 보기
        </button>
      </div>
    </div>
  );
};
