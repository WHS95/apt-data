"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { use_관심_단지 } from "../../presentation/hooks/use_관심_단지";
import { 만원_표시, 등락_배지 } from "../../presentation/components/숫자_표시";
import { 스파크라인 } from "../../presentation/components/스파크라인";

interface 시세_행 {
  시군구_코드: string;
  단지명: string;
  최근_거래가_만원: number | null;
  최근_거래일: string | null;
  월별_평균가: Array<{ 년월: string; 평균_만원: number }>;
  거래_건수: number;
  변화_6개월_퍼센트: number | null;
  이상치_제외_최신가: number | null;
}

const 시도_색 = (코드: string): string => {
  switch (코드) {
    case "11000":
      return "bg-[var(--color-up-soft)] text-[var(--color-up)]";
    case "41000":
      return "bg-[var(--color-brand-soft)] text-[var(--color-brand)]";
    case "28000":
      return "bg-[var(--color-down-soft)] text-[var(--color-down)]";
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

export default function 관심_페이지() {
  const { 목록, 제거, 메모_설정, 초기화됨 } = use_관심_단지();
  const [시세_맵, 시세_맵_설정] = useState<Map<string, 시세_행>>(new Map());
  const [로딩, 로딩_설정] = useState(false);

  const 시세_로드 = useCallback(async () => {
    if (목록.length === 0) {
      시세_맵_설정(new Map());
      return;
    }
    로딩_설정(true);
    try {
      const 응답 = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          단지들: 목록.map((d) => ({
            시군구_코드: d.시군구_코드,
            단지명: d.단지명,
          })),
        }),
      });
      const json = await 응답.json();
      const 새_맵 = new Map<string, 시세_행>();
      for (const 행 of json.데이터 as 시세_행[]) {
        새_맵.set(`${행.시군구_코드}|${행.단지명}`, 행);
      }
      시세_맵_설정(새_맵);
    } finally {
      로딩_설정(false);
    }
  }, [목록]);

  useEffect(() => {
    시세_로드();
  }, [시세_로드]);

  // 30초마다 자동 갱신
  useEffect(() => {
    const id = setInterval(시세_로드, 30 * 1000);
    return () => clearInterval(id);
  }, [시세_로드]);

  return (
    <>
      <section className="border-b hairline bg-[var(--color-bg)]">
        <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-3">
          <div className="text-[12px] font-bold text-[var(--color-brand)] mb-1">
            FAVORITES · 관심 단지 · 브라우저 저장
          </div>
          <div className="flex items-end justify-between flex-wrap gap-y-2">
            <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">
              관심 단지
            </h1>
            <div className="flex items-center gap-3">
              <div className="text-[12px] text-[var(--color-ink-3)] font-medium">
                {초기화됨 ? (
                  <>
                    <span className="num font-extrabold text-[var(--color-ink)]">
                      {목록.length}
                    </span>
                    개 저장
                    {로딩 && <span className="ml-2 text-[var(--color-brand)]">갱신 중…</span>}
                  </>
                ) : (
                  "불러오는 중"
                )}
              </div>
              <button onClick={시세_로드} className="btn-ghost">
                시세 새로고침
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-6">
        {초기화됨 && 목록.length === 0 ? (
          <div className="toss-card p-16 text-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-ink-4)"
              strokeWidth="1.5"
              className="mx-auto mb-4"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <div className="text-[16px] font-extrabold text-[var(--color-ink)] mb-2">
              관심 단지가 없습니다
            </div>
            <div className="text-[13px] text-[var(--color-ink-3)] font-medium mb-6">
              추천 리스트에서 마음에 드는 단지를 골라 하트를 눌러보세요.
            </div>
            <Link href="/picks" className="btn-primary inline-flex">
              추천 리스트로 이동
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {목록.map((d) => {
              const 시세 = 시세_맵.get(`${d.시군구_코드}|${d.단지명}`) ?? null;
              const 표시가 =
                시세?.이상치_제외_최신가 ?? 시세?.최근_거래가_만원 ?? null;
              return (
                <관심_카드
                  key={`${d.시군구_코드}|${d.단지명}`}
                  단지={d}
                  시세={시세}
                  표시가={표시가}
                  제거={() => 제거(d.시군구_코드, d.단지명)}
                  메모_저장={(메모) => 메모_설정(d.시군구_코드, d.단지명, 메모)}
                />
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

/* ─────────────── 개별 카드 ─────────────── */

const 관심_카드 = ({
  단지,
  시세,
  표시가,
  제거,
  메모_저장,
}: {
  단지: ReturnType<typeof use_관심_단지>["목록"][number];
  시세: 시세_행 | null;
  표시가: number | null;
  제거: () => void;
  메모_저장: (메모: string) => void;
}) => {
  const [메모_임시, 메모_임시_설정] = useState(단지.메모 ?? "");
  const [편집, 편집_설정] = useState(false);
  const 저장_예약 = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    메모_임시_설정(단지.메모 ?? "");
  }, [단지.메모]);

  const 저장 = (값: string) => {
    if (저장_예약.current) clearTimeout(저장_예약.current);
    저장_예약.current = setTimeout(() => 메모_저장(값), 300);
  };

  const 상세_경로 = `/picks/detail?sgg=${단지.시군구_코드}&name=${encodeURIComponent(단지.단지명)}`;

  return (
    <div className="toss-card overflow-hidden flex flex-col">
      <header className="px-5 pt-4 pb-3 flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-extrabold flex-shrink-0 ${시도_색(단지.시도_코드)}`}
        >
          {시도_약칭(단지.시도_코드).slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <Link
            href={상세_경로}
            className="text-[15px] font-extrabold tracking-tight truncate block hover:text-[var(--color-brand)] transition-colors"
          >
            {단지.단지명}
          </Link>
          <div className="text-[11px] text-[var(--color-ink-3)] mt-0.5 font-medium">
            {단지.시군구명}
          </div>
        </div>
        <button
          onClick={제거}
          aria-label="관심 해제"
          title="관심 해제"
          className="p-1.5 rounded-md hover:bg-[var(--color-bg-mute)] transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="var(--color-up)"
            stroke="var(--color-up)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </header>

      {/* 시세 */}
      <div className="px-5 pb-4">
        <div className="text-[11px] font-bold text-[var(--color-ink-3)]">
          최신 정상 거래가
        </div>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="text-[22px] font-extrabold">
            <만원_표시 만원={표시가} 강조 />
          </span>
          {시세?.변화_6개월_퍼센트 != null && Math.abs(시세.변화_6개월_퍼센트) >= 0.1 && (
            <등락_배지 퍼센트={시세.변화_6개월_퍼센트} />
          )}
        </div>
        <div className="text-[11px] text-[var(--color-ink-3)] mt-1 num font-medium">
          {시세?.최근_거래일 ? (
            <>
              최근 거래 {시세.최근_거래일} · 1년 {시세.거래_건수}건
            </>
          ) : (
            <span className="text-[var(--color-ink-4)]">최근 1년 거래 없음</span>
          )}
        </div>
        <div className="mt-2 -ml-1">
          <스파크라인
            값들={시세?.월별_평균가.map((m) => m.평균_만원) ?? []}
            너비={280}
            높이={40}
            색={
              (시세?.변화_6개월_퍼센트 ?? 0) >= 0
                ? "var(--color-up)"
                : "var(--color-down)"
            }
          />
        </div>
      </div>

      {/* 메모 */}
      <div className="px-5 pb-4 pt-3 border-t hairline bg-[var(--color-bg-soft)] flex-1">
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="text-[11px] font-bold text-[var(--color-ink-3)]">
            메모 · 왜 이 단지인가?
          </div>
          {!편집 && (
            <button
              onClick={() => 편집_설정(true)}
              className="text-[11px] font-bold text-[var(--color-brand)] hover:underline"
            >
              {단지.메모 ? "수정" : "추가"}
            </button>
          )}
        </div>
        {편집 ? (
          <textarea
            value={메모_임시}
            onChange={(e) => {
              메모_임시_설정(e.target.value);
              저장(e.target.value);
            }}
            onBlur={() => {
              메모_저장(메모_임시);
              편집_설정(false);
            }}
            autoFocus
            rows={3}
            placeholder="예: 초등학교 도보 5분, 남향, 매매가 -20%…"
            className="w-full bg-[var(--color-bg)] border border-[var(--color-line-strong)] rounded-lg p-2.5 text-[13px] font-medium leading-relaxed resize-none focus:outline-none focus:border-[var(--color-brand)]"
          />
        ) : 단지.메모 ? (
          <div
            className="text-[13px] font-medium text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap cursor-text"
            onClick={() => 편집_설정(true)}
          >
            {단지.메모}
          </div>
        ) : (
          <div
            className="text-[12px] font-medium text-[var(--color-ink-4)] italic cursor-text"
            onClick={() => 편집_설정(true)}
          >
            아직 메모가 없습니다. 클릭해서 추가해보세요.
          </div>
        )}
      </div>
    </div>
  );
};
