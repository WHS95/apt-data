interface 속성 {
  번호?: string;
  도장_글자?: string;
  제목: string;
  부제: string;
  설명?: string;
}

export const 페이지_제목 = ({ 제목, 부제, 설명 }: 속성) => (
  <section className="border-b hairline bg-[var(--color-bg)]">
    <div className="mx-auto max-w-[1240px] px-6 pt-12 pb-10">
      <div className="text-[13px] font-bold text-[var(--color-brand)] mb-2">
        {부제}
      </div>
      <h1 className="text-[36px] md:text-[44px] leading-[1.15] font-extrabold tracking-[-0.025em]">
        {제목}
      </h1>
      {설명 && (
        <p className="mt-4 max-w-[64ch] text-[15px] text-[var(--color-ink-2)] leading-[1.65]">
          {설명}
        </p>
      )}
    </div>
  </section>
);
