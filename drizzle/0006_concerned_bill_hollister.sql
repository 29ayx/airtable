ALTER TABLE "airtable_view" DROP CONSTRAINT "airtable_view_baseId_airtable_base_id_fk";
--> statement-breakpoint
ALTER TABLE "airtable_view" DROP CONSTRAINT "airtable_view_userId_airtable_user_id_fk";
--> statement-breakpoint
DROP INDEX "view_base_idx";--> statement-breakpoint
DROP INDEX "view_user_idx";--> statement-breakpoint
ALTER TABLE "airtable_view" ALTER COLUMN "name" SET DEFAULT 'Grid view';--> statement-breakpoint
ALTER TABLE "airtable_view" ALTER COLUMN "filters" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "airtable_view" ALTER COLUMN "filters" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "airtable_view" ALTER COLUMN "sorts" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "airtable_view" ALTER COLUMN "sorts" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "airtable_view" ALTER COLUMN "hiddenColumns" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "airtable_view" ALTER COLUMN "hiddenColumns" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "airtable_view" ADD COLUMN "tableId" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "airtable_view" ADD COLUMN "isDefault" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "airtable_view" ADD CONSTRAINT "airtable_view_tableId_airtable_table_id_fk" FOREIGN KEY ("tableId") REFERENCES "public"."airtable_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "view_table_id_idx" ON "airtable_view" USING btree ("tableId");--> statement-breakpoint
CREATE INDEX "view_default_idx" ON "airtable_view" USING btree ("tableId","isDefault");--> statement-breakpoint
ALTER TABLE "airtable_view" DROP COLUMN "baseId";--> statement-breakpoint
ALTER TABLE "airtable_view" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "airtable_view" DROP COLUMN "searchTerm";