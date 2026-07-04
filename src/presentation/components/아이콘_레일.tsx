"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const 아이콘들 = [
  {
    경로: "/buyzone",
    라벨: "수도권",
    아이콘: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    경로: "/picks",
    라벨: "추천",
    아이콘: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    경로: "/trend",
    라벨: "추이",
    아이콘: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    경로: "/jeonse",
    라벨: "전세",
    아이콘: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    경로: "/budget",
    라벨: "예산",
    아이콘: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];

export const 아이콘_레일 = () => {
  const pathname = usePathname();
  return (
    <nav className="hidden xl:flex flex-col items-center gap-1 w-[56px] flex-shrink-0 border-l hairline bg-[var(--color-bg)] sticky top-[60px] h-[calc(100vh-60px)] py-3">
      {아이콘들.map((it) => {
        const 활성 = pathname.startsWith(it.경로);
        return (
          <Link
            key={it.경로}
            href={it.경로}
            className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl w-[46px] transition-colors ${
              활성
                ? "bg-[var(--color-bg-mute)] text-[var(--color-ink)]"
                : "text-[var(--color-ink-3)] hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-ink)]"
            }`}
          >
            {it.아이콘}
            <span className="text-[10px] font-bold leading-none">{it.라벨}</span>
          </Link>
        );
      })}
      <div className="flex-1" />
      <Link
        href="/admin"
        className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl w-[46px] transition-colors ${
          pathname.startsWith("/admin")
            ? "bg-[var(--color-bg-mute)] text-[var(--color-ink)]"
            : "text-[var(--color-ink-3)] hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-ink)]"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span className="text-[10px] font-bold leading-none">관리</span>
      </Link>
    </nav>
  );
};
