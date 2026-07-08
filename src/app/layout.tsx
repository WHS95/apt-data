import type { Metadata } from "next";
import "./globals.css";
import { 상단_헤더 } from "../presentation/components/상단_헤더";
import { 우측_패널 } from "../presentation/components/우측_패널";
import { 하단_푸터 } from "../presentation/components/하단_푸터";
import { 애드센스_스크립트 } from "../presentation/components/애드센스_스크립트";

// 우측_패널이 client component가 되어 layout에서 직접 사용 가능

export const metadata: Metadata = {
  title: "APT DATA — 아파트 실거래가 데이터",
  description:
    "호가·광고가 아니라 정부에 신고된 아파트 실거래가만으로 본다. 단지 추천부터 서울 지도·전세가율까지, 데이터 기준으로만.",
};

export default function 루트_레이아웃({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <애드센스_스크립트 />
        <상단_헤더 />
        <div className="flex min-h-[calc(100vh-60px)]">
          <main className="flex-1 min-w-0 fade-in">{children}</main>
          <우측_패널 />
        </div>
        <하단_푸터 />
      </body>
    </html>
  );
}
