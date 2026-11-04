ALTER TABLE "vouchers" ADD COLUMN "agent_id" integer;--> statement-breakpoint
ALTER TABLE "vouchers" ADD COLUMN "order_mode" varchar(30);--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_agent_id_accounts_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;