import type { Metadata } from "next";
import "./globals.css";
import { 상단_헤더 } from "../presentation/components/상단_헤더";
import { 우측_패널 } from "../presentation/components/우측_패널";
import { 아이콘_레일 } from "../presentation/components/아이콘_레일";

// 우측_패널이 client component가 되어 layout에서 직접 사용 가능

export const metadata: Metadata = {
  title: "한지 — 신혼부부 첫 집 데이터",
  description:
    "국토교통부 실거래가를 신혼부부 관점으로 다시 본다. 토스 스타일 UI로 단지 추천부터 거래 신뢰도까지.",
};

export default function 루트_레이아웃({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <상단_헤더 />
        <div className="flex min-h-[calc(100vh-60px)]">
          <main className="flex-1 min-w-0 fade-in">{children}</main>
          <우측_패널 />
          <아이콘_레일 />
        </div>
      </body>
    </html>
  );
}
