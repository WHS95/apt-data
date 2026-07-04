interface 속성 {
  점수들: number[];
  라벨들?: string[];
  크기?: number;
  색?: string;
}

const 다각형_점 = (
  중심_x: number,
  중심_y: number,
  반지름: number,
  N: number,
  값들: number[],
): string =>
  값들
    .map((값, i) => {
      const 각 = (Math.PI * 2 * i) / N - Math.PI / 2;
      const r = (값 / 100) * 반지름;
      return `${중심_x + r * Math.cos(각)},${중심_y + r * Math.sin(각)}`;
    })
    .join(" ");

export const 미니_레이더 = ({
  점수들,
  라벨들,
  크기 = 140,
  색 = "var(--color-maemae)",
}: 속성) => {
  const N = 점수들.length;
  const 중심 = 크기 / 2;
  const 반지름 = 크기 / 2 - 18;

  const 가이드_레벨 = [25, 50, 75, 100];

  return (
    <svg width={크기} height={크기} viewBox={`0 0 ${크기} ${크기}`} aria-label="레이더">
      {/* 가이드 다각형 */}
      {가이드_레벨.map((레벨) => (
        <polygon
          key={레벨}
          points={다각형_점(
            중심,
            중심,
            반지름,
            N,
            Array(N).fill(레벨),
          )}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={0.6}
        />
      ))}
      {/* 축선 */}
      {Array.from({ length: N }, (_, i) => {
        const 각 = (Math.PI * 2 * i) / N - Math.PI / 2;
        return (
          <line
            key={i}
            x1={중심}
            y1={중심}
            x2={중심 + 반지름 * Math.cos(각)}
            y2={중심 + 반지름 * Math.sin(각)}
            stroke="var(--color-line)"
            strokeWidth={0.4}
          />
        );
      })}
      {/* 데이터 영역 */}
      <polygon
        points={다각형_점(중심, 중심, 반지름, N, 점수들)}
        fill={색}
        fillOpacity={0.22}
        stroke={색}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* 데이터 점 */}
      {점수들.map((s, i) => {
        const 각 = (Math.PI * 2 * i) / N - Math.PI / 2;
        const r = (s / 100) * 반지름;
        return (
          <circle
            key={i}
            cx={중심 + r * Math.cos(각)}
            cy={중심 + r * Math.sin(각)}
            r={2}
            fill="var(--color-ink)"
          />
        );
      })}
      {/* 라벨 */}
      {라벨들 &&
        라벨들.map((라벨, i) => {
          const 각 = (Math.PI * 2 * i) / N - Math.PI / 2;
          const 외곽 = 반지름 + 12;
          const x = 중심 + 외곽 * Math.cos(각);
          const y = 중심 + 외곽 * Math.sin(각);
          return (
            <text
              key={i}
              x={x}
              y={y}
              fontSize={9}
              fontFamily="JetBrains Mono, monospace"
              fill="var(--color-ink-3)"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {라벨}
            </text>
          );
        })}
    </svg>
  );
};
