interface 속성 {
  값들: number[];
  너비?: number;
  높이?: number;
  색?: string;
}

export const 스파크라인 = ({
  값들,
  너비 = 96,
  높이 = 28,
  색 = "var(--color-ink)",
}: 속성) => {
  if (값들.length < 2) {
    return (
      <span className="inline-block text-[10px] text-[var(--color-ink-3)]">
        —
      </span>
    );
  }
  const 최소 = Math.min(...값들);
  const 최대 = Math.max(...값들);
  const 범위 = 최대 - 최소 || 1;
  const 단계 = 너비 / (값들.length - 1);
  const 좌표 = 값들
    .map((v, i) => {
      const x = i * 단계;
      const y = 높이 - ((v - 최소) / 범위) * (높이 - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const 마지막_x = (값들.length - 1) * 단계;
  const 마지막_y =
    높이 - ((값들[값들.length - 1] - 최소) / 범위) * (높이 - 4) - 2;

  return (
    <svg
      width={너비}
      height={높이}
      viewBox={`0 0 ${너비} ${높이}`}
      preserveAspectRatio="none"
      aria-label="가격 추이"
      style={{ maxWidth: "100%", display: "block" }}
    >
      <polyline
        points={좌표}
        fill="none"
        stroke={색}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx={마지막_x} cy={마지막_y} r="2" fill={색} />
    </svg>
  );
};
