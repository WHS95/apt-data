CREATE TABLE "scrape_run" (
	"id" text PRIMARY KEY NOT NULL,
	"sido_code" text NOT NULL,
	"thing_type" text NOT NULL,
	"delng_type" text NOT NULL,
	"chunk_from" date NOT NULL,
	"chunk_to" date NOT NULL,
	"status" text NOT NULL,
	"saved_count" integer DEFAULT 0 NOT NULL,
	"parsed_count" integer DEFAULT 0 NOT NULL,
	"elapsed_ms" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"ran_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrape_config" (
	"key" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"delay_ms" integer DEFAULT 5000 NOT NULL,
	"chunk_months" integer DEFAULT 3 NOT NULL,
	"html_cooldown_ms" integer DEFAULT 600000 NOT NULL,
	"max_retries" integer DEFAULT 5 NOT NULL,
	"years_limit" integer DEFAULT 2 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_run_time" ON "scrape_run" USING btree ("ran_at");--> statement-breakpoint
CREATE INDEX "idx_run_status" ON "scrape_run" USING btree ("status");