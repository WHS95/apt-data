"use client";

import Link from "next/link";
import { use_관심_단지, type 관심_단지 } from "../hooks/use_관심_단지";

const 시도_색 = (코드: string): string => {
  switch (코드) {
    case "11000":
      return "bg-[var(--color-up-soft)] text-[var(--color-up)]";
    case "41000":
      return "bg-[var(--color-brand-soft)] text-[var(--color-brand)]";
    case "28000":
      return "bg-[var(--color-down-soft)] text-[var(--color-down)]";
    case "26000":
      return "bg-[var(--color-warn-soft)] text-[var(--color-warn)]";
    default:
      return "bg-[var(--color-bg-mute)] text-[var(--color-ink-2)]";
  }
};

const 시도_약칭 = (코드: string): string => {
  switch (코드) {
    case "11000":
      return "서울";
    case "41000":
      return "경기";
    case "28000":
      return "인천";
    case "26000":
      return "부산";
    default:
      return 코드;
  }
};

const 가격_요약 = (만원: number | null | undefined): string => {
  if (만원 == null) return "—";
  if (만원 >= 10000) {
    const 억 = Math.floor(만원 / 10000);
    const 천 = Math.round((만원 % 10000) / 1000);
    return 천 > 0 ? `${억}억 ${천}천` : `${억}억`;
  }
  return `${만원.toLocaleString("ko-KR")}만`;
};

const 상대_시간 = (ms: number): string => {
  const 차 = Date.now() - ms;
  const 분 = Math.floor(차 / (60 * 1000));
  if (분 < 1) return "방금";
  if (분 < 60) return `${분}분 전`;
  const 시간 = Math.floor(분 / 60);
  if (시간 < 24) return `${시간}시간 전`;
  const 일 = Math.floor(시간 / 24);
  return `${일}일 전`;
};

const 관심_행 = ({ 단지, 제거 }: { 단지: 관심_단지; 제거: () => void }) => (
  <li className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--color-bg-mute)] transition-colors">
    <Link
      href={`/picks/detail?sgg=${단지.시군구_코드}&name=${encodeURIComponent(단지.단지명)}`}
      className="flex items-center gap-3 flex-1 min-w-0"
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 ${시도_색(단지.시도_코드)}`}
      >
        {시도_약칭(단지.시도_코드).slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold truncate leading-tight">
          {단지.단지명}
        </div>
        <div className="text-[10px] text-[var(--color-ink-3)] mt-0.5 font-medium truncate">
          {단지.시군구명} · {상대_시간(단지.추가_시각)}
        </div>
      </div>
      {단지.최근_거래가_만원 != null && (
        <div className="text-right flex-shrink-0">
          <div className="text-[13px] font-extrabold num">
            {가격_요약(단지.최근_거래가_만원)}
          </div>
        </div>
      )}
    </Link>
    <button
      onClick={제거}
      aria-label="관심 해제"
      title="관심 해제"
      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--color-bg-deep)] transition-opacity"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-ink-3)]">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </li>
);

export const 우측_패널 = () => {
  const { 목록, 제거, 초기화됨 } = use_관심_단지();

  return (
    <aside className="hidden xl:block w-[260px] flex-shrink-0 border-l hairline bg-[var(--color-bg)] sticky top-[60px] h-[calc(100vh-60px)] overflow-y-auto">
      <div className="px-5 py-4 border-b hairline flex items-baseline justify-between sticky top-0 bg-[var(--color-bg)]/95 backdrop-blur z-10">
        <div>
          <h3 className="text-[15px] font-extrabold tracking-tight">관심 단지</h3>
          <div className="text-[10px] text-[var(--color-ink-3)] font-medium mt-0.5">
            {초기화됨 ? (
              <>
                <span className="num font-bold text-[var(--color-ink-2)]">
                  {목록.length}
                </span>
                개 저장됨
              </>
            ) : (
              "불러오는 중"
            )}
          </div>
        </div>
        <span className="text-[10px] font-bold text-[var(--color-ink-3)]">브라우저 저장</span>
      </div>

      <div className="px-5 py-4 border-b hairline bg-[var(--color-bg-soft)]">
        <Link
          href="/favorites"
          className="flex items-center gap-2 text-[13px] text-[var(--color-brand)] font-bold"
        >
          <span className="w-4 h-4 rounded bg-[var(--color-brand)] text-white text-[10px] flex items-center justify-center font-extrabold">
            →
          </span>
          관심 단지 전체 보기 · 메모 · 시세
          <span className="ml-auto text-[var(--color-ink-3)]">›</span>
        </Link>
        <div className="text-[11px] text-[var(--color-ink-2)] mt-1 leading-tight">
          리스트에서 ♥ 눌러 추가하면 여기 저장됩니다.
        </div>
      </div>

      {초기화됨 && 목록.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-ink-4)"
            strokeWidth="1.5"
            className="mx-auto mb-3"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <div className="text-[13px] font-extrabold text-[var(--color-ink-2)] mb-1">
            관심 단지가 없습니다
          </div>
          <div className="text-[11px] text-[var(--color-ink-3)] font-medium leading-relaxed">
            리스트에서 마음에 드는 단지의
            <br />
            하트 아이콘을 눌러 추가하세요.
          </div>
        </div>
      ) : (
        <ul className="px-2 py-2">
          {목록.map((d) => (
            <관심_행
              key={`${d.시군구_코드}|${d.단지명}`}
              단지={d}
              제거={() => 제거(d.시군구_코드, d.단지명)}
            />
          ))}
        </ul>
      )}
    </aside>
  );
};
