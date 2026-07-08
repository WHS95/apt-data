import Script from "next/script";
import { 애드센스_클라이언트, 애드센스_활성 } from "../../config/수익화";

// 애드센스 로더 — 게시자 ID가 설정된 경우에만 스크립트를 주입합니다.
// (미배포/미승인 상태에서는 아무것도 로드하지 않아 성능·콘솔에 무영향)
// layout에서 1회만 렌더(body 최상단이면 충분 — next/script afterInteractive).
// ※ 애드센스 "사이트 소유 확인"이 스크립트 방식으로 실패하면 메타태그/ads.txt 방식으로 대체.
export const 애드센스_스크립트 = () => {
  if (!애드센스_활성) return null;

  return (
    <Script
      id="adsbygoogle-init"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${애드센스_클라이언트}`}
    />
  );
};
