import { 사용가능_쿠팡_상품 } from "../../config/쿠팡_상품";
import { 쿠팡_고지 } from "../../config/수익화";

// 신혼집 준비 맥락의 쿠팡 파트너스 큐레이션.
// 링크가 채워진 항목이 하나도 없으면 아무것도 렌더하지 않습니다(안전 기본값).
export const 쿠팡_추천 = ({ 제한 }: { 제한?: number }) => {
  const 상품들 = 사용가능_쿠팡_상품();
  if (상품들.length === 0) return null;

  const 표시 = 제한 ? 상품들.slice(0, 제한) : 상품들;

  return (
    <section className="mx-auto max-w-[1240px] px-6 pb-16">
      <div className="mb-6">
        <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">
          신혼집 준비, 여기서 한 번에
        </h2>
        <p className="mt-1 text-[14px] text-[var(--color-ink-3)] font-medium">
          첫 집 살림 · 이사 · 인테리어를 예산 안에서.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {표시.map((상품) => (
          <a
            key={상품.제목}
            href={상품.링크}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            className="toss-card p-5 flex items-start gap-4 hover:border-[var(--color-brand)] group"
          >
            <div className="w-11 h-11 shrink-0 rounded-[12px] bg-[var(--color-bg-mute)] flex items-center justify-center text-[20px]">
              {상품.아이콘}
            </div>
            <div className="min-w-0">
              <span className="pill text-[11px]">{상품.카테고리}</span>
              <div className="mt-1.5 text-[16px] font-extrabold tracking-[-0.01em] group-hover:text-[var(--color-brand)] transition-colors">
                {상품.제목}
              </div>
              <p className="mt-1 text-[13px] text-[var(--color-ink-2)] font-medium leading-relaxed">
                {상품.설명}
              </p>
            </div>
          </a>
        ))}
      </div>

      {/* 쿠팡 파트너스 필수 고지 */}
      <p className="mt-4 text-[12px] text-[var(--color-ink-3)] leading-relaxed">
        {쿠팡_고지}
      </p>
    </section>
  );
};
