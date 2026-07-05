"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { 범위_슬라이더 } from "./범위_슬라이더";

export interface 옵션 {
  값: string;
  라벨: string;
  설명?: string;
}

export interface 칩_필터 {
  종류: "칩";
  키: string;
  옵션들: 옵션[];
  기본값: string;
}

export interface 드롭다운_필터 {
  종류: "드롭다운";
  키: string;
  라벨: string;
  옵션들: 옵션[];
  기본값: string;
  그리드열?: 2 | 3 | 4;
  우측정렬?: boolean; // 최우측 필터: 패널을 오른쪽 기준으로 열어 사이드바 침범 방지
}

export interface 다중_드롭다운_필터 {
  종류: "다중_드롭다운";
  키: string;
  라벨: string;
  옵션들: 옵션[]; // "전체" 항목은 자동 추가됨
  그리드열?: 2 | 3 | 4;
}

export interface 구분 {
  종류: "구분";
}

export interface 범위_필터 {
  종류: "범위";
  키: string;
  라벨: string;
  최소: number;
  최대: number;
  단계: number;
  단위_유형: "면적" | "가격" | "정수";
  프리셋?: Array<{ 라벨: string; 최소: number; 최대: number }>;
}

const 면적_포맷 = (m2: number): string => {
  const 평 = Math.round(m2 / 3.305785);
  return `${m2}㎡(${평}평)`;
};

const 가격_포맷 = (만원: number): string => {
  if (만원 >= 10000) {
    const 억 = Math.floor(만원 / 10000);
    const 천 = Math.round((만원 % 10000) / 1000);
    return 천 > 0 ? `${억}억 ${천}천` : `${억}억`;
  }
  return `${만원.toLocaleString("ko-KR")}만`;
};

const 포맷_선택 = (유형: "면적" | "가격" | "정수") => {
  if (유형 === "면적") return 면적_포맷;
  if (유형 === "가격") return 가격_포맷;
  return (v: number) => v.toLocaleString("ko-KR");
};

export type 필터 =
  | 칩_필터
  | 드롭다운_필터
  | 다중_드롭다운_필터
  | 범위_필터
  | 구분;

interface 속성 {
  필터들: 필터[];
}

const 스플릿 = (값: string): string[] =>
  값
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const 네이버_스타일_필터 = ({ 필터들 }: 속성) => {
  const 라우터 = useRouter();
  const sp = useSearchParams();
  const [전환중, 시작] = useTransition();
  const [열린, 열린_설정] = useState<string | null>(null);
  const 컨테이너_참조 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const 핸들러 = (e: MouseEvent) => {
      if (
        컨테이너_참조.current &&
        !컨테이너_참조.current.contains(e.target as Node)
      ) {
        열린_설정(null);
      }
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") 열린_설정(null);
    };
    document.addEventListener("mousedown", 핸들러);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", 핸들러);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const 변경 = (키: string, 값: string) => {
    const 다음 = new URLSearchParams(sp.toString());
    if (값) 다음.set(키, 값);
    else 다음.delete(키);
    시작(() => 라우터.push(`?${다음.toString()}`));
  };

  return (
    <div
      ref={컨테이너_참조}
      className="bg-[var(--color-bg)] border-b hairline relative"
    >
      <div className="mx-auto max-w-[1400px] px-6 py-3 flex flex-wrap items-center gap-2">
        {필터들.map((f, 색인) => {
          if (f.종류 === "구분") {
            return (
              <span
                key={`div-${색인}`}
                className="w-px h-5 bg-[var(--color-line)] mx-2"
              />
            );
          }

          if (f.종류 === "칩") {
            const 현재 = sp.get(f.키) ?? f.기본값;
            return (
              <div key={f.키} className="flex items-center gap-1.5">
                {f.옵션들.map((o) => {
                  const 활성 = o.값 === 현재;
                  return (
                    <button
                      key={o.값}
                      onClick={() => 변경(f.키, o.값)}
                      className={`flex items-center gap-1 px-3.5 py-2 rounded-lg text-[13px] font-bold border transition-colors ${
                        활성
                          ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                          : "border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-ink-2)] hover:border-[var(--color-line-strong)]"
                      }`}
                    >
                      {활성 && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {o.라벨}
                    </button>
                  );
                })}
              </div>
            );
          }

          if (f.종류 === "다중_드롭다운") {
            return (
              <다중_드롭다운_트리거
                key={f.키}
                필터={f}
                열림={열린 === f.키}
                토글={() => 열린_설정(열린 === f.키 ? null : f.키)}
                닫기={() => 열린_설정(null)}
                현재값={sp.get(f.키) ?? ""}
                적용={(값) => 변경(f.키, 값)}
              />
            );
          }

          if (f.종류 === "범위") {
            return (
              <범위_트리거
                key={f.키}
                필터={f}
                열림={열린 === f.키}
                토글={() => 열린_설정(열린 === f.키 ? null : f.키)}
                닫기={() => 열린_설정(null)}
                현재값={sp.get(f.키) ?? ""}
                적용={(값) => 변경(f.키, 값)}
              />
            );
          }

          // 단일 드롭다운
          const 현재값 = sp.get(f.키) ?? f.기본값;
          const 현재_옵션 =
            f.옵션들.find((o) => o.값 === 현재값) ?? f.옵션들[0];
          const 열림 = 열린 === f.키;
          const 기본_여부 = 현재값 === f.기본값;

          return (
            <div key={f.키} className="relative">
              <button
                onClick={() => 열린_설정(열림 ? null : f.키)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-bold border transition-colors ${
                  열림 || !기본_여부
                    ? "border-[var(--color-ink)] bg-[var(--color-bg)] text-[var(--color-ink)]"
                    : "border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-ink-2)] hover:border-[var(--color-line-strong)]"
                }`}
              >
                <span className="text-[var(--color-ink-3)]">{f.라벨}</span>
                {!기본_여부 && (
                  <span className="text-[var(--color-brand)]">
                    {현재_옵션.라벨}
                  </span>
                )}
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${열림 ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {열림 && (
                <div
                  className={`absolute top-[calc(100%+8px)] z-30 min-w-[280px] toss-card p-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)] ${
                    f.우측정렬 ? "right-0" : "left-0"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 pb-3 border-b hairline">
                    <h4 className="text-[14px] font-extrabold tracking-tight">
                      {f.라벨}
                    </h4>
                    <button
                      onClick={() => 열린_설정(null)}
                      className="text-[var(--color-ink-3)] hover:text-[var(--color-ink)] w-5 h-5 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                  <div
                    className={`grid gap-1.5 ${
                      f.그리드열 === 4
                        ? "grid-cols-4"
                        : f.그리드열 === 3
                          ? "grid-cols-3"
                          : "grid-cols-2"
                    }`}
                  >
                    {f.옵션들.map((o) => {
                      const 활성 = o.값 === 현재값;
                      return (
                        <button
                          key={o.값}
                          onClick={() => {
                            변경(f.키, o.값);
                            열린_설정(null);
                          }}
                          className={`px-3 py-2.5 rounded-lg text-[13px] font-bold border transition-colors text-center ${
                            활성
                              ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                              : "border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-ink-2)] hover:bg-[var(--color-bg-soft)]"
                          }`}
                        >
                          <span className="block">{o.라벨}</span>
                          {o.설명 && (
                            <span className="block text-[10px] font-medium text-[var(--color-ink-3)] mt-0.5 leading-tight">
                              {o.설명}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {!기본_여부 && (
                    <button
                      onClick={() => {
                        변경(f.키, f.기본값);
                        열린_설정(null);
                      }}
                      className="flex items-center gap-1.5 mt-4 pt-3 border-t hairline w-full justify-center text-[12px] text-[var(--color-ink-3)] hover:text-[var(--color-ink)] font-bold"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                      조건 해제
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {전환중 && (
          <span className="text-[12px] font-semibold text-[var(--color-brand)] ml-2">
            불러오는 중…
          </span>
        )}
      </div>
    </div>
  );
};

// 범위 슬라이더 트리거 + popover
const 범위_트리거 = ({
  필터,
  열림,
  토글,
  닫기,
  현재값,
  적용,
}: {
  필터: 범위_필터;
  열림: boolean;
  토글: () => void;
  닫기: () => void;
  현재값: string;
  적용: (값: string) => void;
}) => {
  const 포맷 = 포맷_선택(필터.단위_유형);
  const 파싱 = useMemo(() => {
    if (!현재값) return { 최소: 필터.최소, 최대: 필터.최대 };
    const [최소_s, 최대_s] = 현재값.split("-");
    const 최소 = Number(최소_s);
    const 최대 = Number(최대_s);
    return {
      최소: Number.isFinite(최소) ? 최소 : 필터.최소,
      최대: Number.isFinite(최대) ? 최대 : 필터.최대,
    };
  }, [현재값, 필터.최소, 필터.최대]);

  const [임시_최소, 임시_최소_설정] = useState(파싱.최소);
  const [임시_최대, 임시_최대_설정] = useState(파싱.최대);

  useEffect(() => {
    if (열림) {
      임시_최소_설정(파싱.최소);
      임시_최대_설정(파싱.최대);
    }
  }, [열림, 파싱.최소, 파싱.최대]);

  const 활성 = 파싱.최소 > 필터.최소 || 파싱.최대 < 필터.최대;

  const 적용_클릭 = () => {
    if (임시_최소 === 필터.최소 && 임시_최대 === 필터.최대) {
      적용("");
    } else {
      적용(`${임시_최소}-${임시_최대}`);
    }
    닫기();
  };

  const 해제 = () => {
    임시_최소_설정(필터.최소);
    임시_최대_설정(필터.최대);
  };

  const 라벨_요약 = (() => {
    if (!활성) return null;
    const 최소_라벨 = 파싱.최소 > 필터.최소 ? 포맷(파싱.최소) : "최소";
    const 최대_라벨 = 파싱.최대 < 필터.최대 ? 포맷(파싱.최대) : "최대";
    return `${최소_라벨}~${최대_라벨}`;
  })();

  return (
    <div className="relative">
      <button
        onClick={토글}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-bold border transition-colors ${
          열림 || 활성
            ? "border-[var(--color-ink)] bg-[var(--color-bg)] text-[var(--color-ink)]"
            : "border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-ink-2)] hover:border-[var(--color-line-strong)]"
        }`}
      >
        <span className="text-[var(--color-ink-3)]">{필터.라벨}</span>
        {활성 && (
          <span className="text-[var(--color-brand)] num">{라벨_요약}</span>
        )}
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${열림 ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {열림 && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-30 w-[440px] toss-card p-5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[14px] font-extrabold tracking-tight">
              {필터.라벨}
            </h4>
            <button
              onClick={닫기}
              className="text-[var(--color-ink-3)] hover:text-[var(--color-ink)] w-5 h-5 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* 현재 선택 표시 */}
          <div className="text-center text-[14px] font-extrabold text-[#22C55E] mb-1 num">
            {임시_최소 === 필터.최소 && 임시_최대 === 필터.최대
              ? `전체 ${필터.라벨}`
              : `${임시_최소 === 필터.최소 ? "최소" : 포맷(임시_최소)} ~ ${
                  임시_최대 === 필터.최대 ? "최대" : 포맷(임시_최대)
                }`}
          </div>

          {/* 슬라이더 */}
          <범위_슬라이더
            최소={필터.최소}
            최대={필터.최대}
            단계={필터.단계}
            현재_최소={임시_최소}
            현재_최대={임시_최대}
            변경={(최소_v, 최대_v) => {
              임시_최소_설정(최소_v);
              임시_최대_설정(최대_v);
            }}
            포맷={포맷}
          />

          {/* 빠른 선택 프리셋 */}
          {필터.프리셋 && 필터.프리셋.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5 mt-3">
              {필터.프리셋.map((p) => {
                const 활성_프리셋 =
                  임시_최소 === p.최소 && 임시_최대 === p.최대;
                return (
                  <button
                    key={p.라벨}
                    onClick={() => {
                      임시_최소_설정(p.최소);
                      임시_최대_설정(p.최대);
                    }}
                    className={`px-2 py-2 rounded-lg text-[12px] font-bold border transition-colors ${
                      활성_프리셋
                        ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                        : "border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-ink-2)] hover:bg-[var(--color-bg-soft)]"
                    }`}
                  >
                    {p.라벨}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2 mt-4 pt-3 border-t hairline">
            <button onClick={해제} className="flex-1 btn-ghost">
              조건 해제
            </button>
            <button onClick={적용_클릭} className="flex-[2] btn-primary">
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 다중 드롭다운 트리거 + popover
const 다중_드롭다운_트리거 = ({
  필터,
  열림,
  토글,
  닫기,
  현재값,
  적용,
}: {
  필터: 다중_드롭다운_필터;
  열림: boolean;
  토글: () => void;
  닫기: () => void;
  현재값: string;
  적용: (값: string) => void;
}) => {
  const 초기_선택 = useMemo(() => 스플릿(현재값), [현재값]);
  const [임시_선택, 임시_선택_설정] = useState<string[]>(초기_선택);

  // popover 열릴 때 외부 상태로 초기화
  useEffect(() => {
    if (열림) 임시_선택_설정(초기_선택);
  }, [열림, 초기_선택]);

  const 토글_옵션 = (값: string) => {
    임시_선택_설정((이전) =>
      이전.includes(값) ? 이전.filter((v) => v !== 값) : [...이전, 값],
    );
  };

  const 적용_클릭 = () => {
    적용(임시_선택.join(","));
    닫기();
  };

  const 전체_해제 = () => {
    임시_선택_설정([]);
  };

  const 선택_개수 = 초기_선택.length;
  const 활성_표시 = 선택_개수 > 0;
  const 첫_라벨 =
    선택_개수 > 0
      ? 필터.옵션들.find((o) => o.값 === 초기_선택[0])?.라벨 ?? 초기_선택[0]
      : null;

  return (
    <div className="relative">
      <button
        onClick={토글}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-bold border transition-colors ${
          열림 || 활성_표시
            ? "border-[var(--color-ink)] bg-[var(--color-bg)] text-[var(--color-ink)]"
            : "border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-ink-2)] hover:border-[var(--color-line-strong)]"
        }`}
      >
        <span className="text-[var(--color-ink-3)]">{필터.라벨}</span>
        {활성_표시 && (
          <span className="text-[var(--color-brand)]">
            {첫_라벨}
            {선택_개수 > 1 && (
              <span className="ml-1 text-[11px]">+{선택_개수 - 1}</span>
            )}
          </span>
        )}
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${열림 ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {열림 && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-30 min-w-[520px] max-w-[640px] toss-card p-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between mb-3 pb-3 border-b hairline">
            <div className="flex items-baseline gap-2">
              <h4 className="text-[14px] font-extrabold tracking-tight">
                {필터.라벨}
              </h4>
              <span className="text-[12px] font-bold text-[var(--color-brand)]">
                {임시_선택.length}개 선택
              </span>
            </div>
            <button
              onClick={닫기}
              className="text-[var(--color-ink-3)] hover:text-[var(--color-ink)] w-5 h-5 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          <div
            className={`grid gap-1.5 max-h-[320px] overflow-y-auto ${
              필터.그리드열 === 4
                ? "grid-cols-4"
                : 필터.그리드열 === 3
                  ? "grid-cols-3"
                  : "grid-cols-2"
            }`}
          >
            {필터.옵션들.map((o) => {
              const 활성 = 임시_선택.includes(o.값);
              return (
                <button
                  key={o.값}
                  onClick={() => 토글_옵션(o.값)}
                  className={`px-3 py-2 rounded-lg text-[12px] font-bold border transition-colors text-center flex items-center justify-center gap-1 ${
                    활성
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                      : "border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-ink-2)] hover:bg-[var(--color-bg-soft)]"
                  }`}
                >
                  {활성 && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {o.라벨}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t hairline">
            <button
              onClick={전체_해제}
              className="flex-1 btn-ghost"
            >
              전체 해제
            </button>
            <button onClick={적용_클릭} className="flex-[2] btn-primary">
              {임시_선택.length > 0 ? `${임시_선택.length}개 적용` : "적용"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
