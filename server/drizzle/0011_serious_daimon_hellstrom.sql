ALTER TABLE "whatsapp_messages" ADD COLUMN "error" text;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD COLUMN "tries" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD COLUMN "picked_at" timestamp with time zone;