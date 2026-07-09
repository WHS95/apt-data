import { test, expect } from "@playwright/test";

// 관심(하트) 상태 변이: 추천 목록에서 등록 → localStorage 반영 →
// 관심 페이지에서 시세와 함께 표시 → 해제 → 빈 상태 복귀.
// 컨텍스트는 테스트마다 새로 만들어지므로 localStorage는 항상 빈 채로 시작한다.
test("관심 등록 → 관심 페이지 반영 → 해제", async ({ page }) => {
  // 0) 빈 상태 확인
  await page.goto("/favorites");
  await expect(page.getByRole("main").getByText("관심 단지가 없습니다")).toBeVisible();

  // 1) 추천 목록에서 첫 하트 클릭 → 등록
  await page.goto("/picks");
  const 하트 = page.getByRole("button", { name: "관심 등록" }).first();
  await 하트.click();
  await expect(
    page.getByRole("button", { name: "관심 해제" }).first(),
    "하트가 활성(해제 가능) 상태로 바뀌어야 함",
  ).toBeVisible();

  // localStorage에 실제로 저장됐는지 + 어떤 단지인지 확보
  const 저장된 = await page.evaluate(() => {
    const raw = localStorage.getItem("shinhon-favorites");
    return raw ? (JSON.parse(raw) as { 단지명: string; 시군구_코드: string }[]) : [];
  });
  expect(저장된).toHaveLength(1);
  const 단지명 = 저장된[0].단지명;

  // 2) 관심 페이지: 등록한 단지가 시세(POST /api/favorites)와 함께 뜬다
  const 시세_응답 = page.waitForResponse(
    (r) => r.url().includes("/api/favorites") && r.request().method() === "POST",
  );
  await page.goto("/favorites");
  // 단지명 링크는 카드 제목·하단 행 두 곳에 뜬다 — 하나만 확인하면 충분
  await expect(page.getByRole("link", { name: 단지명 }).first()).toBeVisible();
  expect((await 시세_응답).status()).toBe(200);

  // 3) 해제 → 빈 상태 복귀 + localStorage 비워짐
  await page.getByRole("button", { name: "관심 해제" }).first().click();
  await expect(page.getByRole("main").getByText("관심 단지가 없습니다")).toBeVisible();
  const 남은 = await page.evaluate(
    () => JSON.parse(localStorage.getItem("shinhon-favorites") ?? "[]").length,
  );
  expect(남은).toBe(0);
});

test("관심 등록은 다른 탭(새 페이지)에도 전파된다 — storage 이벤트", async ({
  context,
}) => {
  const 탭1 = await context.newPage();
  await 탭1.goto("/favorites");
  await expect(탭1.getByRole("main").getByText("관심 단지가 없습니다")).toBeVisible();

  const 탭2 = await context.newPage();
  await 탭2.goto("/picks");
  await 탭2.getByRole("button", { name: "관심 등록" }).first().click();
  await expect(탭2.getByRole("button", { name: "관심 해제" }).first()).toBeVisible();

  // 탭1은 새로고침 없이 storage 이벤트로 갱신되어야 한다
  await expect(탭1.getByRole("main").getByText("관심 단지가 없습니다")).toHaveCount(0);
});
