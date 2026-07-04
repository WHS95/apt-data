CREATE TABLE "danji" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sigungu_code" text NOT NULL,
	"emd_code" text,
	"road_name" text,
	"jibun_address" text,
	"thing_type" text NOT NULL,
	"built_year" integer
);
--> statement-breakpoint
CREATE TABLE "collection_state" (
	"key" text PRIMARY KEY NOT NULL,
	"last_collected" date NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sigungu" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sido_code" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sido" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"sido_code" text NOT NULL,
	"sigungu_code" text NOT NULL,
	"emd_code" text,
	"danji_code" text,
	"danji_name" text,
	"road_name" text,
	"jibun" text,
	"thing_type" text NOT NULL,
	"delng_type" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"day" integer NOT NULL,
	"contract_date" date NOT NULL,
	"area_m2" real NOT NULL,
	"floor" integer,
	"built_year" integer,
	"amount_manwon" integer,
	"deposit_manwon" integer,
	"monthly_rent_manwon" integer,
	"cancelled" boolean DEFAULT false NOT NULL,
	"source_file" text,
	"collected_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emd" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sigungu_code" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sigungu" ADD CONSTRAINT "sigungu_sido_code_sido_code_fk" FOREIGN KEY ("sido_code") REFERENCES "public"."sido"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emd" ADD CONSTRAINT "emd_sigungu_code_sigungu_code_fk" FOREIGN KEY ("sigungu_code") REFERENCES "public"."sigungu"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_danji_sigungu" ON "danji" USING btree ("sigungu_code");--> statement-breakpoint
CREATE INDEX "idx_danji_name" ON "danji" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_sigungu_sido" ON "sigungu" USING btree ("sido_code");--> statement-breakpoint
CREATE INDEX "idx_tx_search" ON "transaction" USING btree ("sido_code","thing_type","delng_type","contract_date");--> statement-breakpoint
CREATE INDEX "idx_tx_sigungu" ON "transaction" USING btree ("sigungu_code","contract_date");--> statement-breakpoint
CREATE INDEX "idx_tx_danji" ON "transaction" USING btree ("danji_code","contract_date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tx_natural" ON "transaction" USING btree ("sigungu_code","danji_name","contract_date","area_m2","floor","amount_manwon","deposit_manwon","delng_type");--> statement-breakpoint
CREATE INDEX "idx_emd_sigungu" ON "emd" USING btree ("sigungu_code");