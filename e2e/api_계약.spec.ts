import { test, expect } from "@playwright/test";

// API 계약: 200 + JSON 응답, 핵심 파라미터 동작, 빌드 API 경로 화이트리스트(fail-closed)
const JSON_GET_경로들 = [
  "/api/budget?예산=60000",
  "/api/trend",
  "/api/jeonse",
  "/api/presale",
  "/api/admin/status",
];

for (const 경로 of JSON_GET_경로들) {
  test(`GET ${경로}`, async ({ request }) => {
    const 응답 = await request.get(경로);
    expect(응답.status(), `${경로} HTTP 상태`).toBe(200);
    const 본문 = await 응답.json();
    expect(본문, `${경로} JSON 본문`).toBeTruthy();
  });
}

test("POST /api/region — 권역 비교", async ({ request }) => {
  const 응답 = await request.post("/api/region", {
    data: { 시군구_코드_목록: ["11305", "11350"] },
  });
  expect(응답.status()).toBe(200);
  const 본문 = await 응답.json();
  expect(본문).toHaveProperty("데이터");
});

test("POST /api/favorites — 시세 조회(변이 없음)", async ({ request }) => {
  const 응답 = await request.post("/api/favorites", {
    data: { 단지들: [{ 시군구_코드: "11305", 단지명: "SK북한산시티" }] },
  });
  expect(응답.status()).toBe(200);
  const 본문 = await 응답.json();
  expect(본문).toHaveProperty("데이터");
});

test("POST /api/favorites — 잘못된 본문도 안전 처리", async ({ request }) => {
  const 응답 = await request.post("/api/favorites", {
    data: { 단지들: [{ 이상한키: 1 }, null, "문자열"] },
  });
  expect(응답.status()).toBe(200);
});

test("카드 빌드 API — 화이트리스트 밖 경로는 400 (임의 파일 실행 차단)", async ({
  request,
}) => {
  for (const 나쁜경로 of [
    "../../etc/passwd.json",
    "src/studio/../../package.json",
    "src/app/page.tsx",
  ]) {
    const 응답 = await request.post("/admin/cards/build", {
      data: { cardsFile: 나쁜경로 },
    });
    expect(응답.status(), `cardsFile=${나쁜경로}`).toBe(400);
  }
});
