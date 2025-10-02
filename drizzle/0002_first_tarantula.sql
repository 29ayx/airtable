CREATE TABLE "airtable_cell" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"tableId" varchar(255) NOT NULL,
	"columnId" varchar(255) NOT NULL,
	"rowId" varchar(255) NOT NULL,
	"value" text,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "airtable_column" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) DEFAULT 'text' NOT NULL,
	"tableId" varchar(255) NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "airtable_table" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"baseId" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "airtable_cell" ADD CONSTRAINT "airtable_cell_tableId_airtable_table_id_fk" FOREIGN KEY ("tableId") REFERENCES "public"."airtable_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "airtable_cell" ADD CONSTRAINT "airtable_cell_columnId_airtable_column_id_fk" FOREIGN KEY ("columnId") REFERENCES "public"."airtable_column"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "airtable_column" ADD CONSTRAINT "airtable_column_tableId_airtable_table_id_fk" FOREIGN KEY ("tableId") REFERENCES "public"."airtable_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "airtable_table" ADD CONSTRAINT "airtable_table_baseId_airtable_base_id_fk" FOREIGN KEY ("baseId") REFERENCES "public"."airtable_base"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cell_table_row_idx" ON "airtable_cell" USING btree ("tableId","rowId");--> statement-breakpoint
CREATE INDEX "cell_column_idx" ON "airtable_cell" USING btree ("columnId");--> statement-breakpoint
CREATE INDEX "cell_row_column_idx" ON "airtable_cell" USING btree ("rowId","columnId");--> statement-breakpoint
CREATE INDEX "column_table_id_idx" ON "airtable_column" USING btree ("tableId");--> statement-breakpoint
CREATE INDEX "column_order_idx" ON "airtable_column" USING btree ("tableId","order");--> statement-breakpoint
CREATE INDEX "table_base_id_idx" ON "airtable_table" USING btree ("baseId");--> statement-breakpoint
CREATE INDEX "table_name_idx" ON "airtable_table" USING btree ("name");