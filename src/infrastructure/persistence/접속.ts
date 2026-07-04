import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as 스키마 from "./스키마";

const 연결_문자열 = process.env.DATABASE_URL;
if (!연결_문자열) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL 환경변수가 설정되어 있지 않습니다.");
  }
  console.warn("[DB] DATABASE_URL 미설정 — 빌드 단계용 더미 연결을 사용합니다.");
}

declare global {
  var __pg_client__: ReturnType<typeof postgres> | undefined;
}

const 클라이언트 =
  globalThis.__pg_client__ ??
  postgres(연결_문자열 ?? "postgres://localhost:5432/shinhon", {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__pg_client__ = 클라이언트;
}

export const DB = drizzle(클라이언트, { schema: 스키마 });
export type DB_타입 = typeof DB;
