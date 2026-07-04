"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface 선택지 {
  값: string;
  라벨: string;
}

interface 필터_정의 {
  키: string;
  라벨: string;
  선택지: 선택지[];
  기본값?: string;
}

interface 속성 {
  필터들: 필터_정의[];
}

export const 필터바 = ({ 필터들 }: 속성) => {
  const 라우터 = useRouter();
  const 검색_파라미터 = useSearchParams();
  const [전환중, 전환_시작] = useTransition();

  const 변경 = (키: string, 값: string) => {
    const 다음 = new URLSearchParams(검색_파라미터.toString());
    if (값) 다음.set(키, 값);
    else 다음.delete(키);
    전환_시작(() => 라우터.push(`?${다음.toString()}`));
  };

  return (
    <div className="bg-[var(--color-bg)] border-b hairline">
      <div className="mx-auto max-w-[1240px] px-6 py-4 flex flex-wrap items-center gap-2">
        {필터들.map((f) => {
          const 현재 = 검색_파라미터.get(f.키) ?? f.기본값 ?? f.선택지[0]?.값;
          return (
            <div key={f.키} className="flex items-center gap-1.5">
              {f.선택지.map((o) => (
                <button
                  key={o.값}
                  onClick={() => 변경(f.키, o.값)}
                  className={`pill ${o.값 === 현재 ? "pill-active" : ""}`}
                >
                  {o.라벨}
                </button>
              ))}
              <span className="w-px h-5 bg-[var(--color-line)] mx-2 last:hidden" />
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
