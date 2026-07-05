"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

interface 속성 {
  자리표시?: string;
  기본_경로?: string;
}

export const 검색바 = ({
  자리표시 = "단지명·시군구·키워드 검색",
  기본_경로 = "/picks/detail",
}: 속성) => {
  const 라우터 = useRouter();
  const sp = useSearchParams();
  const [값, 값_설정] = useState(sp.get("q") ?? "");
  const [전환중, 시작] = useTransition();

  const 제출 = (e: React.FormEvent) => {
    e.preventDefault();
    const q = 값.trim();
    if (!q) return;
    시작(() => 라우터.push(`${기본_경로}?q=${encodeURIComponent(q)}`));
  };

  return (
    <form onSubmit={제출} className="flex items-baseline gap-3">
      <span className="eyebrow">검색</span>
      <input
        value={값}
        onChange={(e) => 값_설정(e.target.value)}
        placeholder={자리표시}
        className="flex-1 bg-transparent border-0 border-b border-b-[var(--color-ink)] py-1 text-[15px] font-medium focus:outline-none focus:border-b-[var(--color-maemae)] placeholder:text-[var(--color-ink-3)]"
      />
      <button
        type="submit"
        disabled={전환중}
        className="text-[13px] font-medium border border-[var(--color-ink)] px-4 py-1.5 hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition-colors"
      >
        조회
      </button>
    </form>
  );
};
