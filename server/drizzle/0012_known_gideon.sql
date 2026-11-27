CREATE TABLE "whatsapp_settings" (
	"company_id" integer PRIMARY KEY NOT NULL,
	"mode" varchar(10) DEFAULT 'linked' NOT NULL,
	"phone_number_id" varchar(40),
	"waba_id" varchar(40),
	"app_id" varchar(40),
	"access_token" text,
	"app_secret" text,
	"verify_token" varchar(80),
	"api_version" varchar(10) DEFAULT 'v23.0' NOT NULL,
	"lang" varchar(10) DEFAULT 'en' NOT NULL,
	"graph_base" varchar(200),
	"display_number" varchar(30),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD COLUMN "meta" jsonb;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD COLUMN "wamid" varchar(120);--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD COLUMN "read_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "whatsapp_wamid" ON "whatsapp_messages" USING btree ("wamid");