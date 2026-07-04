import type { Config } from "drizzle-kit";

export default {
  schema: "./src/infrastructure/persistence/스키마.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/shinhon",
  },
} satisfies Config;
