"use client";

import { useEffect, useRef } from "react";
import type { IChartApi, Time } from "lightweight-charts";
import type { 평형_밴드_추세 } from "../../application/평형별_상승률_유스케이스";

export const 밴드_색 = ["#3182f6", "#12b886", "#f5a623", "#f04452"];

// 평형대별 평당가 지수(첫 달=100) 라인. lightweight-charts, useEffect 안 lazy-import(SSR 안전).
export const 평형_상승률_차트 = ({ 밴드들 }: { 밴드들: 평형_밴드_추세[] }) => {
  const 박스 = useRef<HTMLDivElement>(null);
  const 툴팁 = useRef<HTMLDivElement>(null);
  const 차트 = useRef<IChartApi | null>(null);

  useEffect(() => {
    const el = 박스.current;
    if (!el || 밴드들.length === 0) return;
    let 살아있음 = true;

    (async () => {
      const { createChart, LineSeries, ColorType } = await import("lightweight-charts");
      if (!살아있음 || !박스.current) return;

      const chart = createChart(el, {
        autoSize: true,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#8b95a1",
          attributionLogo: true,
          fontFamily: "inherit",
        },
        grid: { vertLines: { visible: false }, horzLines: { color: "#f2f4f6" } },
        rightPriceScale: { borderColor: "#e5e8eb" },
        timeScale: { borderColor: "#e5e8eb" },
      });
      차트.current = chart;

      const 시리즈들 = 밴드들.map((b, i) => {
        const s = chart.addSeries(LineSeries, {
          color: 밴드_색[i % 밴드_색.length],
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        s.setData(b.월간.map((m) => ({ time: m.시각 as Time, value: m.지수 })));
        return { s, b };
      });

      chart.subscribeCrosshairMove((param) => {
        const box = 툴팁.current;
        if (!box || !param.time || !param.point) {
          if (box) box.style.display = "none";
          return;
        }
        const 줄 = 시리즈들
          .map(({ s, b }, i) => {
            const v = (param.seriesData.get(s) as { value?: number } | undefined)?.value;
            if (v == null) return "";
            return `<div style="color:${밴드_색[i % 밴드_색.length]}">${b.라벨.split(" ")[0]} <b>${v.toFixed(1)}</b></div>`;
          })
          .join("");
        box.innerHTML = `<div style="font-weight:800">${String(param.time).slice(0, 7)}</div>${줄}<div style="color:#8b95a1;font-size:10px">지수(첫 달=100)</div>`;
        box.style.display = "block";
        const x = param.point.x;
        box.style.left = (x > el.clientWidth - 130 ? x - 120 : x + 16) + "px";
        box.style.top = "8px";
      });

      chart.timeScale().fitContent();
    })();

    return () => {
      살아있음 = false;
      차트.current?.remove();
      차트.current = null;
    };
  }, [밴드들]);

  return (
    <div className="relative">
      <div ref={박스} className="w-full" style={{ height: 400 }} />
      <div
        ref={툴팁}
        className="pointer-events-none absolute z-10 hidden rounded-lg bg-[var(--color-bg)] px-3 py-2 text-[11px] leading-tight shadow-[0_4px_16px_rgba(0,0,0,0.12)] border hairline num"
        style={{ display: "none" }}
      />
    </div>
  );
};
