"use client";

import { use_관심_단지 } from "../hooks/use_관심_단지";

interface 속성 {
  시도_코드: string;
  시군구_코드: string;
  시군구명: string;
  단지명: string;
  최근_거래가_만원?: number | null;
  크기?: "sm" | "md";
}

export const 관심_하트 = ({
  시도_코드,
  시군구_코드,
  시군구명,
  단지명,
  최근_거래가_만원,
  크기 = "sm",
}: 속성) => {
  const { 포함, 토글, 초기화됨 } = use_관심_단지();
  const 활성 = 포함(시군구_코드, 단지명);
  const 아이콘_크기 = 크기 === "md" ? 18 : 15;

  const 클릭 = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    토글({
      시도_코드,
      시군구_코드,
      시군구명,
      단지명,
      최근_거래가_만원,
    });
  };

  return (
    <button
      onClick={클릭}
      aria-label={활성 ? "관심 해제" : "관심 등록"}
      title={활성 ? "관심 해제" : "관심 등록"}
      className={`p-1.5 rounded-md hover:bg-[var(--color-bg-mute)] transition-colors ${
        초기화됨 ? "" : "opacity-0"
      }`}
    >
      <svg
        width={아이콘_크기}
        height={아이콘_크기}
        viewBox="0 0 24 24"
        fill={활성 ? "var(--color-up)" : "none"}
        stroke={활성 ? "var(--color-up)" : "var(--color-ink-4)"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
};
