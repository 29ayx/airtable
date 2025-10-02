CREATE TABLE "airtable_view" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"baseId" varchar(255) NOT NULL,
	"userId" varchar(255) NOT NULL,
	"filters" json DEFAULT '[]'::json,
	"sorts" json DEFAULT '[]'::json,
	"hiddenColumns" json DEFAULT '[]'::json,
	"searchTerm" varchar(500),
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "airtable_view" ADD CONSTRAINT "airtable_view_baseId_airtable_base_id_fk" FOREIGN KEY ("baseId") REFERENCES "public"."airtable_base"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "airtable_view" ADD CONSTRAINT "airtable_view_userId_airtable_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."airtable_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "view_base_idx" ON "airtable_view" USING btree ("baseId");--> statement-breakpoint
CREATE INDEX "view_user_idx" ON "airtable_view" USING btree ("userId");