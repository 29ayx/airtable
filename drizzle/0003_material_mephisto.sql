CREATE TABLE "airtable_row" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"tableId" varchar(255) NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "airtable_row" ADD CONSTRAINT "airtable_row_tableId_airtable_table_id_fk" FOREIGN KEY ("tableId") REFERENCES "public"."airtable_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "row_table_id_idx" ON "airtable_row" USING btree ("tableId");--> statement-breakpoint
CREATE INDEX "row_order_idx" ON "airtable_row" USING btree ("tableId","order");--> statement-breakpoint
CREATE INDEX "row_created_at_idx" ON "airtable_row" USING btree ("tableId","createdAt");