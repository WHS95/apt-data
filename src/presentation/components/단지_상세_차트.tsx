"use client";

import { useMemo, useState } from "react";
import type { 단지_상세_결과 } from "../../application/단지_상세_유스케이스";

interface 속성 {
  결과: 단지_상세_결과;
  거래_유형: "전체" | "1" | "2";
  기간_연수?: number;
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

// Catmull-Rom smoothing
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

export const 단지_상세_차트 = ({
  결과,
  거래_유형,
  기간_연수 = 3,
}: 속성) => {
  const 너비 = 1100;
  const 가격_높이 = 320;
  const 거래량_높이 = 84;
  const 여백 = { 좌: 64, 우: 40, 상: 40, 가운데: 24, 하: 32 };

  const [호버_i, 호버_i_설정] = useState<number | null>(null);

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

  // 연속된 월 배열 생성 (누락된 달도 X축 위치 유지)
  const 월별_원본 = 결과.월별_평균.filter(
    (m) => m.년월 >= 시작_제한.slice(0, 7),
  );

  const 월별 = useMemo(() => {
    if (월별_원본.length === 0) return [] as typeof 월별_원본;
    // 연속된 월 채우기
    const 시작 = 월별_원본[0].년월;
    const 종료 = 월별_원본[월별_원본.length - 1].년월;
    const [시_y, 시_m] = 시작.split("-").map(Number);
    const [종_y, 종_m] = 종료.split("-").map(Number);
    const 맵 = new Map(월별_원본.map((m) => [m.년월, m]));
    const 결과_리스트: typeof 월별_원본 = [];
    let y = 시_y;
    let m = 시_m;
    while (y < 종_y || (y === 종_y && m <= 종_m)) {
      const 키 = `${y}-${String(m).padStart(2, "0")}`;
      결과_리스트.push(
        맵.get(키) ?? {
          년월: 키,
          매매_평균: null,
          전세_평균: null,
          매매_건수: 0,
          전세_건수: 0,
        },
      );
      m++;
      if (m > 12) { m = 1; y++; }
    }
    return 결과_리스트;
  }, [월별_원본]);

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
    월별.length === 1 ? 0 : (너비 - 여백.좌 - 여백.우) / (월별.length - 1);
  const X = (i: number) => 여백.좌 + i * 단계_x;

  // 가격 스케일
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
  const 가격_최대_여유 = 가격_최대 + 가격_범위 * 0.15;
  const 가격_최소_여유 = Math.max(0, 가격_최소 - 가격_범위 * 0.1);
  const 가격_여유_범위 = 가격_최대_여유 - 가격_최소_여유;

  const Y_가격 = (v: number) =>
    여백.상 + (1 - (v - 가격_최소_여유) / 가격_여유_범위) * 가격_높이;

  const 매매_점들 = 월별
    .map((m, i) => (m.매매_평균 ? { x: X(i), y: Y_가격(m.매매_평균) } : null))
    .filter((p): p is { x: number; y: number } => p !== null);
  const 전세_점들 = 월별
    .map((m, i) => (m.전세_평균 ? { x: X(i), y: Y_가격(m.전세_평균) } : null))
    .filter((p): p is { x: number; y: number } => p !== null);

  // Y 격자
  const 눈금_단계 = 4;
  const 눈금 = Array.from({ length: 눈금_단계 + 1 }, (_, i) => {
    const v = 가격_최소_여유 + (가격_여유_범위 * i) / 눈금_단계;
    return { 값: v, y: Y_가격(v) };
  });

  // X축 — 연도별 세로 격자
  const 연도_경계: Array<{ i: number; 년: number }> = [];
  let 이전년 = "";
  월별.forEach((m, i) => {
    const 년 = m.년월.slice(0, 4);
    if (년 !== 이전년) {
      연도_경계.push({ i, 년: Number(년) });
      이전년 = 년;
    }
  });

  // 실거래 점 (같은 년월끼리 겹칠 때 살짝 오프셋)
  const 매매_점_그룹 = new Map<
    number,
    Array<{ 가격: number; 층: number | null; 이상치: boolean; 일자: string }>
  >();
  const 전세_점_그룹 = new Map<
    number,
    Array<{ 가격: number; 층: number | null; 이상치: boolean; 일자: string }>
  >();
  for (const t of 결과.거래들) {
    if (t.계약_일자 < 시작_제한) continue;
    const i = 월_색인.get(t.계약_일자.slice(0, 7));
    if (i === undefined) continue;
    if (매매_표시 && t.거래_유형 === "1" && t.거래_금액_만원) {
      if (!매매_점_그룹.has(i)) 매매_점_그룹.set(i, []);
      매매_점_그룹.get(i)!.push({
        가격: t.거래_금액_만원,
        층: t.층,
        이상치: t.이상치_의심,
        일자: t.계약_일자,
      });
    }
    if (전세_표시 && t.거래_유형 === "2" && t.보증금_만원) {
      if (!전세_점_그룹.has(i)) 전세_점_그룹.set(i, []);
      전세_점_그룹.get(i)!.push({
        가격: t.보증금_만원,
        층: t.층,
        이상치: t.이상치_의심,
        일자: t.계약_일자,
      });
    }
  }

  // 최고/최저 매매 정상 거래
  let 최고: { x: number; y: number; 가격: number; 일자: string } | null = null;
  let 최저: { x: number; y: number; 가격: number; 일자: string } | null = null;
  if (매매_표시) {
    for (const [i, arr] of 매매_점_그룹.entries()) {
      for (const p of arr) {
        if (p.이상치) continue;
        const 점 = { x: X(i), y: Y_가격(p.가격), 가격: p.가격, 일자: p.일자 };
        if (!최고 || p.가격 > 최고.가격) 최고 = 점;
        if (!최저 || p.가격 < 최저.가격) 최저 = 점;
      }
    }
  }

  // 거래량
  const 월별_거래량 = 월별.map((m) => m.매매_건수 + m.전세_건수);
  const 거래량_최대 = Math.max(1, ...월별_거래량);
  const 거래량_바닥 = 여백.상 + 가격_높이 + 여백.가운데 + 거래량_높이;
  const Y_거래량 = (n: number) =>
    거래량_바닥 - (n / 거래량_최대) * 거래량_높이;

  const 총_높이 = 거래량_바닥 + 여백.하;

  // hover 처리 — mousemove 좌표를 월 인덱스로 변환
  const 마우스이동 = (
    e: React.MouseEvent<SVGSVGElement>,
    svg: SVGSVGElement,
  ) => {
    const 사각 = svg.getBoundingClientRect();
    const 상대_x =
      ((e.clientX - 사각.left) / 사각.width) * 너비;
    if (상대_x < 여백.좌 || 상대_x > 너비 - 여백.우) {
      호버_i_설정(null);
      return;
    }
    const i = Math.max(0, Math.min(월별.length - 1, Math.round((상대_x - 여백.좌) / 단계_x)));
    호버_i_설정(i);
  };

  const 호버_데이터 = 호버_i != null ? 월별[호버_i] : null;
  const 호버_x = 호버_i != null ? X(호버_i) : null;
  const 호버_거래_수 =
    (매매_점_그룹.get(호버_i ?? -1)?.length ?? 0) +
    (전세_점_그룹.get(호버_i ?? -1)?.length ?? 0);

  return (
    <div className="toss-card bg-[var(--color-bg)] p-4 overflow-x-auto">
      <svg
        width={너비}
        height={총_높이}
        viewBox={`0 0 ${너비} ${총_높이}`}
        className="max-w-full h-auto"
        onMouseMove={(e) => 마우스이동(e, e.currentTarget)}
        onMouseLeave={() => 호버_i_설정(null)}
        style={{ cursor: "crosshair" }}
      >
        {/* 연도 세로 격자 */}
        {연도_경계.map((c, idx) =>
          idx === 0 ? null : (
            <line
              key={`yr-${c.년}`}
              x1={X(c.i)}
              y1={여백.상}
              x2={X(c.i)}
              y2={거래량_바닥}
              stroke="var(--color-line)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          ),
        )}

        {/* Y 격자 + 라벨 */}
        {눈금.map((g, i) => (
          <g key={i}>
            <line
              x1={여백.좌}
              y1={g.y}
              x2={너비 - 여백.우}
              y2={g.y}
              stroke="var(--color-line)"
              strokeWidth={1}
            />
            <text
              x={여백.좌 - 10}
              y={g.y + 4}
              fontSize={11}
              fontWeight={600}
              fill="var(--color-ink-3)"
              textAnchor="end"
            >
              {가격_축(g.값)}
            </text>
          </g>
        ))}

        {/* 실거래 점 (같은 월끼리 살짝 흩뿌리기) */}
        {매매_표시 &&
          Array.from(매매_점_그룹.entries()).flatMap(([i, arr]) =>
            arr.map((p, k) => {
              const 오프셋 = arr.length > 1 ? (k - (arr.length - 1) / 2) * 4 : 0;
              return (
                <circle
                  key={`m-${i}-${k}`}
                  cx={X(i) + 오프셋}
                  cy={Y_가격(p.가격)}
                  r={3}
                  fill={
                    p.이상치
                      ? "var(--color-warn)"
                      : p.층 != null && p.층 <= 2
                        ? "#8C92FF"
                        : "#B0B8C1"
                  }
                  fillOpacity={0.6}
                  stroke="white"
                  strokeWidth={0.5}
                />
              );
            }),
          )}
        {전세_표시 &&
          Array.from(전세_점_그룹.entries()).flatMap(([i, arr]) =>
            arr.map((p, k) => {
              const 오프셋 = arr.length > 1 ? (k - (arr.length - 1) / 2) * 4 : 0;
              return (
                <circle
                  key={`j-${i}-${k}`}
                  cx={X(i) + 오프셋}
                  cy={Y_가격(p.가격)}
                  r={2.5}
                  fill="var(--color-down)"
                  fillOpacity={0.45}
                  stroke="white"
                  strokeWidth={0.5}
                />
              );
            }),
          )}

        {/* 매매 부드러운 라인 */}
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
        {/* 전세 라인 */}
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

        {/* 최고/최저 매매 마커 */}
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
              fontWeight={700}
              fill="#5B5FEF"
              textAnchor="middle"
            >
              {가격_라벨(최저.가격)}
            </text>
          </g>
        )}

        {/* 호버 수직선 + 툴팁 앵커 */}
        {호버_x != null && (
          <line
            x1={호버_x}
            y1={여백.상}
            x2={호버_x}
            y2={거래량_바닥}
            stroke="var(--color-ink-4)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        )}

        {/* X축 연도 라벨 */}
        {연도_경계.map((c) => (
          <text
            key={`yl-${c.년}`}
            x={X(c.i)}
            y={여백.상 + 가격_높이 + 18}
            fontSize={12}
            fontWeight={700}
            fill="var(--color-ink-2)"
            textAnchor="start"
          >
            {c.년}
          </text>
        ))}

        {/* 거래량 축 라벨 */}
        <text
          x={여백.좌 - 10}
          y={Y_거래량(거래량_최대) + 4}
          fontSize={10}
          fontWeight={700}
          fill="var(--color-ink-3)"
          textAnchor="end"
        >
          {거래량_최대}
        </text>
        <text
          x={여백.좌 - 10}
          y={거래량_바닥 + 4}
          fontSize={10}
          fontWeight={700}
          fill="var(--color-ink-3)"
          textAnchor="end"
        >
          0
        </text>
        <text
          x={여백.좌 - 10}
          y={여백.상 + 가격_높이 + 여백.가운데 + 12}
          fontSize={10}
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
          const w = Math.max(3, Math.min(12, 단계_x * 0.65));
          const 활성 = 호버_i === i;
          return (
            <g key={`v-${i}`}>
              <rect
                x={x - w / 2}
                y={y_top}
                width={w}
                height={거래량_바닥 - y_top}
                fill={활성 ? "var(--color-ink)" : "#B0B8C1"}
                rx={1.5}
              />
              {활성 && (
                <text
                  x={x}
                  y={y_top - 4}
                  fontSize={10}
                  fontWeight={700}
                  fill="var(--color-ink)"
                  textAnchor="middle"
                >
                  {총}
                </text>
              )}
            </g>
          );
        })}

        {/* 호버 툴팁 */}
        {호버_데이터 && 호버_x != null && (() => {
          const 툴팁_너비 = 200;
          const 툴팁_높이 = 100;
          const 좌측 = 호버_x + 10 + 툴팁_너비 > 너비 - 여백.우;
          const 좌표_x = 좌측 ? 호버_x - 툴팁_너비 - 10 : 호버_x + 10;
          const 좌표_y = 여백.상 + 4;
          return (
            <g style={{ pointerEvents: "none" }}>
              <rect
                x={좌표_x}
                y={좌표_y}
                width={툴팁_너비}
                height={툴팁_높이}
                fill="white"
                stroke="var(--color-line-strong)"
                strokeWidth={1}
                rx={8}
              />
              <text
                x={좌표_x + 12}
                y={좌표_y + 20}
                fontSize={12}
                fontWeight={800}
                fill="var(--color-ink)"
              >
                {호버_데이터.년월.replace("-", ". ")}
              </text>
              <text
                x={좌표_x + 12}
                y={좌표_y + 40}
                fontSize={11}
                fontWeight={600}
                fill="var(--color-ink-3)"
              >
                매매 평균
              </text>
              <text
                x={좌표_x + 툴팁_너비 - 12}
                y={좌표_y + 40}
                fontSize={12}
                fontWeight={800}
                fill="#5B5FEF"
                textAnchor="end"
              >
                {호버_데이터.매매_평균 ? 가격_라벨(호버_데이터.매매_평균) : "—"}
              </text>
              <text
                x={좌표_x + 12}
                y={좌표_y + 58}
                fontSize={11}
                fontWeight={600}
                fill="var(--color-ink-3)"
              >
                전세 평균
              </text>
              <text
                x={좌표_x + 툴팁_너비 - 12}
                y={좌표_y + 58}
                fontSize={12}
                fontWeight={800}
                fill="var(--color-down)"
                textAnchor="end"
              >
                {호버_데이터.전세_평균 ? 가격_라벨(호버_데이터.전세_평균) : "—"}
              </text>
              <text
                x={좌표_x + 12}
                y={좌표_y + 76}
                fontSize={11}
                fontWeight={600}
                fill="var(--color-ink-3)"
              >
                거래 건수
              </text>
              <text
                x={좌표_x + 툴팁_너비 - 12}
                y={좌표_y + 76}
                fontSize={12}
                fontWeight={800}
                fill="var(--color-ink)"
                textAnchor="end"
              >
                {호버_거래_수}건
              </text>
              <text
                x={좌표_x + 12}
                y={좌표_y + 92}
                fontSize={10}
                fontWeight={500}
                fill="var(--color-ink-4)"
              >
                매매 {호버_데이터.매매_건수} · 전세 {호버_데이터.전세_건수}
              </text>
            </g>
          );
        })()}
      </svg>

      {/* 범례 */}
      <div className="flex items-center justify-between mt-3 px-2 flex-wrap gap-y-2">
        <div className="flex items-center gap-4 text-[11px] text-[var(--color-ink-2)] font-medium">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-4 h-[2.5px] rounded"
              style={{ background: "#5B5FEF" }}
            />
            매매 평균
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-4 h-[2px] border-t-2 border-dashed"
              style={{ borderColor: "var(--color-down)" }}
            />
            전세 평균
          </span>
          <span className="w-px h-3 bg-[var(--color-line)]" />
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#B0B8C1]" />
            일반
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#8C92FF]" />
            저층
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-warn)]" />
            이상치
          </span>
        </div>
        <div className="text-[10px] text-[var(--color-ink-4)] font-medium">
          그래프 위에 마우스를 올리면 해당 월의 상세 정보가 표시됩니다
        </div>
      </div>
    </div>
  );
};
