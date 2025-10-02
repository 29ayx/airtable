import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { bases, tables, columns, cells, rows, views } from "@/server/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const tableRouter = createTRPCRouter({
  // Get all tables for a base
  getAllTables: protectedProcedure
    .input(z.object({ baseId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify base ownership
      const [base] = await ctx.db
        .select()
        .from(bases)
        .where(and(eq(bases.id, input.baseId), eq(bases.userId, ctx.session.user.id)));

      if (!base) throw new Error("Base not found");

      // Get all tables for this base
      const baseTables = await ctx.db
        .select()
        .from(tables)
        .where(eq(tables.baseId, input.baseId))
        .orderBy(tables.createdAt);

      return baseTables;
    }),

  // Get table with columns and data for a specific table
  getTableData: protectedProcedure
    .input(z.object({ 
      baseId: z.string(),
      tableId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      // Get base and verify ownership
      const [base] = await ctx.db
        .select()
        .from(bases)
        .where(and(eq(bases.id, input.baseId), eq(bases.userId, ctx.session.user.id)));

      if (!base) throw new Error("Base not found");

      // Get specific table or first table for the base
      let [table] = input.tableId 
        ? await ctx.db
            .select()
            .from(tables)
            .where(and(eq(tables.id, input.tableId), eq(tables.baseId, input.baseId)))
        : await ctx.db
            .select()
            .from(tables)
            .where(eq(tables.baseId, input.baseId))
            .orderBy(tables.createdAt)
            .limit(1);

      if (!table) {
        // Create default table if none exists
        [table] = await ctx.db
          .insert(tables)
          .values({
            name: "Table 1",
            baseId: input.baseId,
          })
          .returning();
          
        if (!table) {
          throw new Error("Failed to create table");
        }
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
        cellsMap.get(cell.rowId)![cell.columnId] = cell.value ?? "";
      });

      // Convert to array format with proper ordering
      const rowsData = tableRows.map(row => ({
        id: row.id,
        order: row.order,
        createdAt: row.createdAt,
        ...cellsMap.get(row.id) ?? {},
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
      tableId: z.string(),
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
        .where(and(eq(tables.id, input.tableId), eq(tables.baseId, input.baseId)));

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
          order: (maxOrder?.max ?? 0) + 1,
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
      tableId: z.string(),
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
        .where(and(eq(tables.id, input.tableId), eq(tables.baseId, input.baseId)));

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
          order: (maxOrder?.max ?? 0) + 1,
        })
        .returning();

      if (!newRow) {
        throw new Error("Failed to create row");
      }

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
      tableId: z.string(),
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
        .where(and(eq(tables.id, input.tableId), eq(tables.baseId, input.baseId)));

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

  // Create new table
  createTable: protectedProcedure
    .input(z.object({
      baseId: z.string(),
      name: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify base ownership
      const [base] = await ctx.db
        .select()
        .from(bases)
        .where(and(eq(bases.id, input.baseId), eq(bases.userId, ctx.session.user.id)));

      if (!base) throw new Error("Base not found");

      // Create new table
      const [newTable] = await ctx.db
        .insert(tables)
        .values({
          name: input.name,
          baseId: input.baseId,
        })
        .returning();

      if (!newTable) {
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
          tableId: newTable.id,
          order: col.order,
        }))
      ).returning();

      // Create 3 demo rows
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
            tableId: newTable.id,
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
              tableId: newTable.id,
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

      return newTable;
    }),

  // Rename table
  renameTable: protectedProcedure
    .input(z.object({
      baseId: z.string(),
      tableId: z.string(),
      name: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify base ownership
      const [base] = await ctx.db
        .select()
        .from(bases)
        .where(and(eq(bases.id, input.baseId), eq(bases.userId, ctx.session.user.id)));

      if (!base) throw new Error("Base not found");

      // Update table name
      const [updatedTable] = await ctx.db
        .update(tables)
        .set({ name: input.name })
        .where(and(eq(tables.id, input.tableId), eq(tables.baseId, input.baseId)))
        .returning();

      return updatedTable;
    }),

  // Delete table
  deleteTable: protectedProcedure
    .input(z.object({
      baseId: z.string(),
      tableId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify base ownership
      const [base] = await ctx.db
        .select()
        .from(bases)
        .where(and(eq(bases.id, input.baseId), eq(bases.userId, ctx.session.user.id)));

      if (!base) throw new Error("Base not found");

      // Check if this is the last table in the base
      const tableCount = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(tables)
        .where(eq(tables.baseId, input.baseId));

      if ((tableCount[0]?.count ?? 0) <= 1) {
        throw new Error("Cannot delete the last table in a base");
      }

      // Delete in correct order to avoid foreign key constraints
      // Delete cells first
      await ctx.db.delete(cells).where(eq(cells.tableId, input.tableId));
      // Delete rows
      await ctx.db.delete(rows).where(eq(rows.tableId, input.tableId));
      // Delete columns
      await ctx.db.delete(columns).where(eq(columns.tableId, input.tableId));
      // Finally delete the table
      await ctx.db.delete(tables).where(eq(tables.id, input.tableId));

      return { success: true };
    }),

  // Get or create default view for a table
  getTableView: protectedProcedure
    .input(z.object({
      baseId: z.string(),
      tableId: z.string(),
      viewId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify base ownership
      const [base] = await ctx.db
        .select()
        .from(bases)
        .where(and(eq(bases.id, input.baseId), eq(bases.userId, ctx.session.user.id)));

      if (!base) throw new Error("Base not found");

      // Get specific view or default view
      let [view] = input.viewId 
        ? await ctx.db
            .select()
            .from(views)
            .where(eq(views.id, input.viewId))
        : await ctx.db
            .select()
            .from(views)
            .where(and(eq(views.tableId, input.tableId), eq(views.isDefault, true)));

      // Create default view if none exists
      if (!view) {
        [view] = await ctx.db
          .insert(views)
          .values({
            name: "Grid view",
            tableId: input.tableId,
            isDefault: true,
            filters: { type: 'and', conditions: [], groups: [] },
            sorts: [],
            hiddenColumns: [],
          })
          .returning();
      }

      return view;
    }),

  // Update view configuration
  updateView: protectedProcedure
    .input(z.object({
      baseId: z.string(),
      viewId: z.string(),
      name: z.string().optional(),
      filters: z.any().optional(), // ViewFilters type
      sorts: z.any().optional(), // SortConfig[] type
      hiddenColumns: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify base ownership
      const [base] = await ctx.db
        .select()
        .from(bases)
        .where(and(eq(bases.id, input.baseId), eq(bases.userId, ctx.session.user.id)));

      if (!base) throw new Error("Base not found");

      const updateData: Partial<typeof views.$inferInsert> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.filters !== undefined) updateData.filters = input.filters;
      if (input.sorts !== undefined) updateData.sorts = input.sorts;
      if (input.hiddenColumns !== undefined) updateData.hiddenColumns = input.hiddenColumns;

      const [updatedView] = await ctx.db
        .update(views)
        .set(updateData)
        .where(eq(views.id, input.viewId))
        .returning();

      return updatedView;
    }),

  // Add bulk demo data
  addBulkDemoData: protectedProcedure
    .input(z.object({
      baseId: z.string(),
      tableId: z.string(),
      count: z.number().min(1).max(100000).default(100000),
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
        .where(and(eq(tables.id, input.tableId), eq(tables.baseId, input.baseId)));

      if (!table) throw new Error("Table not found");

      // Get all columns
      const tableColumns = await ctx.db
        .select()
        .from(columns)
        .where(eq(columns.tableId, table.id))
        .orderBy(columns.order);

      if (tableColumns.length === 0) {
        throw new Error("No columns found in table");
      }

      // Get max order for new row positioning
      const [maxOrder] = await ctx.db
        .select({ max: rows.order })
        .from(rows)
        .where(eq(rows.tableId, table.id))
        .orderBy(desc(rows.order))
        .limit(1);

      const startOrder = (maxOrder?.max ?? 0) + 1;

      // Create rows in batches to avoid memory issues
      const batchSize = 1000;
      const totalBatches = Math.ceil(input.count / batchSize);
      
      for (let batch = 0; batch < totalBatches; batch++) {
        const batchStart = batch * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, input.count);
        const batchCount = batchEnd - batchStart;

        // Create batch of rows
        const rowsToInsert = Array.from({ length: batchCount }, (_, i) => ({
          tableId: table.id,
          order: startOrder + batchStart + i,
        }));

        const newRows = await ctx.db
          .insert(rows)
          .values(rowsToInsert)
          .returning();

        // Create cells for each row in this batch with fake data
        const cellsToInsert = [];
        for (const row of newRows) {
          for (const column of tableColumns) {
            // Generate fake data based on column name and type
            let fakeValue = "";
            const columnName = column.name.toLowerCase();
            const columnType = column.type.toLowerCase();

            // Generate based on column name patterns
            if (columnName.includes('name') || columnName.includes('title')) {
              fakeValue = `${Math.random().toString(36).substring(2, 8)} Person`;
            } else if (columnName.includes('email')) {
              fakeValue = `user${Math.floor(Math.random() * 10000)}@example.com`;
            } else if (columnName.includes('phone')) {
              fakeValue = `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
            } else if (columnName.includes('address')) {
              fakeValue = `${Math.floor(Math.random() * 9999) + 1} Main St`;
            } else if (columnName.includes('city')) {
              const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];
              fakeValue = cities[Math.floor(Math.random() * cities.length)] ?? 'New York';
            } else if (columnName.includes('country')) {
              const countries = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Japan'];
              fakeValue = countries[Math.floor(Math.random() * countries.length)] ?? 'USA';
            } else if (columnName.includes('company')) {
              fakeValue = `Company ${Math.floor(Math.random() * 1000)}`;
            } else if (columnName.includes('job') || columnName.includes('position')) {
              const jobs = ['Engineer', 'Manager', 'Designer', 'Analyst', 'Developer', 'Consultant'];
              fakeValue = jobs[Math.floor(Math.random() * jobs.length)] ?? 'Engineer';
            } else if (columnName.includes('age')) {
              fakeValue = (Math.floor(Math.random() * 62) + 18).toString();
            } else if (columnName.includes('price') || columnName.includes('cost') || columnName.includes('amount')) {
              fakeValue = (Math.random() * 1000).toFixed(2);
            } else if (columnName.includes('date')) {
              const date = new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000));
              fakeValue = date.toISOString().split('T')[0] ?? '2024-01-01';
            } else {
              // Generate based on column type
              switch (columnType) {
                case 'number':
                  fakeValue = Math.floor(Math.random() * 1000).toString();
                  break;
                case 'email':
                  fakeValue = `user${Math.floor(Math.random() * 10000)}@example.com`;
                  break;
                case 'phone':
                  fakeValue = `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
                  break;
                case 'date':
                  const date = new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000));
                  fakeValue = date.toISOString().split('T')[0] ?? '2024-01-01';
                  break;
                case 'url':
                  fakeValue = `https://example${Math.floor(Math.random() * 100)}.com`;
                  break;
                default:
                  // Random text data
                  const textOptions = [
                    `Sample Text ${Math.floor(Math.random() * 1000)}`,
                    `Data Entry ${Math.floor(Math.random() * 1000)}`,
                    `Test Value ${Math.floor(Math.random() * 1000)}`,
                  ];
                  fakeValue = textOptions[Math.floor(Math.random() * textOptions.length)] ?? 'Sample Text';
              }
            }

            cellsToInsert.push({
              tableId: table.id,
              columnId: column.id,
              rowId: row.id,
              value: fakeValue,
            });
          }
        }

        if (cellsToInsert.length > 0) {
          await ctx.db.insert(cells).values(cellsToInsert);
        }
      }

      return { success: true, rowsCreated: input.count };
    }),
});
