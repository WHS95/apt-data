interface 만원_표시_속성 {
  만원: number | null | undefined;
  강조?: boolean;
}

export const 만원_표시 = ({ 만원, 강조 = false }: 만원_표시_속성) => {
  if (만원 == null) {
    return <span className="num text-[var(--color-ink-4)]">—</span>;
  }
  if (만원 >= 10000) {
    const 억 = Math.floor(만원 / 10000);
    const 천 = Math.floor((만원 % 10000) / 1000);
    return (
      <span className={`num ${강조 ? "text-[20px] font-extrabold" : "font-bold"}`}>
        {억.toLocaleString("ko-KR")}
        <span className="text-[var(--color-ink-3)] text-[0.7em] font-bold ml-0.5">억</span>
        {천 > 0 && (
          <>
            {" "}{천}
            <span className="text-[var(--color-ink-3)] text-[0.7em] font-bold ml-0.5">천</span>
          </>
        )}
      </span>
    );
  }
  return (
    <span className={`num ${강조 ? "text-[20px] font-extrabold" : "font-bold"}`}>
      {만원.toLocaleString("ko-KR")}
      <span className="text-[var(--color-ink-3)] text-[0.7em] font-bold ml-0.5">만</span>
    </span>
  );
};

interface 비율_속성 {
  값: number | null | undefined;
}

export const 비율_표시 = ({ 값 }: 비율_속성) => {
  if (값 == null) return <span className="num text-[var(--color-ink-4)]">—</span>;
  const 색 =
    값 >= 80
      ? "text-[var(--color-warn)]"
      : 값 <= 55
        ? "text-[var(--color-down)]"
        : "text-[var(--color-ink)]";
  return <span className={`num font-bold ${색}`}>{값.toFixed(1)}%</span>;
};

/** 등락률 — 토스 스타일 알약 */
export const 등락_배지 = ({ 퍼센트 }: { 퍼센트: number | null | undefined }) => {
  if (퍼센트 == null)
    return <span className="delta-pill delta-pill-flat num">—</span>;
  if (Math.abs(퍼센트) < 0.1)
    return <span className="delta-pill delta-pill-flat num">0.0%</span>;
  const 상승 = 퍼센트 > 0;
  return (
    <span className={`delta-pill ${상승 ? "delta-pill-up" : "delta-pill-down"} num`}>
      {상승 ? "▲" : "▼"} {Math.abs(퍼센트).toFixed(1)}%
    </span>
  );
};
