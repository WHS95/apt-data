ALTER TABLE "transaction" ADD COLUMN "trade_method" text;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "price_outlier" boolean DEFAULT false NOT NULL;