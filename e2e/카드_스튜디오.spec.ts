import { test, expect } from "@playwright/test";

// 카드 스튜디오 실빌드: 서버가 스튜디오 엔진(build.mjs)을 실행해
// 헤드리스 크롬으로 PNG를 렌더한다 — 무겁기 때문에 타임아웃을 넉넉히,
// 두 빌드가 리소스를 다투지 않게 직렬로 돈다.
test.describe.configure({ mode: "serial" });
test.setTimeout(180_000);

test("정상 카드 빌드 → 전부 통과 + PNG 미리보기·다운로드", async ({ page }) => {
  await page.goto("/admin/cards");
  await page.getByRole("button", { name: /카드 빌드/ }).click();

  // 헤드리스 크롬 렌더 대기
  await expect(page.getByText(/통과 \d+ · 차단 \d+/)).toBeVisible({
    timeout: 120_000,
  });
  await expect(page.getByText(/통과 [1-9]\d* · 차단 0/), "전 카드 통과해야 함").toBeVisible();

  // 미리보기 이미지가 실제로 로드됐는지 (깨진 img가 아니라 naturalWidth > 0)
  const 미리보기 = page.locator('img[src^="/studio/"]').first();
  await expect(미리보기).toBeVisible();
  await expect
    .poll(() => 미리보기.evaluate((el) => (el as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);

  // 다운로드 링크의 PNG를 서버가 정상 서빙하는지
  const 링크 = page.getByRole("link", { name: "PNG 다운로드" }).first();
  const href = await 링크.getAttribute("href");
  expect(href).toBeTruthy();
  const 응답 = await page.request.get(href!);
  expect(응답.status()).toBe(200);
  expect(응답.headers()["content-type"]).toContain("image/png");
});

test("가드레일 시연(나쁜 카드) → 전부 차단 (fail-closed)", async ({ page }) => {
  await page.goto("/admin/cards");
  await page.getByRole("button", { name: /가드레일 시연/ }).click();

  await expect(page.getByText(/통과 \d+ · 차단 \d+/)).toBeVisible({
    timeout: 120_000,
  });
  await expect(page.getByText(/통과 0 · 차단 [1-9]\d*/), "나쁜 카드는 전부 차단").toBeVisible();
  await expect(page.getByText("✗ 차단").first()).toBeVisible();
  // 차단된 카드는 PNG가 나가면 안 된다
  await expect(page.getByRole("link", { name: "PNG 다운로드" })).toHaveCount(0);
});
