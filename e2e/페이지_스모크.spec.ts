import { test, expect, type Page } from "@playwright/test";

// 전체 페이지 스모크: 200 응답 + 페이지 고유 제목 렌더 + 런타임 예외 없음
const 페이지들: { 경로: string; 제목: string | RegExp }[] = [
  { 경로: "/", 제목: /실거래/ },
  { 경로: "/picks", 제목: "단지 추천" },
  { 경로: "/buyzone", 제목: "수도권 매수 추천" },
  { 경로: "/trend", 제목: "단지 가격 추이" },
  { 경로: "/seoul-map", 제목: "서울 아파트 지도" },
  { 경로: "/budget", 제목: "예산별 매물 분포" },
  { 경로: "/jeonse", 제목: "전세가율 히트맵" },
  { 경로: "/region", 제목: "권역 비교" },
  { 경로: "/presale", 제목: "분양 캘린더" },
  { 경로: "/size-trend", 제목: "평형대별 상승률" },
  { 경로: "/favorites", 제목: "관심 단지" },
  { 경로: "/signal", 제목: "상승 신호" },
  { 경로: "/admin", 제목: "관리자" },
  { 경로: "/admin/cards", 제목: "카드 스튜디오" },
];

const 예외_수집 = (page: Page) => {
  const 예외들: string[] = [];
  page.on("pageerror", (e) => 예외들.push(e.message));
  return 예외들;
};

for (const { 경로, 제목 } of 페이지들) {
  test(`${경로} 렌더`, async ({ page }) => {
    const 예외들 = 예외_수집(page);
    const 응답 = await page.goto(경로);
    expect(응답?.status(), `${경로} HTTP 상태`).toBe(200);
    await expect(page.locator("h1").first()).toContainText(제목);
    // 앱 크롬(헤더 로고)이 함께 렌더되는지 — admin/raw 등 별도 헤더 페이지는 제외
    await expect(page.locator("header").first()).toBeVisible();
    expect(예외들, `${경로} 런타임 예외: ${예외들.join(" | ")}`).toHaveLength(0);
  });
}

test("/admin/raw 렌더 (별도 헤더)", async ({ page }) => {
  const 응답 = await page.goto("/admin/raw");
  expect(응답?.status()).toBe(200);
});

test("존재하지 않는 경로는 404", async ({ page }) => {
  const 응답 = await page.goto("/없는페이지");
  expect(응답?.status()).toBe(404);
});
