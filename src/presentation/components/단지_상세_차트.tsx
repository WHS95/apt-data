"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { IChartApi, Time } from "lightweight-charts";
import type { 단지_상세_결과 } from "../../application/단지_상세_유스케이스";

interface 속성 {
  결과: 단지_상세_결과;
  거래_유형: "전체" | "1" | "2";
}

const 가격_라벨 = (만원: number): string => {
  if (만원 >= 10000) {
    const 억 = Math.floor(만원 / 10000);
    const 천 = Math.round((만원 % 10000) / 1000);
    return 천 > 0 ? `${억}억 ${천}천` : `${억}억`;
  }
  return `${Math.round(만원).toLocaleString("ko-KR")}만`;
};

const 평 = (면적: number): number => Math.round(면적 / 3.305785);

// lightweight-charts: 캔들(선택 평형의 실거래 총액 OHLC) ↔ 라인(매매·전세 중위 총액) + 거래량.
// 기간은 차트 줌/팬으로 조절하고, 집계는 월/분기 단위 토글로 바꾼다.
export const 단지_상세_차트 = ({ 결과, 거래_유형 }: 속성) => {
  const 박스 = useRef<HTMLDivElement>(null);
  const 툴팁 = useRef<HTMLDivElement>(null);
  const 차트 = useRef<IChartApi | null>(null);
  const [차트유형, 차트유형_설정] = useState<"라인" | "캔들">("캔들");
  const [집계단위, 집계단위_설정] = useState<"월" | "분기">("월");
  const [선택_평형, 선택_평형_설정] = useState<number | null>(null);

  const 월별 = 결과.월별_평균;
  const 거래들 = 결과.거래들;

  // 매매 거래가 있는 평형 목록(㎡ 반올림 기준) — 거래 많은 순
  const 매매평형 = useMemo(() => {
    const cnt = new Map<number, number>();
    for (const t of 거래들) {
      if (t.거래_유형 === "1" && t.거래_금액_만원 && t.전용_면적_제곱미터 > 0) {
        const m = Math.round(t.전용_면적_제곱미터);
        cnt.set(m, (cnt.get(m) ?? 0) + 1);
      }
    }
    return [...cnt.entries()]
      .map(([면적, 건수]) => ({ 면적, 건수 }))
      .sort((a, b) => b.건수 - a.건수);
  }, [거래들]);

  const 매매_있음 = 매매평형.length > 0;
  // 캔들은 매매·특정평형이 있어야 성립. 없으면 라인으로 강제
  const 유효유형: "라인" | "캔들" = 매매_있음 ? 차트유형 : "라인";
  // 선택 평형이 현재 데이터에 없으면(필터 변경 등) 최다거래 평형으로 폴백
  const 유효_평형 =
    (선택_평형 != null && 매매평형.some((p) => p.면적 === 선택_평형)
      ? 선택_평형
      : 매매평형[0]?.면적) ?? null;

  useEffect(() => {
    const el = 박스.current;
    if (!el || 월별.length === 0) return;
    let 살아있음 = true;

    (async () => {
      const {
        createChart,
        LineSeries,
        HistogramSeries,
        CandlestickSeries,
        LineStyle,
        ColorType,
        createSeriesMarkers,
      } = await import("lightweight-charts");
      if (!살아있음 || !박스.current) return;

      const 캔들모드 = 유효유형 === "캔들";

      // 년월(YYYY-MM) → 집계 버킷(월/분기 시작월) 키·시각
      const 버킷 = (년월: string): { key: string; time: Time } => {
        if (집계단위 === "월") return { key: 년월, time: `${년월}-01` as Time };
        const y = 년월.slice(0, 4);
        const mm = Number(년월.slice(5, 7));
        const 시작월 = Math.floor((mm - 1) / 3) * 3 + 1;
        const k = `${y}-${String(시작월).padStart(2, "0")}`;
        return { key: k, time: `${k}-01` as Time };
      };

      const chart = createChart(el, {
        autoSize: true,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#8b95a1",
          attributionLogo: true,
          fontFamily: "inherit",
        },
        grid: { vertLines: { visible: false }, horzLines: { color: "#f2f4f6" } },
        rightPriceScale: { borderColor: "#e5e8eb", scaleMargins: { top: 0.08, bottom: 0.26 } },
        timeScale: { borderColor: "#e5e8eb" },
      });
      차트.current = chart;
      // 축·값 라벨을 억 단위로. 거래량(만원 아님)엔 적용 안 되게 시리즈별 지정
      const 억_포맷 = { type: "custom", formatter: (p: number) => 가격_라벨(p), minMove: 1 } as const;
      const 공통 = { priceLineVisible: false, lastValueVisible: false, priceFormat: 억_포맷 } as const;

      const 보여_매매 = 거래_유형 !== "2";
      const 보여_전세 = 거래_유형 !== "1";

      let 매매선: ReturnType<typeof chart.addSeries> | null = null;
      let 전세선: ReturnType<typeof chart.addSeries> | null = null;
      let 캔들: ReturnType<typeof chart.addSeries> | null = null;

      // 거래량 히스토그램(하단 오버레이) — 두 모드 공통. 값 라벨 숨김(억 포맷 오염 방지)
      const 거래량 = chart.addSeries(HistogramSeries, {
        priceScaleId: "vol",
        priceFormat: { type: "volume" },
        lastValueVisible: false,
        priceLineVisible: false,
        color: "#d1d6db",
      });
      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

      if (캔들모드 && 유효_평형 != null) {
        // 선택 평형의 실거래 총액 OHLC. 거래들은 계약일 오름차순 → 시=첫, 종=끝
        const bin = new Map<
          string,
          { time: Time; open: number; high: number; low: number; close: number; n: number }
        >();
        for (const t of 거래들) {
          if (
            t.거래_유형 !== "1" ||
            !t.거래_금액_만원 ||
            Math.round(t.전용_면적_제곱미터) !== 유효_평형
          )
            continue;
          const { key, time } = 버킷(t.계약_일자.slice(0, 7));
          const v = t.거래_금액_만원;
          const cur = bin.get(key);
          if (!cur) bin.set(key, { time, open: v, high: v, low: v, close: v, n: 1 });
          else {
            cur.high = Math.max(cur.high, v);
            cur.low = Math.min(cur.low, v);
            cur.close = v;
            cur.n += 1;
          }
        }
        const 정렬됨 = [...bin.values()].sort((a, b) =>
          String(a.time).localeCompare(String(b.time)),
        );
        캔들 = chart.addSeries(CandlestickSeries, {
          upColor: "#f04452",
          wickUpColor: "#f04452",
          downColor: "#3182f6",
          wickDownColor: "#3182f6",
          borderVisible: false,
          priceFormat: 억_포맷,
        });
        캔들.setData(
          정렬됨.map((o) => ({ time: o.time, open: o.open, high: o.high, low: o.low, close: o.close })),
        );
        거래량.setData(정렬됨.map((o) => ({ time: o.time, value: o.n })));
      } else {
        // 라인 — 월별 평균을 버킷별 건수가중 평균으로 집계
        const bin = new Map<
          string,
          { time: Time; 매매합: number; 매매n: number; 전세합: number; 전세n: number; 매매건: number; 전세건: number }
        >();
        for (const m of 월별) {
          const { key, time } = 버킷(m.년월);
          const b =
            bin.get(key) ??
            { time, 매매합: 0, 매매n: 0, 전세합: 0, 전세n: 0, 매매건: 0, 전세건: 0 };
          if (m.매매_평균 != null) {
            b.매매합 += m.매매_평균 * m.매매_건수;
            b.매매n += m.매매_건수;
          }
          if (m.전세_평균 != null) {
            b.전세합 += m.전세_평균 * m.전세_건수;
            b.전세n += m.전세_건수;
          }
          b.매매건 += m.매매_건수;
          b.전세건 += m.전세_건수;
          bin.set(key, b);
        }
        const 정렬됨 = [...bin.values()].sort((a, b) =>
          String(a.time).localeCompare(String(b.time)),
        );

        if (보여_매매) {
          매매선 = chart.addSeries(LineSeries, { ...공통, color: "#f04452", lineWidth: 2 });
          매매선.setData(
            정렬됨
              .filter((b) => b.매매n > 0)
              .map((b) => ({ time: b.time, value: Math.round(b.매매합 / b.매매n) })),
          );
        }
        if (보여_전세) {
          전세선 = chart.addSeries(LineSeries, {
            ...공통,
            color: "#12b886",
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
          });
          전세선.setData(
            정렬됨
              .filter((b) => b.전세n > 0)
              .map((b) => ({ time: b.time, value: Math.round(b.전세합 / b.전세n) })),
          );
        }
        거래량.setData(
          정렬됨.map((b) => ({
            time: b.time,
            value:
              거래_유형 === "1" ? b.매매건 : 거래_유형 === "2" ? b.전세건 : b.매매건 + b.전세건,
          })),
        );

        // 신고가 마커 — 라인 모드(총액)에서만
        if (보여_매매 && 매매선 && 결과.메타.역대_최고가_월 && 결과.메타.역대_최고가_만원 != null) {
          const { time } = 버킷(결과.메타.역대_최고가_월);
          createSeriesMarkers(매매선, [
            {
              time,
              position: "aboveBar",
              color: "#f04452",
              shape: "arrowDown",
              text: `신고가 ${가격_라벨(결과.메타.역대_최고가_만원)}`,
            },
          ]);
        }
      }

      chart.subscribeCrosshairMove((param) => {
        const box = 툴팁.current;
        if (!box || !param.time || !param.point) {
          if (box) box.style.display = "none";
          return;
        }
        const ym = String(param.time).slice(0, 7);
        const 라벨 = 집계단위 === "분기" ? `${ym.slice(0, 4)} ${Math.floor((Number(ym.slice(5, 7)) - 1) / 3) + 1}분기` : ym;
        const vol = (param.seriesData.get(거래량) as { value?: number } | undefined)?.value;
        if (캔들모드 && 캔들) {
          const c = param.seriesData.get(캔들) as
            | { open?: number; high?: number; low?: number; close?: number }
            | undefined;
          const f = (v?: number) => (v != null ? 가격_라벨(v) : "—");
          box.innerHTML =
            `<div style="font-weight:800">${라벨}</div>` +
            (c
              ? `<div>시 <b>${f(c.open)}</b> · 고 ${f(c.high)}</div>` +
                `<div>저 ${f(c.low)} · 종 <b>${f(c.close)}</b></div>`
              : "") +
            `<div style="color:#8b95a1">거래 ${vol ?? 0}건</div>`;
        } else {
          const gv = (s: typeof 매매선) =>
            s ? (param.seriesData.get(s) as { value?: number } | undefined)?.value : undefined;
          const m = gv(매매선), j = gv(전세선);
          box.innerHTML =
            `<div style="font-weight:800">${라벨}</div>` +
            (보여_매매 ? `<div style="color:#f04452">매매 <b>${m != null ? 가격_라벨(m) : "—"}</b></div>` : "") +
            (보여_전세 ? `<div style="color:#12b886">전세 <b>${j != null ? 가격_라벨(j) : "—"}</b></div>` : "") +
            `<div style="color:#8b95a1">거래 ${vol ?? 0}건</div>`;
        }
        box.style.display = "block";
        const x = param.point.x;
        box.style.left = (x > el.clientWidth - 140 ? x - 130 : x + 16) + "px";
        box.style.top = "8px";
      });

      chart.timeScale().fitContent();
    })();

    return () => {
      살아있음 = false;
      차트.current?.remove();
      차트.current = null;
    };
  }, [결과, 거래_유형, 월별, 거래들, 유효유형, 유효_평형, 집계단위]);

  if (월별.length === 0) {
    return (
      <div className="toss-card p-12 text-center text-[var(--color-ink-3)] text-[14px]">
        표시할 거래 추이가 없습니다.
      </div>
    );
  }

  const 캔들모드 = 유효유형 === "캔들";

  return (
    <div className="toss-card p-4 relative">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-3 text-[11px] font-medium text-[var(--color-ink-3)] flex-wrap">
          {캔들모드 ? (
            <>
              <span className="flex items-center gap-1">
                <i className="inline-block w-2 h-3 bg-[#f04452]" /> 상승
              </span>
              <span className="flex items-center gap-1">
                <i className="inline-block w-2 h-3 bg-[#3182f6]" /> 하락
              </span>
              {유효_평형 != null && (
                <span className="font-bold text-[var(--color-ink-2)] num">
                  {유효_평형}㎡·{평(유효_평형)}평 실거래 총액(억) 시·고·저·종
                </span>
              )}
            </>
          ) : (
            <>
              {거래_유형 !== "2" && (
                <span className="flex items-center gap-1">
                  <i className="inline-block w-3 h-[2px] bg-[#f04452]" /> 매매 평균
                </span>
              )}
              {거래_유형 !== "1" && (
                <span className="flex items-center gap-1">
                  <i className="inline-block w-3 h-[2px] bg-[#12b886]" /> 전세 평균
                </span>
              )}
              <span style={{ color: "#f04452" }}>▽ 신고가</span>
            </>
          )}
          <span className="flex items-center gap-1">
            <i className="inline-block w-2 h-2 bg-[#d1d6db]" /> 거래량
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* 평형 선택 — 캔들 모드에서만 (면적 고정 실거래값) */}
          {매매_있음 && 캔들모드 && 유효_평형 != null && (
            <select
              value={유효_평형}
              onChange={(e) => 선택_평형_설정(Number(e.target.value))}
              className="num text-[12px] font-bold rounded-lg border hairline bg-[var(--color-bg)] px-2 py-1.5 text-[var(--color-ink)] cursor-pointer focus:outline-none focus:border-[var(--color-brand)]"
            >
              {매매평형.map((p) => (
                <option key={p.면적} value={p.면적}>
                  {p.면적}㎡·{평(p.면적)}평 ({p.건수})
                </option>
              ))}
            </select>
          )}
          {/* 집계 단위 */}
          <div className="flex gap-1">
            {(["월", "분기"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => 집계단위_설정(k)}
                className={`pill ${k === 집계단위 ? "pill-active" : ""}`}
              >
                {k}
              </button>
            ))}
          </div>
          {매매_있음 && (
            <div className="flex gap-1">
              {(["캔들", "라인"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => 차트유형_설정(k)}
                  className={`pill ${k === 유효유형 ? "pill-active" : ""}`}
                >
                  {k}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div ref={박스} className="w-full" style={{ height: 420 }} />
      <div
        ref={툴팁}
        className="pointer-events-none absolute z-10 hidden rounded-lg bg-[var(--color-bg)] px-3 py-2 text-[11px] leading-tight shadow-[0_4px_16px_rgba(0,0,0,0.12)] border hairline num"
        style={{ display: "none" }}
      />
    </div>
  );
};
