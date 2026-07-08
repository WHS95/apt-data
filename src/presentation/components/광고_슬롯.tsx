"use client";

import { useEffect } from "react";
import { 애드센스_클라이언트, 애드센스_활성 } from "../../config/수익화";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// 애드센스 광고 슬롯 하나. 게시자 ID와 슬롯 ID가 모두 있어야 렌더됩니다.
// 슬롯 ID는 애드센스 콘솔에서 광고 단위를 만들면 발급됩니다(예: 1234567890).
export const 광고_슬롯 = ({
  슬롯,
  형식 = "auto",
  className,
}: {
  슬롯: string;
  형식?: string;
  className?: string;
}) => {
  useEffect(() => {
    if (!애드센스_활성 || !슬롯) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 스크립트 로드 전이거나 차단된 경우 조용히 무시
    }
  }, [슬롯]);

  if (!애드센스_활성 || !슬롯) return null;

  return (
    <ins
      className={`adsbygoogle${className ? ` ${className}` : ""}`}
      style={{ display: "block" }}
      data-ad-client={애드센스_클라이언트}
      data-ad-slot={슬롯}
      data-ad-format={형식}
      data-full-width-responsive="true"
    />
  );
};
