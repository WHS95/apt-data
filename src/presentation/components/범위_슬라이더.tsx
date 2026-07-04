"use client";

import { useEffect, useState } from "react";

interface 속성 {
  최소: number;
  최대: number;
  단계: number;
  현재_최소: number;
  현재_최대: number;
  변경: (최소: number, 최대: number) => void;
  포맷?: (값: number) => string;
}

export const 범위_슬라이더 = ({
  최소,
  최대,
  단계,
  현재_최소,
  현재_최대,
  변경,
  포맷 = (v) => String(v),
}: 속성) => {
  const [내부_최소, 내부_최소_설정] = useState(현재_최소);
  const [내부_최대, 내부_최대_설정] = useState(현재_최대);

  useEffect(() => {
    내부_최소_설정(현재_최소);
    내부_최대_설정(현재_최대);
  }, [현재_최소, 현재_최대]);

  const 범위 = 최대 - 최소;
  const 좌_퍼 = ((내부_최소 - 최소) / 범위) * 100;
  const 우_퍼 = ((내부_최대 - 최소) / 범위) * 100;

  return (
    <div className="px-2 pt-6 pb-4">
      <div className="relative h-2">
        {/* 트랙 */}
        <div className="absolute inset-0 bg-[var(--color-bg-mute)] rounded-full" />
        <div
          className="absolute h-full bg-[#22C55E] rounded-full"
          style={{ left: `${좌_퍼}%`, right: `${100 - 우_퍼}%` }}
        />
        {/* 좌 핸들 input */}
        <input
          type="range"
          min={최소}
          max={최대}
          step={단계}
          value={내부_최소}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), 내부_최대 - 단계);
            내부_최소_설정(v);
          }}
          onMouseUp={() => 변경(내부_최소, 내부_최대)}
          onTouchEnd={() => 변경(내부_최소, 내부_최대)}
          className="absolute inset-0 w-full h-2 appearance-none bg-transparent pointer-events-none range-thumb-left"
        />
        {/* 우 핸들 input */}
        <input
          type="range"
          min={최소}
          max={최대}
          step={단계}
          value={내부_최대}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), 내부_최소 + 단계);
            내부_최대_설정(v);
          }}
          onMouseUp={() => 변경(내부_최소, 내부_최대)}
          onTouchEnd={() => 변경(내부_최소, 내부_최대)}
          className="absolute inset-0 w-full h-2 appearance-none bg-transparent pointer-events-none range-thumb-right"
        />
      </div>

      {/* 라벨 */}
      <div className="flex justify-between mt-4 text-[11px] font-bold text-[var(--color-ink-3)]">
        <span className={내부_최소 > 최소 ? "text-[#22C55E]" : ""}>
          {내부_최소 === 최소 ? "최소" : 포맷(내부_최소)}
        </span>
        <span className={내부_최대 < 최대 ? "text-[#22C55E]" : ""}>
          {내부_최대 === 최대 ? "최대" : 포맷(내부_최대)}
        </span>
      </div>

      <style>{`
        .range-thumb-left,
        .range-thumb-right {
          z-index: 2;
        }
        .range-thumb-left::-webkit-slider-thumb,
        .range-thumb-right::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid #22C55E;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .range-thumb-left::-moz-range-thumb,
        .range-thumb-right::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid #22C55E;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};
