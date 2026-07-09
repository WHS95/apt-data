import type { FullConfig } from "@playwright/test";

// dev 서버는 라우트를 첫 방문 때 컴파일한다 — 테스트 전 전 라우트를 한 번씩 데워
// 첫 실행에서의 타임아웃 플레이크를 없앤다. (webServer 기동 후 실행됨)
const 워밍업_경로들 = [
  "/",
  "/picks",
  "/picks/detail",
  "/buyzone",
  "/trend",
  "/seoul-map",
  "/budget",
  "/jeonse",
  "/region",
  "/presale",
  "/size-trend",
  "/favorites",
  "/signal",
  "/admin",
  "/admin/cards",
  "/admin/raw",
];

export default async function 전역_준비(config: FullConfig) {
  const base =
    (config.projects[0]?.use?.baseURL as string | undefined) ??
    "http://localhost:3000";
  for (const 경로 of 워밍업_경로들) {
    try {
      await fetch(base + 경로, { signal: AbortSignal.timeout(60_000) });
    } catch {
      // 워밍업 실패는 무시 — 본 테스트가 실제 상태를 판정한다
    }
  }
}
