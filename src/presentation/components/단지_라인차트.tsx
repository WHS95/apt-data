"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

export const 단지_라인차트 = ({ 데이터 }: 속성) => {
  if (데이터.length === 0) {
    return (
      <div className="border hairline p-16 text-center text-[var(--color-ink-3)] text-[14px]">
        해당 단지의 거래 기록이 없습니다. 단지명을 다시 확인해보세요.
      </div>
    );
  }
  return (
    <div className="border hairline bg-[var(--color-surface)] p-6 h-[440px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={데이터} margin={{ top: 8, right: 24, left: 16, bottom: 16 }}>
          <CartesianGrid stroke="#D9D3C5" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="년월"
            stroke="#9A9388"
            tick={{ fontFamily: "JetBrains Mono", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#171513" }}
          />
          <YAxis
            stroke="#9A9388"
            tick={{ fontFamily: "JetBrains Mono", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => 만원_포맷(v)}
            width={80}
          />
          <Tooltip
            contentStyle={{
              background: "#FFFEFA",
              border: "1px solid #171513",
              borderRadius: 0,
              fontFamily: "Pretendard",
              fontSize: 12,
            }}
            formatter={(값: number, 이름: string) => [만원_포맷(값), 이름]}
          />
          <Line
            type="monotone"
            dataKey="매매_중위_만원"
            name="매매 중위"
            stroke="#B33A2A"
            strokeWidth={2}
            dot={{ r: 3, fill: "#171513", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="전세_중위_만원"
            name="전세 중위"
            stroke="#1F5C45"
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={{ r: 3, fill: "#171513", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
