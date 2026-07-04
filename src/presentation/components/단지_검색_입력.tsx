"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface 속성 {
  기본값: string;
}

export const 단지_검색_입력 = ({ 기본값 }: 속성) => {
  const 라우터 = useRouter();
  const [값, 값_설정] = useState(기본값);

  const 제출 = (e: React.FormEvent) => {
    e.preventDefault();
    const 정리 = 값.trim();
    if (!정리) return;
    라우터.push(`/trend?단지=${encodeURIComponent(정리)}`);
  };

  return (
    <form onSubmit={제출} className="flex items-baseline gap-3">
      <span className="eyebrow">단지명</span>
      <input
        value={값}
        onChange={(e) => 값_설정(e.target.value)}
        placeholder="예: 래미안 강남, 송도 더샵, 광교 푸르지오..."
        className="flex-1 bg-transparent border-0 border-b border-b-[var(--color-ink)] py-1 text-[16px] font-medium focus:outline-none focus:border-b-[var(--color-maemae)] placeholder:text-[var(--color-ink-3)]"
      />
      <button
        type="submit"
        className="text-[13px] font-medium border border-[var(--color-ink)] px-4 py-1.5 hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition-colors"
      >
        조회
      </button>
    </form>
  );
};
