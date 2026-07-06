"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  createSeriesMarkers,
  LineSeries,
  ColorType,
  type IChartApi,
  type SeriesMarker,
  type Time,
} from "lightweight-charts";
import type { 골든크로스_구 } from "../../application/서울_골든크로스_유스케이스";

type 기간_종류 = "1년" | "2년" | "전체";

// 주식차트 스타일: 평당가 + 단기(8주)·장기(24주) 이평선 + 골든/데드크로스 마커.
// canvas 기반이라 반드시 ssr:false 로 동적 임포트해서 사용.
export default function 골든크로스_차트({
  구,
  기간,
}: {
  구: 골든크로스_구;
  기간: 기간_종류;
}) {
  const 박스 = useRef<HTMLDivElement>(null);
  const 툴팁 = useRef<HTMLDivElement>(null);
  const 차트 = useRef<IChartApi | null>(null);

  // 구가 바뀌면 차트 재구성
  useEffect(() => {
    const el = 박스.current;
    if (!el) return;

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8b95a1",
        attributionLogo: true, // Apache-2.0 어트리뷰션 유지
        fontFamily: "inherit",
      },
      grid: {
        vertLines: { color: "#f2f4f6" },
        horzLines: { color: "#f2f4f6" },
      },
      rightPriceScale: { borderColor: "#e5e8eb" },
      timeScale: { borderColor: "#e5e8eb" },
      crosshair: { horzLine: { labelBackgroundColor: "#333d4b" }, vertLine: { labelBackgroundColor: "#333d4b" } },
    });
    차트.current = chart;

    const 공통 = { priceLineVisible: false, lastValueVisible: false } as const;
    const 평당선 = chart.addSeries(LineSeries, { ...공통, color: "#c4cad2", lineWidth: 1 });
    const 장기선 = chart.addSeries(LineSeries, { ...공통, color: "#f04452", lineWidth: 2 }); // 장기 24주(빨강)
    const 단기선 = chart.addSeries(LineSeries, { ...공통, color: "#3182f6", lineWidth: 2 }); // 단기 8주(파랑)

    평당선.setData(구.주간.map((p) => ({ time: p.시각 as Time, value: p.평당 })));
    단기선.setData(
      구.주간.filter((p) => p.단기 != null).map((p) => ({ time: p.시각 as Time, value: p.단기! })),
    );
    장기선.setData(
      구.주간.filter((p) => p.장기 != null).map((p) => ({ time: p.시각 as Time, value: p.장기! })),
    );

    // 골든(▲ 금색) · 데드(▽ 회색, 맥락용)
    const 마커: SeriesMarker<Time>[] = [
      ...구.골든크로스.map((c) => ({
        time: c.시각 as Time,
        position: "belowBar" as const,
        color: "#f5a623",
        shape: "arrowUp" as const,
        text: "골든",
      })),
      ...구.데드크로스.map((c) => ({
        time: c.시각 as Time,
        position: "aboveBar" as const,
        color: "#c9cdd2",
        shape: "arrowDown" as const,
      })),
    ].sort((a, b) => (String(a.time) < String(b.time) ? -1 : 1));
    createSeriesMarkers(단기선, 마커);

    // 툴팁
    chart.subscribeCrosshairMove((param) => {
      const box = 툴팁.current;
      if (!box) return;
      if (!param.time || !param.point) {
        box.style.display = "none";
        return;
      }
      const g = (s: typeof 평당선) => {
        const d = param.seriesData.get(s) as { value?: number } | undefined;
        return d?.value;
      };
      const p = g(평당선), s = g(단기선), l = g(장기선);
      const spread = s != null && l != null && l > 0 ? ((s - l) / l) * 100 : null;
      box.innerHTML =
        `<div style="font-weight:800">${String(param.time)}</div>` +
        `<div>평당 <b>${p != null ? p.toLocaleString("ko-KR") : "—"}</b>만</div>` +
        `<div style="color:#3182f6">단기 ${s != null ? s.toLocaleString("ko-KR") : "—"}</div>` +
        `<div style="color:#f04452">장기 ${l != null ? l.toLocaleString("ko-KR") : "—"}</div>` +
        (spread != null ? `<div>스프레드 <b>${spread > 0 ? "+" : ""}${spread.toFixed(1)}%</b></div>` : "");
      box.style.display = "block";
      const w = el.clientWidth;
      const x = param.point.x;
      box.style.left = (x > w - 140 ? x - 130 : x + 16) + "px";
      box.style.top = "12px";
    });

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      차트.current = null;
    };
  }, [구]);

  // 기간(줌) 변경
  useEffect(() => {
    const chart = 차트.current;
    if (!chart || 구.주간.length === 0) return;
    if (기간 === "전체" || 기간 === "2년") {
      chart.timeScale().fitContent();
      return;
    }
    // 1년: 마지막 52개 바(주)만 — 로컬 인덱스 기준이라 정확
    const n = 구.주간.length;
    chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, n - 52), to: n - 0.5 });
  }, [기간, 구]);

  return (
    <div className="relative">
      <div ref={박스} className="w-full" style={{ height: 380 }} />
      <div
        ref={툴팁}
        className="pointer-events-none absolute z-10 hidden rounded-lg bg-[var(--color-bg)] px-3 py-2 text-[11px] leading-tight shadow-[0_4px_16px_rgba(0,0,0,0.12)] border hairline num"
        style={{ display: "none" }}
      />
    </div>
  );
}

export type { 기간_종류 };
