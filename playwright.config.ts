import { defineConfig, devices } from "@playwright/test";

// E2E: next dev 서버를 자동 기동(이미 떠 있으면 재사용)해 실제 DB 기반으로 검증한다.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: 4,
  globalSetup: "./e2e/전역_준비.ts",
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // 프로덕션 빌드로 테스트 — dev 서버는 온디맨드 컴파일 경쟁으로 간헐 500
    // (__webpack_modules__ TypeError)이 나서 E2E 신뢰성이 없다.
    // 서버가 이미 3000에 떠 있으면 그걸 재사용한다(로컬 반복 실행용).
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
