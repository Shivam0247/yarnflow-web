ALTER TABLE "accounts" ADD COLUMN "collection_person_id" integer;--> statement-breakpoint
ALTER TABLE "vouchers" ADD COLUMN "collection_person_id" integer;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_collection_person_id_sales_persons_id_fk" FOREIGN KEY ("collection_person_id") REFERENCES "public"."sales_persons"("id") ON DELETE no action ON UPDATE no action;