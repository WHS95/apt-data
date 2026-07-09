import { test, expect, type Page } from "@playwright/test";

// 핵심 사용자 여정: 홈 → 추천 → 단지상세 → 필터/검색, 관리자 → 카드 스튜디오
const 첫_단지상세로_이동 = async (page: Page) => {
  await page.goto("/picks");
  // 추천 행은 <a>가 아니라 role="link" div (onClick → router.push)
  const 첫_행 = page.locator('div[role="link"]').first();
  await expect(첫_행).toBeVisible();
  await 첫_행.click();
  await page.waitForURL(/\/picks\/detail\?/);
};

test("홈 → 헤더 네비로 단지추천 이동", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("실거래");
  await page.getByRole("link", { name: "단지추천" }).first().click();
  await page.waitForURL(/\/picks/);
  await expect(page.locator("h1").first()).toContainText("단지 추천");
});

test("추천 목록 → 단지상세 진입 (실데이터 링크)", async ({ page }) => {
  await 첫_단지상세로_이동(page);
  // 상세 필터 컨트롤(거래유형 pill)이 렌더되면 상세 화면 성립
  await expect(page.getByRole("button", { name: "매매", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "전체 평형" })).toBeVisible();
});

test("단지상세 필터 변경 시 URL 갱신 + 화면 상단 튐 없음 (scroll:false 회귀)", async ({
  page,
}) => {
  await 첫_단지상세로_이동(page);
  await expect(page.getByRole("button", { name: "매매", exact: true })).toBeVisible();

  // 아래로 스크롤해 둔 상태에서 필터를 바꾼다
  await page.evaluate(() => window.scrollTo(0, 400));
  await expect
    .poll(() => page.evaluate(() => window.scrollY), { message: "스크롤 선행" })
    .toBeGreaterThan(200);

  // 주의: 일반 click()은 화면 밖 버튼을 뷰포트로 자동 스크롤해 측정을 오염시킨다
  // — JS 클릭으로 스크롤 위치를 건드리지 않고 이벤트만 발생시킨다.
  await page
    .getByRole("button", { name: "매매", exact: true })
    .evaluate((el) => (el as HTMLElement).click());
  await page.waitForURL(/deal=1/);
  // 서버 재렌더가 끝날 때까지 '불러오는 중…' 표시가 사라지길 대기
  await expect(page.getByText("불러오는 중…")).toHaveCount(0);

  const 이후_스크롤 = await page.evaluate(() => window.scrollY);
  expect(이후_스크롤, "필터 변경 후 상단으로 튀면 안 됨").toBeGreaterThan(200);
});

test("단지상세 검색바 → q 파라미터 검색", async ({ page }) => {
  await page.goto("/picks/detail");
  const 입력 = page.locator("form input").first();
  await 입력.fill("주공");
  await 입력.press("Enter");
  await page.waitForURL(/\/picks\/detail\?q=/);
  expect(page.url()).toContain(encodeURIComponent("주공"));
});

test("관리자 → 카드 스튜디오 탭 이동", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.locator("h1").first()).toContainText("관리자");
  await page.getByRole("link", { name: "카드 스튜디오" }).first().click();
  await page.waitForURL(/\/admin\/cards/);
  await expect(page.locator("h1").first()).toContainText("카드 스튜디오");
  // 빌드 버튼(스튜디오 패널)이 렌더됐는지
  await expect(page.getByRole("button", { name: /카드 빌드/ })).toBeVisible();
});
