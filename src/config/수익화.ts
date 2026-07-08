// 수익화 설정 — 단일 소스(single source of truth).
//
// 배포 후 .env(또는 Vercel 환경변수)에 값만 채우면 광고·구독이 자동으로 켜집니다.
// 값이 비어 있으면 관련 UI는 렌더되지 않으므로, 미설정 상태로 배포해도 안전합니다.
//
// ⚠️ 클라이언트 컴포넌트에서 읽으므로 반드시 NEXT_PUBLIC_ 접두사를 씁니다.
//    Next는 `process.env.NEXT_PUBLIC_FOO` 형태의 "정적 참조"만 번들에 인라인합니다.
//    (process.env[변수] 같은 동적 접근은 클라이언트에서 undefined가 되니 금지)

// 구글 애드센스 게시자 ID — 승인 후 발급되는 값. 예: ca-pub-0000000000000000
export const 애드센스_클라이언트 = (
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? ""
).trim();

// 애드센스 광고 슬롯 ID — 콘솔에서 광고 단위 생성 시 발급(예: 1234567890).
// 배치별로 하나씩. 지금은 우측 사이드바 슬롯만 사용.
export const 애드센스_슬롯_사이드바 = (
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR ?? ""
).trim();

// 카카오톡 채널 URL — "광고 없이 이용하기" 구독 문의 채널. 예: https://pf.kakao.com/_xxxxx
export const 카카오_채널_URL = (
  process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL ?? ""
).trim();

// 쿠팡 파트너스 필수 고지 문구(표시 의무). 쿠팡 링크가 노출되는 화면에 함께 표기합니다.
export const 쿠팡_고지 =
  "이 화면에는 쿠팡 파트너스 활동의 일환으로, 이에 따라 일정액의 수수료를 제공받는 링크가 포함될 수 있습니다.";

// ── 활성 여부 게이트 ──────────────────────────────────────────────
// 값이 유효할 때만 true. 각 컴포넌트는 이 플래그로 렌더를 결정합니다.
export const 애드센스_활성 = 애드센스_클라이언트.startsWith("ca-pub-");
export const 카카오_채널_활성 = /^https?:\/\//.test(카카오_채널_URL);
