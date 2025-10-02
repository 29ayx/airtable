CREATE TABLE "airtable_base" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"userId" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "airtable_base" ADD CONSTRAINT "airtable_base_userId_airtable_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."airtable_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "base_user_id_idx" ON "airtable_base" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "base_name_idx" ON "airtable_base" USING btree ("name");