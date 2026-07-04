import type {
  단지_상세_결과,
} from "../../application/단지_상세_유스케이스";

interface 속성 {
  결과: 단지_상세_결과;
  거래_유형: "전체" | "1" | "2";
  기간_연수?: number; // 3 = 최근 3년, 0 = 전체
}

const 가격_라벨 = (만원: number): string => {
  if (만원 >= 10000) {
    const 억 = Math.floor(만원 / 10000);
    const 천 = Math.round((만원 % 10000) / 1000);
    return 천 > 0 ? `${억}억 ${천}천` : `${억}억`;
  }
  return `${만원.toLocaleString("ko-KR")}만`;
};

const 가격_축 = (만원: number): string => {
  if (만원 >= 10000) return `${Math.round(만원 / 10000)}억`;
  return 만원 > 0 ? `${(만원 / 1000).toFixed(0)}천` : "0";
};

// Catmull-Rom 부드러운 곡선
const 부드러운_경로 = (
  점들: Array<{ x: number; y: number }>,
): string => {
  if (점들.length === 0) return "";
  if (점들.length === 1) return `M ${점들[0].x} ${점들[0].y}`;
  let d = `M ${점들[0].x.toFixed(1)} ${점들[0].y.toFixed(1)}`;
  for (let i = 0; i < 점들.length - 1; i++) {
    const p0 = 점들[i - 1] ?? 점들[i];
    const p1 = 점들[i];
    const p2 = 점들[i + 1];
    const p3 = 점들[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
};

export const 단지_상세_차트 = ({ 결과, 거래_유형, 기간_연수 = 3 }: 속성) => {
  const 너비 = 1080;
  const 가격_높이 = 320;
  const 거래량_높이 = 80;
  const 여백 = { 좌: 56, 우: 32, 상: 36, 가운데: 16 };

  // 거래 필터: 기간 + 유형
  const 오늘 = new Date();
  const 시작_제한 =
    기간_연수 > 0
      ? new Date(
          오늘.getFullYear() - 기간_연수,
          오늘.getMonth(),
          오늘.getDate(),
        )
          .toISOString()
          .slice(0, 10)
      : "1900-01-01";

  const 매매_표시 = 거래_유형 === "전체" || 거래_유형 === "1";
  const 전세_표시 = 거래_유형 === "전체" || 거래_유형 === "2";

  const 월별 = 결과.월별_평균.filter((m) => m.년월 >= 시작_제한.slice(0, 7));
  if (월별.length === 0) {
    return (
      <div className="toss-card p-16 text-center text-[var(--color-ink-3)]">
        해당 기간 데이터가 없습니다.
      </div>
    );
  }

  const 월_색인 = new Map<string, number>();
  월별.forEach((m, i) => 월_색인.set(m.년월, i));

  const 단계_x =
    (너비 - 여백.좌 - 여백.우) / Math.max(1, 월별.length - 1);
  const X = (i: number) => 여백.좌 + i * 단계_x;

  // Y 가격 스케일
  const 모든_가격: number[] = [];
  for (const m of 월별) {
    if (매매_표시 && m.매매_평균) 모든_가격.push(m.매매_평균);
    if (전세_표시 && m.전세_평균) 모든_가격.push(m.전세_평균);
  }
  for (const t of 결과.거래들) {
    if (t.계약_일자.slice(0, 7) < 시작_제한.slice(0, 7)) continue;
    if (매매_표시 && t.거래_유형 === "1" && t.거래_금액_만원)
      모든_가격.push(t.거래_금액_만원);
    if (전세_표시 && t.거래_유형 === "2" && t.보증금_만원)
      모든_가격.push(t.보증금_만원);
  }
  if (모든_가격.length === 0) {
    return (
      <div className="toss-card p-16 text-center text-[var(--color-ink-3)]">
        가격 데이터가 없습니다.
      </div>
    );
  }
  const 가격_최소 = Math.min(...모든_가격);
  const 가격_최대 = Math.max(...모든_가격);
  const 가격_범위 = 가격_최대 - 가격_최소 || 1;
  const 가격_최대_여유 = 가격_최대 + 가격_범위 * 0.12;
  const 가격_최소_여유 = Math.max(0, 가격_최소 - 가격_범위 * 0.1);
  const 가격_여유_범위 = 가격_최대_여유 - 가격_최소_여유;

  const Y_가격 = (v: number) =>
    여백.상 + (1 - (v - 가격_최소_여유) / 가격_여유_범위) * 가격_높이;

  const 매매_점들 = 월별
    .map((m, i) =>
      m.매매_평균 ? { x: X(i), y: Y_가격(m.매매_평균) } : null,
    )
    .filter((p): p is { x: number; y: number } => p !== null);
  const 전세_점들 = 월별
    .map((m, i) =>
      m.전세_평균 ? { x: X(i), y: Y_가격(m.전세_평균) } : null,
    )
    .filter((p): p is { x: number; y: number } => p !== null);

  // Y 격자 눈금
  const 눈금_단계 = 4;
  const 눈금 = Array.from({ length: 눈금_단계 + 1 }, (_, i) => {
    const v = 가격_최소_여유 + (가격_여유_범위 * i) / 눈금_단계;
    return { 값: v, y: Y_가격(v) };
  });

  // X 라벨
  const 라벨_간격 = Math.max(1, Math.ceil(월별.length / 5));
  const X_라벨 = 월별
    .map((m, i) => ({ i, 년월: m.년월 }))
    .filter((m, idx) => idx % 라벨_간격 === 0 || idx === 월별.length - 1);

  // 거래 점들
  const 매매_거래_점 = 결과.거래들
    .filter(
      (t) =>
        t.거래_유형 === "1" &&
        t.거래_금액_만원 &&
        t.계약_일자 >= 시작_제한 &&
        월_색인.has(t.계약_일자.slice(0, 7)),
    )
    .map((t) => ({
      x: X(월_색인.get(t.계약_일자.slice(0, 7))!),
      y: Y_가격(t.거래_금액_만원!),
      가격: t.거래_금액_만원!,
      층: t.층,
      이상치: t.이상치_의심,
    }));
  const 전세_거래_점 = 결과.거래들
    .filter(
      (t) =>
        t.거래_유형 === "2" &&
        t.보증금_만원 &&
        t.계약_일자 >= 시작_제한 &&
        월_색인.has(t.계약_일자.slice(0, 7)),
    )
    .map((t) => ({
      x: X(월_색인.get(t.계약_일자.slice(0, 7))!),
      y: Y_가격(t.보증금_만원!),
      가격: t.보증금_만원!,
      층: t.층,
      이상치: t.이상치_의심,
    }));

  // 최고/최저 매매 (라벨)
  let 최고: typeof 매매_거래_점[number] | null = null;
  let 최저: typeof 매매_거래_점[number] | null = null;
  if (매매_표시) {
    for (const p of 매매_거래_점) {
      if (p.이상치) continue;
      if (!최고 || p.가격 > 최고.가격) 최고 = p;
      if (!최저 || p.가격 < 최저.가격) 최저 = p;
    }
  }

  // 거래량
  const 월별_거래량 = 월별.map((m) => m.매매_건수 + m.전세_건수);
  const 거래량_최대 = Math.max(1, ...월별_거래량);
  const 거래량_바닥 = 여백.상 + 가격_높이 + 여백.가운데 + 거래량_높이;
  const Y_거래량 = (n: number) =>
    거래량_바닥 - (n / 거래량_최대) * 거래량_높이;

  const 총_높이 = 거래량_바닥 + 28;

  return (
    <div className="toss-card bg-[var(--color-bg)] p-4 overflow-x-auto">
      <svg
        width={너비}
        height={총_높이}
        viewBox={`0 0 ${너비} ${총_높이}`}
        className="max-w-full h-auto"
      >
        {/* 격자 */}
        {눈금.map((g, i) => (
          <g key={i}>
            <line
              x1={여백.좌}
              y1={g.y}
              x2={너비 - 여백.우}
              y2={g.y}
              stroke="var(--color-line)"
              strokeWidth={1}
              strokeDasharray={i === 0 || i === 눈금.length - 1 ? "0" : "0"}
            />
            <text
              x={여백.좌 - 8}
              y={g.y + 4}
              fontSize={11}
              fontFamily="Pretendard"
              fontWeight={600}
              fill="var(--color-ink-3)"
              textAnchor="end"
            >
              {가격_축(g.값)}
            </text>
          </g>
        ))}

        {/* 거래 점 — 라인 뒤에 그려서 라인이 위에 */}
        {매매_표시 &&
          매매_거래_점.map((p, i) => (
            <circle
              key={`mp${i}`}
              cx={p.x}
              cy={p.y}
              r={3}
              fill={
                p.이상치
                  ? "var(--color-warn)"
                  : p.층 != null && p.층 <= 2
                    ? "#8C92FF"
                    : "#B0B8C1"
              }
              fillOpacity={0.55}
            />
          ))}
        {전세_표시 &&
          전세_거래_점.map((p, i) => (
            <circle
              key={`jp${i}`}
              cx={p.x}
              cy={p.y}
              r={2.5}
              fill="var(--color-down)"
              fillOpacity={0.4}
            />
          ))}

        {/* 매매 부드러운 라인 (보라) */}
        {매매_표시 && 매매_점들.length > 1 && (
          <path
            d={부드러운_경로(매매_점들)}
            fill="none"
            stroke="#5B5FEF"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* 전세 라인 (파랑 점선) */}
        {전세_표시 && 전세_점들.length > 1 && (
          <path
            d={부드러운_경로(전세_점들)}
            fill="none"
            stroke="var(--color-down)"
            strokeWidth={1.8}
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* 최고/최저 마커 + 라벨 */}
        {매매_표시 && 최고 && (
          <g>
            <circle cx={최고.x} cy={최고.y} r={5} fill="var(--color-up)" />
            <text
              x={최고.x}
              y={최고.y - 12}
              fontSize={11}
              fontFamily="Pretendard"
              fontWeight={700}
              fill="var(--color-up)"
              textAnchor="middle"
            >
              최고
            </text>
            <text
              x={최고.x}
              y={최고.y - 24}
              fontSize={11}
              fontFamily="Pretendard"
              fontWeight={700}
              fill="var(--color-up)"
              textAnchor="middle"
            >
              {가격_라벨(최고.가격)}
            </text>
          </g>
        )}
        {매매_표시 && 최저 && 최저 !== 최고 && (
          <g>
            <circle cx={최저.x} cy={최저.y} r={5} fill="#5B5FEF" />
            <text
              x={최저.x}
              y={최저.y + 22}
              fontSize={11}
              fontFamily="Pretendard"
              fontWeight={700}
              fill="#5B5FEF"
              textAnchor="middle"
            >
              최저
            </text>
            <text
              x={최저.x}
              y={최저.y + 34}
              fontSize={11}
              fontFamily="Pretendard"
              fontWeight={700}
              fill="#5B5FEF"
              textAnchor="middle"
            >
              {가격_라벨(최저.가격)}
            </text>
          </g>
        )}

        {/* X축 라벨 */}
        {X_라벨.map(({ i, 년월 }) => (
          <text
            key={i}
            x={X(i)}
            y={여백.상 + 가격_높이 + 14}
            fontSize={11}
            fontFamily="Pretendard"
            fontWeight={600}
            fill="var(--color-ink-3)"
            textAnchor="middle"
          >
            {년월.replace("-", ".")}
          </text>
        ))}

        {/* 거래량 라벨 */}
        <text
          x={여백.좌 - 8}
          y={여백.상 + 가격_높이 + 여백.가운데 + 14}
          fontSize={10}
          fontFamily="Pretendard"
          fontWeight={700}
          fill="var(--color-ink-3)"
          textAnchor="end"
        >
          거래량
        </text>

        {/* 거래량 막대 */}
        {월별.map((m, i) => {
          const 총 = m.매매_건수 + m.전세_건수;
          if (총 === 0) return null;
          const x = X(i);
          const y_top = Y_거래량(총);
          const w = Math.max(3, Math.min(10, 단계_x * 0.6));
          return (
            <rect
              key={i}
              x={x - w / 2}
              y={y_top}
              width={w}
              height={거래량_바닥 - y_top}
              fill="#B0B8C1"
              rx={1}
            />
          );
        })}
      </svg>

      {/* 범례 */}
      <div className="flex items-center justify-end gap-4 mt-2 px-2 text-[11px] text-[var(--color-ink-2)] font-medium">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-full bg-[#B0B8C1] opacity-60" />
          일반
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-full bg-[#8C92FF] opacity-60" />
          저층
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-full bg-[var(--color-warn)] opacity-60" />
          이상치
        </span>
      </div>
    </div>
  );
};
