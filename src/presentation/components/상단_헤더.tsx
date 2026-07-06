"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 기능별 3그룹: 탐색 / 지역·시장 / 상세·이벤트
const 네비_그룹: { 라벨: string; 경로: string }[][] = [
  [
    { 라벨: "홈", 경로: "/" },
    { 라벨: "단지추천", 경로: "/picks" },
    { 라벨: "관심", 경로: "/favorites" },
  ],
  [
    { 라벨: "서울지도", 경로: "/seoul-map" },
    { 라벨: "상승신호", 경로: "/signal" },
    { 라벨: "수도권", 경로: "/buyzone" },
    { 라벨: "권역비교", 경로: "/region" },
    { 라벨: "평형상승", 경로: "/size-trend" },
    { 라벨: "전세가율", 경로: "/jeonse" },
  ],
  [
    { 라벨: "예산매물", 경로: "/budget" },
    { 라벨: "단지추이", 경로: "/trend" },
    { 라벨: "분양캘린더", 경로: "/presale" },
  ],
];

export const 상단_헤더 = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-bg)]/95 backdrop-blur-sm border-b hairline">
      <div className="mx-auto max-w-[1240px] px-6 h-[60px] flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[var(--color-brand)] flex items-center justify-center">
              <span className="text-white text-[14px] font-extrabold">한</span>
            </span>
            <span className="text-[18px] font-extrabold tracking-tight">
              한지
              <span className="text-[var(--color-brand)]">.</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-0.5">
            {네비_그룹.map((그룹, 그룹_i) => (
              <div key={그룹_i} className="flex items-center gap-0.5">
                {그룹_i > 0 && (
                  <span className="w-px h-4 bg-[var(--color-line)] mx-2" />
                )}
                {그룹.map((n) => {
                  const 활성 =
                    n.경로 === "/"
                      ? pathname === "/"
                      : pathname.startsWith(n.경로);
                  return (
                    <Link
                      key={n.경로}
                      href={n.경로}
                      className={`px-2.5 py-1.5 rounded-lg text-[14px] font-bold transition-colors ${
                        활성
                          ? "text-[var(--color-ink)] bg-[var(--color-bg-mute)]"
                          : "text-[var(--color-ink-3)] hover:text-[var(--color-ink)] hover:bg-[var(--color-bg-soft)]"
                      }`}
                    >
                      {n.라벨}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="text-[13px] font-semibold text-[var(--color-ink-2)] hover:text-[var(--color-ink)] px-3 py-1.5 rounded-lg hover:bg-[var(--color-bg-mute)] transition-colors"
          >
            관리자
          </Link>
        </div>
      </div>
    </header>
  );
};
