import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { bases, tables, columns, cells, rows } from "@/server/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const tableRouter = createTRPCRouter({
  // Get table with columns and data for a base
  getTableData: protectedProcedure
    .input(z.object({ baseId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get base and verify ownership
      const [base] = await ctx.db
        .select()
        .from(bases)
        .where(and(eq(bases.id, input.baseId), eq(bases.userId, ctx.session.user.id)));

      if (!base) throw new Error("Base not found");

      // Get or create default table
      let [table] = await ctx.db
        .select()
        .from(tables)
        .where(eq(tables.baseId, input.baseId));

      if (!table) {
        [table] = await ctx.db
          .insert(tables)
          .values({
            name: "Table 1",
            baseId: input.baseId,
          })
          .returning();
      }

      // Get columns
      const tableColumns = await ctx.db
        .select()
        .from(columns)
        .where(eq(columns.tableId, table.id))
        .orderBy(columns.order);

      // Get all rows with proper ordering
      const tableRows = await ctx.db
        .select()
        .from(rows)
        .where(eq(rows.tableId, table.id))
        .orderBy(rows.order, rows.createdAt);

      // Get all cells
      const allCells = await ctx.db
        .select()
        .from(cells)
        .where(eq(cells.tableId, table.id));

      // Group cells by rowId
      const cellsMap = new Map<string, Record<string, string>>();
      allCells.forEach(cell => {
        if (!cellsMap.has(cell.rowId)) {
          cellsMap.set(cell.rowId, {});
        }
        cellsMap.get(cell.rowId)![cell.columnId] = cell.value || "";
      });

      // Convert to array format with proper ordering
      const rowsData = tableRows.map(row => ({
        id: row.id,
        order: row.order,
        createdAt: row.createdAt,
        ...cellsMap.get(row.id) || {},
      }));

      return {
        table,
        columns: tableColumns,
        rows: rowsData,
      };
    }),

  // Add column
  addColumn: protectedProcedure
    .input(z.object({
      baseId: z.string(),
      name: z.string().min(1),
      type: z.string().default("text"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify base ownership
      const [base] = await ctx.db
        .select()
        .from(bases)
        .where(and(eq(bases.id, input.baseId), eq(bases.userId, ctx.session.user.id)));

      if (!base) throw new Error("Base not found");

      // Get table
      const [table] = await ctx.db
        .select()
        .from(tables)
        .where(eq(tables.baseId, input.baseId));

      if (!table) throw new Error("Table not found");

      // Get max order
      const [maxOrder] = await ctx.db
        .select({ max: columns.order })
        .from(columns)
        .where(eq(columns.tableId, table.id))
        .orderBy(desc(columns.order))
        .limit(1);

      const [newColumn] = await ctx.db
        .insert(columns)
        .values({
          name: input.name,
          type: input.type,
          tableId: table.id,
          order: (maxOrder?.max || 0) + 1,
        })
        .returning();

      return newColumn;
    }),

  // Delete column
  deleteColumn: protectedProcedure
    .input(z.object({
      baseId: z.string(),
      columnId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify base ownership
      const [base] = await ctx.db
        .select()
        .from(bases)
        .where(and(eq(bases.id, input.baseId), eq(bases.userId, ctx.session.user.id)));

      if (!base) throw new Error("Base not found");

      // Delete all cells for this column
      await ctx.db
        .delete(cells)
        .where(eq(cells.columnId, input.columnId));

      // Delete column
      await ctx.db
        .delete(columns)
        .where(eq(columns.id, input.columnId));

      return { success: true };
    }),

  // Update column name
  updateColumnName: protectedProcedure
    .input(z.object({
      baseId: z.string(),
      columnId: z.string(),
      name: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify base ownership
      const [base] = await ctx.db
        .select()
        .from(bases)
        .where(and(eq(bases.id, input.baseId), eq(bases.userId, ctx.session.user.id)));

      if (!base) throw new Error("Base not found");

      const [updatedColumn] = await ctx.db
        .update(columns)
        .set({ name: input.name })
        .where(eq(columns.id, input.columnId))
        .returning();

      return updatedColumn;
    }),

  // Add row
  addRow: protectedProcedure
    .input(z.object({
      baseId: z.string(),
      tempRowId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify base ownership
      const [base] = await ctx.db
        .select()
        .from(bases)
        .where(and(eq(bases.id, input.baseId), eq(bases.userId, ctx.session.user.id)));

      if (!base) throw new Error("Base not found");

      // Get table
      const [table] = await ctx.db
        .select()
        .from(tables)
        .where(eq(tables.baseId, input.baseId));

      if (!table) throw new Error("Table not found");

      // Get all columns
      const tableColumns = await ctx.db
        .select()
        .from(columns)
        .where(eq(columns.tableId, table.id));

      // Get max order for new row positioning
      const [maxOrder] = await ctx.db
        .select({ max: rows.order })
        .from(rows)
        .where(eq(rows.tableId, table.id))
        .orderBy(desc(rows.order))
        .limit(1);

      // Create new row entry
      const [newRow] = await ctx.db
        .insert(rows)
        .values({
          tableId: table.id,
          order: (maxOrder?.max || 0) + 1,
        })
        .returning();

      // Create empty cells for each column
      if (tableColumns.length > 0) {
        await ctx.db.insert(cells).values(
          tableColumns.map(col => ({
            tableId: table.id,
            columnId: col.id,
            rowId: newRow.id,
            value: "",
          }))
        );
      }

      return { 
        id: newRow.id,
        order: newRow.order,
        createdAt: newRow.createdAt,
        tempRowId: input.tempRowId,
      };
    }),

  // Delete row
  deleteRow: protectedProcedure
    .input(z.object({
      baseId: z.string(),
      rowId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify base ownership
      const [base] = await ctx.db
        .select()
        .from(bases)
        .where(and(eq(bases.id, input.baseId), eq(bases.userId, ctx.session.user.id)));

      if (!base) throw new Error("Base not found");

      // Get table
      const [table] = await ctx.db
        .select()
        .from(tables)
        .where(eq(tables.baseId, input.baseId));

      if (!table) throw new Error("Table not found");

      // Delete all cells for this row
      await ctx.db
        .delete(cells)
        .where(and(eq(cells.tableId, table.id), eq(cells.rowId, input.rowId)));

      // Delete row entry
      await ctx.db
        .delete(rows)
        .where(eq(rows.id, input.rowId));

      return { success: true };
    }),

  // Update cell value
  updateCell: protectedProcedure
    .input(z.object({
      baseId: z.string(),
      rowId: z.string(),
      columnId: z.string(),
      value: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify base ownership
      const [base] = await ctx.db
        .select()
        .from(bases)
        .where(and(eq(bases.id, input.baseId), eq(bases.userId, ctx.session.user.id)));

      if (!base) throw new Error("Base not found");

      // Get table
      const [table] = await ctx.db
        .select()
        .from(tables)
        .where(eq(tables.baseId, input.baseId));

      if (!table) throw new Error("Table not found");

      // Update or insert cell
      const [existingCell] = await ctx.db
        .select()
        .from(cells)
        .where(and(
          eq(cells.tableId, table.id),
          eq(cells.rowId, input.rowId),
          eq(cells.columnId, input.columnId)
        ));

      if (existingCell) {
        await ctx.db
          .update(cells)
          .set({ value: input.value })
          .where(eq(cells.id, existingCell.id));
      } else {
        await ctx.db
          .insert(cells)
          .values({
            tableId: table.id,
            rowId: input.rowId,
            columnId: input.columnId,
            value: input.value,
          });
      }

      return { success: true };
    }),
});
