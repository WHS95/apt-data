"use client";

import { useEffect, useRef } from "react";
import type { IChartApi, Time } from "lightweight-charts";
import type { 가격_추이_포인트 } from "../../domain/통계/지표";

interface 속성 {
  데이터: 가격_추이_포인트[];
}

const 만원_포맷 = (만원: number | null | undefined): string => {
  if (만원 == null) return "—";
  if (만원 >= 10000) {
    const 억 = Math.floor(만원 / 10000);
    const 천 = Math.round((만원 % 10000) / 1000);
    return 천 > 0 ? `${억}억 ${천}천` : `${억}억`;
  }
  return `${만원.toLocaleString("ko-KR")}만`;
};

// 서버 페이지에서 직접 쓰이므로 canvas 라이브러리는 useEffect 안에서 lazy-import(SSR 안전).
export const 단지_라인차트 = ({ 데이터 }: 속성) => {
  const 박스 = useRef<HTMLDivElement>(null);
  const 툴팁 = useRef<HTMLDivElement>(null);
  const 차트 = useRef<IChartApi | null>(null);

  useEffect(() => {
    const el = 박스.current;
    if (!el || 데이터.length === 0) return;
    let 살아있음 = true;

    (async () => {
      const { createChart, LineSeries, LineStyle, ColorType } = await import(
        "lightweight-charts"
      );
      if (!살아있음 || !박스.current) return;

      const chart = createChart(el, {
        autoSize: true,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#8b95a1",
          attributionLogo: true,
          fontFamily: "inherit",
        },
        grid: {
          vertLines: { visible: false },
          horzLines: { color: "#f2f4f6" },
        },
        rightPriceScale: { borderColor: "#e5e8eb" },
        timeScale: { borderColor: "#e5e8eb" },
      });
      차트.current = chart;

      const 공통 = { priceLineVisible: false, lastValueVisible: false } as const;
      const 매매 = chart.addSeries(LineSeries, { ...공통, color: "#f04452", lineWidth: 2 });
      const 전세 = chart.addSeries(LineSeries, {
        ...공통,
        color: "#12b886",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
      });

      const 정렬 = [...데이터].sort((a, b) => a.년월.localeCompare(b.년월));
      const 시각 = (년월: string) => `${년월}-01` as Time; // YYYY-MM → 월 첫날
      매매.setData(
        정렬
          .filter((d) => d.매매_중위_만원 != null)
          .map((d) => ({ time: 시각(d.년월), value: d.매매_중위_만원! })),
      );
      전세.setData(
        정렬
          .filter((d) => d.전세_중위_만원 != null)
          .map((d) => ({ time: 시각(d.년월), value: d.전세_중위_만원! })),
      );

      chart.subscribeCrosshairMove((param) => {
        const box = 툴팁.current;
        if (!box) return;
        if (!param.time || !param.point) {
          box.style.display = "none";
          return;
        }
        const gv = (s: typeof 매매) =>
          (param.seriesData.get(s) as { value?: number } | undefined)?.value;
        const m = gv(매매), j = gv(전세);
        box.innerHTML =
          `<div style="font-weight:800">${String(param.time).slice(0, 7)}</div>` +
          `<div style="color:#f04452">매매 <b>${만원_포맷(m)}</b></div>` +
          `<div style="color:#12b886">전세 <b>${만원_포맷(j)}</b></div>`;
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
  }, [데이터]);

  if (데이터.length === 0) {
    return (
      <div className="border hairline p-16 text-center text-[var(--color-ink-3)] text-[14px]">
        해당 단지의 거래 기록이 없습니다. 단지명을 다시 확인해보세요.
      </div>
    );
  }

  return (
    <div className="toss-card p-4 relative">
      <div className="flex items-center gap-3 mb-2 text-[11px] font-medium text-[var(--color-ink-3)]">
        <span className="flex items-center gap-1">
          <i className="inline-block w-3 h-[2px] bg-[#f04452]" /> 매매 중위
        </span>
        <span className="flex items-center gap-1">
          <i className="inline-block w-3 h-[2px] bg-[#12b886]" /> 전세 중위
        </span>
      </div>
      <div ref={박스} className="w-full" style={{ height: 400 }} />
      <div
        ref={툴팁}
        className="pointer-events-none absolute z-10 hidden rounded-lg bg-[var(--color-bg)] px-3 py-2 text-[11px] leading-tight shadow-[0_4px_16px_rgba(0,0,0,0.12)] border hairline num"
        style={{ display: "none" }}
      />
    </div>
  );
};
