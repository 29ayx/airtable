import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { bases, tables, columns, cells, rows, views } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export const baseRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [base] = await ctx.db.insert(bases).values({
        name: input.name,
        description: input.description,
        userId: ctx.session.user.id,
      }).returning();
      
      if (!base) {
        throw new Error("Failed to create base");
      }
      
      // Create default table
      const [table] = await ctx.db.insert(tables).values({
        name: "Table 1",
        baseId: base.id,
      }).returning();

      if (!table) {
        throw new Error("Failed to create table");
      }

      // Create template columns: Name, Age, Email
      const templateColumns = [
        { name: "Name", type: "text", order: 0 },
        { name: "Age", type: "number", order: 1 },
        { name: "Email", type: "text", order: 2 },
      ];

      const createdColumns = await ctx.db.insert(columns).values(
        templateColumns.map(col => ({
          name: col.name,
          type: col.type,
          tableId: table.id,
          order: col.order,
        }))
      ).returning();

      // Create 3 demo rows with sample data
      const demoData = [
        { name: "John Doe", age: "30", email: "john@example.com" },
        { name: "Jane Smith", age: "25", email: "jane@example.com" },
        { name: "Bob Johnson", age: "35", email: "bob@example.com" },
      ];

      for (let i = 0; i < demoData.length; i++) {
        const demoRow = demoData[i];
        
        // Create row entry
        const [newRow] = await ctx.db
          .insert(rows)
          .values({
            tableId: table.id,
            order: i,
          })
          .returning();

        if (newRow) {
          // Create cells for each column with demo data
          const cellsToInsert = [];
          for (const column of createdColumns) {
            let value = "";
            if (column.name === "Name") value = demoRow!.name;
            else if (column.name === "Age") value = demoRow!.age;
            else if (column.name === "Email") value = demoRow!.email;

            cellsToInsert.push({
              tableId: table.id,
              columnId: column.id,
              rowId: newRow.id,
              value: value,
            });
          }

          if (cellsToInsert.length > 0) {
            await ctx.db.insert(cells).values(cellsToInsert);
          }
        }
      }
      
      return base;
    }),

  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.db
        .select()
        .from(bases)
        .where(eq(bases.userId, ctx.session.user.id))
        .orderBy(bases.createdAt);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [base] = await ctx.db
        .select()
        .from(bases)
        .where(and(eq(bases.id, input.id), eq(bases.userId, ctx.session.user.id)));
      
      return base;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First verify ownership
      const [baseToDelete] = await ctx.db
        .select()
        .from(bases)
        .where(and(eq(bases.id, input.id), eq(bases.userId, ctx.session.user.id)));

      if (!baseToDelete) {
        throw new Error("Base not found or unauthorized");
      }

      // Get all tables for this base
      const baseTables = await ctx.db
        .select()
        .from(tables)
        .where(eq(tables.baseId, input.id));

      // Delete in correct order to avoid foreign key constraints
      for (const table of baseTables) {
        // Delete views first (they reference tables)
        await ctx.db.delete(views).where(eq(views.tableId, table.id));
        // Delete cells
        await ctx.db.delete(cells).where(eq(cells.tableId, table.id));
        // Delete rows
        await ctx.db.delete(rows).where(eq(rows.tableId, table.id));
        // Delete columns
        await ctx.db.delete(columns).where(eq(columns.tableId, table.id));
        // Finally delete the table
        await ctx.db.delete(tables).where(eq(tables.id, table.id));
      }

      // Finally, delete the base
      await ctx.db.delete(bases).where(eq(bases.id, input.id));

      return { success: true };
    }),

  rename: protectedProcedure
    .input(z.object({ 
      id: z.string(),
      name: z.string().min(1).max(255)
    }))
    .mutation(async ({ ctx, input }) => {
      // First verify ownership
      const [baseToUpdate] = await ctx.db
        .select()
        .from(bases)
        .where(eq(bases.id, input.id) && eq(bases.userId, ctx.session.user.id));

      if (!baseToUpdate) {
        throw new Error("Base not found or unauthorized");
      }

      // Update the base name
      const [updatedBase] = await ctx.db
        .update(bases)
        .set({ name: input.name })
        .where(eq(bases.id, input.id))
        .returning();

      return updatedBase;
    }),
});
