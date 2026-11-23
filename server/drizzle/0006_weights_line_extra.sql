ALTER TABLE "voucher_lines" ADD COLUMN "weight" numeric;--> statement-breakpoint
ALTER TABLE "voucher_lines" ADD COLUMN "legacy_code" varchar(40);--> statement-breakpoint
ALTER TABLE "voucher_lines" ADD COLUMN "extra" jsonb;--> statement-breakpoint
ALTER TABLE "vouchers" ADD COLUMN "total_weight" numeric;