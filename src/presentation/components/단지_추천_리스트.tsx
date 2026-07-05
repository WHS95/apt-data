"use client";

import { useEffect, useRef, useState } from "react";
import type { 단지_추천_행 as 행_타입 } from "../../domain/통계/단지추천";
import { 단지_추천_행 } from "./단지_추천_행";

interface 속성 {
  행들: 행_타입[];
  잘림?: boolean; // true = 서버 상한(캡)에서 잘린 목록 → "상위 N개" 안내
  초기_표시?: number;
  증가?: number;
}

// 스크롤 하단 근처에서 30개씩 점진 노출(무한 스크롤).
// 필터 변경 시에는 상위(page.tsx)에서 key 로 remount 되어 표시 개수가 초기화된다.
export const 단지_추천_리스트 = ({
  행들,
  잘림 = false,
  초기_표시 = 30,
  증가 = 30,
}: 속성) => {
  const [표시_개수, 표시_개수_설정] = useState(초기_표시);
  const 감시_참조 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const 대상 = 감시_참조.current;
    if (!대상) return;
    const 관찰자 = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          표시_개수_설정((이전) => Math.min(이전 + 증가, 행들.length));
        }
      },
      { rootMargin: "400px 0px" },
    );
    관찰자.observe(대상);
    return () => 관찰자.disconnect();
  }, [행들.length, 증가]);

  const 표시_행들 = 행들.slice(0, 표시_개수);
  const 더_있음 = 표시_개수 < 행들.length;

  return (
    <>
      <ul>
        {표시_행들.map((d, i) => (
          <li key={d.단지_키}>
            <단지_추천_행 단지={d} 순위={i + 1} />
          </li>
        ))}
      </ul>

      {더_있음 ? (
        <div
          ref={감시_참조}
          className="py-5 text-center text-[12px] font-semibold text-[var(--color-ink-3)]"
        >
          불러오는 중…
        </div>
      ) : 잘림 ? (
        <div className="py-5 text-center text-[12px] font-medium text-[var(--color-ink-3)] leading-relaxed">
          상위 <span className="num font-bold">{행들.length.toLocaleString("ko-KR")}</span>개까지 표시했어요
          <br />
          <span className="text-[var(--color-ink-4)]">
            더 정확한 추천은 지역·면적·가격대 필터를 좁혀보세요
          </span>
        </div>
      ) : (
        행들.length > 초기_표시 && (
          <div className="py-5 text-center text-[12px] font-medium text-[var(--color-ink-4)]">
            총 <span className="num font-bold">{행들.length.toLocaleString("ko-KR")}</span>개 모두 표시했어요
          </div>
        )
      )}
    </>
  );
};
