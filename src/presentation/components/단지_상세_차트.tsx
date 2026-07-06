"use client";

import { useEffect, useRef } from "react";
import type { IChartApi, Time } from "lightweight-charts";
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

// lightweight-charts 로 통일: 월별 매매·전세 중위 라인 + 거래량 히스토그램 + 신고가 마커.
// (개별 거래 산점은 상세 페이지의 거래 표에서 확인)
export const 단지_상세_차트 = ({ 결과, 거래_유형, 기간_연수 = 3 }: 속성) => {
  const 박스 = useRef<HTMLDivElement>(null);
  const 툴팁 = useRef<HTMLDivElement>(null);
  const 차트 = useRef<IChartApi | null>(null);

  const 월별 = 결과.월별_평균;

  useEffect(() => {
    const el = 박스.current;
    if (!el || 월별.length === 0) return;
    let 살아있음 = true;

    (async () => {
      const {
        createChart,
        LineSeries,
        HistogramSeries,
        LineStyle,
        ColorType,
        createSeriesMarkers,
      } = await import("lightweight-charts");
      if (!살아있음 || !박스.current) return;

      // 기간 제한
      const 오늘 = new Date();
      const 컷 =
        기간_연수 > 0
          ? new Date(오늘.getFullYear() - 기간_연수, 오늘.getMonth(), 1)
              .toISOString()
              .slice(0, 7)
          : "1900-01";
      const 표시 = [...월별]
        .filter((m) => m.년월 >= 컷)
        .sort((a, b) => a.년월.localeCompare(b.년월));
      const 시각 = (년월: string) => `${년월}-01` as Time;

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
      const 공통 = { priceLineVisible: false, lastValueVisible: false } as const;

      const 보여_매매 = 거래_유형 !== "2";
      const 보여_전세 = 거래_유형 !== "1";

      let 매매선: ReturnType<typeof chart.addSeries> | null = null;
      if (보여_매매) {
        매매선 = chart.addSeries(LineSeries, { ...공통, color: "#f04452", lineWidth: 2 });
        매매선.setData(
          표시.filter((m) => m.매매_평균 != null).map((m) => ({ time: 시각(m.년월), value: m.매매_평균! })),
        );
      }
      let 전세선: ReturnType<typeof chart.addSeries> | null = null;
      if (보여_전세) {
        전세선 = chart.addSeries(LineSeries, {
          ...공통,
          color: "#12b886",
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
        });
        전세선.setData(
          표시.filter((m) => m.전세_평균 != null).map((m) => ({ time: 시각(m.년월), value: m.전세_평균! })),
        );
      }

      // 거래량 히스토그램(하단 오버레이)
      const 거래량 = chart.addSeries(HistogramSeries, {
        priceScaleId: "vol",
        priceFormat: { type: "volume" },
        color: "#d1d6db",
      });
      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      거래량.setData(
        표시.map((m) => ({
          time: 시각(m.년월),
          value:
            거래_유형 === "1"
              ? m.매매_건수
              : 거래_유형 === "2"
                ? m.전세_건수
                : m.매매_건수 + m.전세_건수,
        })),
      );

      // 신고가(역대 최고가) 마커
      if (보여_매매 && 매매선 && 결과.메타.역대_최고가_월 && 결과.메타.역대_최고가_만원 != null) {
        const 월 = 결과.메타.역대_최고가_월;
        if (월 >= 컷) {
          createSeriesMarkers(매매선, [
            {
              time: 시각(월),
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
        const gv = (s: typeof 매매선) =>
          s ? (param.seriesData.get(s) as { value?: number } | undefined)?.value : undefined;
        const m = gv(매매선), j = gv(전세선);
        const vol = (param.seriesData.get(거래량) as { value?: number } | undefined)?.value;
        box.innerHTML =
          `<div style="font-weight:800">${String(param.time).slice(0, 7)}</div>` +
          (보여_매매 ? `<div style="color:#f04452">매매 <b>${m != null ? 가격_라벨(m) : "—"}</b></div>` : "") +
          (보여_전세 ? `<div style="color:#12b886">전세 <b>${j != null ? 가격_라벨(j) : "—"}</b></div>` : "") +
          `<div style="color:#8b95a1">거래 ${vol ?? 0}건</div>`;
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
  }, [결과, 거래_유형, 기간_연수, 월별]);

  if (월별.length === 0) {
    return (
      <div className="toss-card p-12 text-center text-[var(--color-ink-3)] text-[14px]">
        표시할 거래 추이가 없습니다.
      </div>
    );
  }

  return (
    <div className="toss-card p-4 relative">
      <div className="flex items-center gap-3 mb-2 text-[11px] font-medium text-[var(--color-ink-3)] flex-wrap">
        {거래_유형 !== "2" && (
          <span className="flex items-center gap-1">
            <i className="inline-block w-3 h-[2px] bg-[#f04452]" /> 매매 중위
          </span>
        )}
        {거래_유형 !== "1" && (
          <span className="flex items-center gap-1">
            <i className="inline-block w-3 h-[2px] bg-[#12b886]" /> 전세 중위
          </span>
        )}
        <span className="flex items-center gap-1">
          <i className="inline-block w-2 h-2 bg-[#d1d6db]" /> 거래량
        </span>
        <span style={{ color: "#f04452" }}>▽ 신고가</span>
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
