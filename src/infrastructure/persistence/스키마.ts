import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const 시도_테이블 = pgTable("sido", {
  코드: text("code").primaryKey(),
  이름: text("name").notNull(),
  생성_시각: timestamp("created_at").defaultNow().notNull(),
});

export const 시군구_테이블 = pgTable(
  "sigungu",
  {
    코드: text("code").primaryKey(),
    이름: text("name").notNull(),
    시도_코드: text("sido_code")
      .notNull()
      .references(() => 시도_테이블.코드),
  },
  (테이블) => ({
    시도_색인: index("idx_sigungu_sido").on(테이블.시도_코드),
  }),
);

export const 읍면동_테이블 = pgTable(
  "emd",
  {
    코드: text("code").primaryKey(),
    이름: text("name").notNull(),
    시군구_코드: text("sigungu_code")
      .notNull()
      .references(() => 시군구_테이블.코드),
  },
  (테이블) => ({
    시군구_색인: index("idx_emd_sigungu").on(테이블.시군구_코드),
  }),
);

export const 단지_테이블 = pgTable(
  "danji",
  {
    코드: text("code").primaryKey(),
    이름: text("name").notNull(),
    시군구_코드: text("sigungu_code").notNull(),
    읍면동_코드: text("emd_code"),
    도로명: text("road_name"),
    지번_주소: text("jibun_address"),
    물건_유형: text("thing_type").notNull(),
    준공_연도: integer("built_year"),
  },
  (테이블) => ({
    시군구_색인: index("idx_danji_sigungu").on(테이블.시군구_코드),
    이름_색인: index("idx_danji_name").on(테이블.이름),
  }),
);

export const 실거래_테이블 = pgTable(
  "transaction",
  {
    ID: text("id").primaryKey(),
    시도_코드: text("sido_code").notNull(),
    시군구_코드: text("sigungu_code").notNull(),
    읍면동_코드: text("emd_code"),
    단지_코드: text("danji_code"),
    단지명: text("danji_name"),
    도로명: text("road_name"),
    지번: text("jibun"),
    물건_유형: text("thing_type").notNull(),
    거래_유형: text("delng_type").notNull(),
    계약_연도: integer("year").notNull(),
    계약_월: integer("month").notNull(),
    계약_일: integer("day").notNull(),
    계약_일자: date("contract_date").notNull(),
    전용_면적_제곱미터: real("area_m2").notNull(),
    층: integer("floor"),
    건축_연도: integer("built_year"),
    거래_금액_만원: integer("amount_manwon"),
    보증금_만원: integer("deposit_manwon"),
    월세_만원: integer("monthly_rent_manwon"),
    해제_여부: boolean("cancelled").default(false).notNull(),
    거래_경위: text("trade_method"),
    가격_이상치: boolean("price_outlier").default(false).notNull(),
    원천_파일명: text("source_file"),
    수집_시각: timestamp("collected_at").defaultNow().notNull(),
  },
  (테이블) => ({
    조회_색인: index("idx_tx_search").on(
      테이블.시도_코드,
      테이블.물건_유형,
      테이블.거래_유형,
      테이블.계약_일자,
    ),
    시군구_색인: index("idx_tx_sigungu").on(테이블.시군구_코드, 테이블.계약_일자),
    단지_색인: index("idx_tx_danji").on(테이블.단지_코드, 테이블.계약_일자),
    // 금액/보증금은 매매↔전세에서 한쪽이 항상 NULL. Postgres unique index 는 NULL 을
    // 서로 다르게 취급하므로 COALESCE(-1) 로 감싸야 실제 중복이 방지된다(재수집 중복 차단).
    중복_방지: uniqueIndex("uq_tx_natural").on(
      테이블.시군구_코드,
      테이블.단지명,
      테이블.계약_일자,
      테이블.전용_면적_제곱미터,
      테이블.층,
      sql`(COALESCE(${테이블.거래_금액_만원}, -1))`,
      sql`(COALESCE(${테이블.보증금_만원}, -1))`,
      테이블.거래_유형,
    ),
  }),
);

export const 수집_상태_테이블 = pgTable("collection_state", {
  키: text("key").primaryKey(),
  마지막_수집일: date("last_collected").notNull(),
  갱신_시각: timestamp("updated_at").defaultNow().notNull(),
});

export const 수집_설정_테이블 = pgTable("scrape_config", {
  키: text("key").primaryKey().default("global"),
  활성: boolean("active").default(true).notNull(),
  요청_딜레이_MS: integer("delay_ms").default(5000).notNull(),
  청크_개월: integer("chunk_months").default(3).notNull(),
  쿨다운_HTML_MS: integer("html_cooldown_ms").default(600000).notNull(),
  최대_재시도: integer("max_retries").default(5).notNull(),
  년수_제한: integer("years_limit").default(2).notNull(),
  갱신_시각: timestamp("updated_at").defaultNow().notNull(),
});

export const 수집_기록_테이블 = pgTable(
  "scrape_run",
  {
    ID: text("id").primaryKey(),
    시도_코드: text("sido_code").notNull(),
    물건_유형: text("thing_type").notNull(),
    거래_유형: text("delng_type").notNull(),
    청크_시작: date("chunk_from").notNull(),
    청크_종료: date("chunk_to").notNull(),
    상태: text("status").notNull(),
    저장_건수: integer("saved_count").default(0).notNull(),
    파싱_건수: integer("parsed_count").default(0).notNull(),
    소요_MS: integer("elapsed_ms").default(0).notNull(),
    오류_메시지: text("error_message"),
    실행_시각: timestamp("ran_at").defaultNow().notNull(),
  },
  (테이블) => ({
    실행_시각_색인: index("idx_run_time").on(테이블.실행_시각),
    상태_색인: index("idx_run_status").on(테이블.상태),
  }),
);
