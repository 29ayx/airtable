import { relations, sql } from "drizzle-orm";
import { index, pgTableCreator, primaryKey } from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `airtable_${name}`);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`),
  image: d.varchar({ length: 255 }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// Bases/Tables schema
export const bases = createTable(
  "base",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: d.varchar({ length: 255 }).notNull(),
    description: d.text(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("base_user_id_idx").on(t.userId),
    index("base_name_idx").on(t.name),
  ],
);

export const baseRelations = relations(bases, ({ one, many }) => ({
  user: one(users, { fields: [bases.userId], references: [users.id] }),
  tables: many(tables),
}));

// Tables schema - Each base can have multiple tables
export const tables = createTable(
  "table",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: d.varchar({ length: 255 }).notNull(),
    baseId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => bases.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("table_base_id_idx").on(t.baseId),
    index("table_name_idx").on(t.name),
  ],
);

export const tableRelations = relations(tables, ({ one, many }) => ({
  base: one(bases, { fields: [tables.baseId], references: [bases.id] }),
  columns: many(columns),
  cells: many(cells),
  rows: many(rows),
}));

// Columns schema - Each table can have multiple columns
export const columns = createTable(
  "column",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: d.varchar({ length: 255 }).notNull(),
    type: d.varchar({ length: 50 }).notNull().default("text"), // text, number, select, date, etc.
    tableId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => tables.id),
    order: d.integer().notNull().default(0),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    index("column_table_id_idx").on(t.tableId),
    index("column_order_idx").on(t.tableId, t.order),
  ],
);

export const columnRelations = relations(columns, ({ one, many }) => ({
  table: one(tables, { fields: [columns.tableId], references: [tables.id] }),
  cells: many(cells),
}));

// Cells schema - Store individual cell data efficiently
export const cells = createTable(
  "cell",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tableId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => tables.id),
    columnId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => columns.id),
    rowId: d.varchar({ length: 255 }).notNull(), // Custom row identifier
    value: d.text(), // Store as text, parse based on column type
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("cell_table_row_idx").on(t.tableId, t.rowId),
    index("cell_column_idx").on(t.columnId),
    index("cell_row_column_idx").on(t.rowId, t.columnId),
  ],
);

export const cellRelations = relations(cells, ({ one }) => ({
  table: one(tables, { fields: [cells.tableId], references: [tables.id] }),
  column: one(columns, { fields: [cells.columnId], references: [columns.id] }),
  row: one(rows, { fields: [cells.rowId], references: [rows.id] }),
}));

// Rows schema - Track row metadata and ordering
export const rows = createTable(
  "row",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tableId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => tables.id),
    order: d.integer().notNull().default(0),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("row_table_id_idx").on(t.tableId),
    index("row_order_idx").on(t.tableId, t.order),
    index("row_created_at_idx").on(t.tableId, t.createdAt),
  ],
);

export const rowRelations = relations(rows, ({ one, many }) => ({
  table: one(tables, { fields: [rows.tableId], references: [tables.id] }),
  cells: many(cells),
}));
