Week 1: Foundation (Days 1-5)
Day 1: Project Setup and Auth

Scaffold the app using create-t3-app from https://create.t3.gg/. Choose options: Next.js, tRPC, Prisma, Tailwind, NextAuth (with Google provider).
Set up PostgreSQL: Use Prisma to define initial schema (e.g., User, Base, Table, Column models). Migrate DB.
Implement Google login: Configure NextAuth with Google provider. Create a basic landing page that redirects to login if unauthenticated.
Style basics: Use Tailwind to set up global styles mimicking Airtable (clean sans-serif font, blue accents, grid layout).
Test: Local run, login/logout works.
Update: "Day 1 Update: App scaffolded with T3 stack. Google auth implemented. Basic DB schema set up."

Day 2: Bases and Tables Creation

Extend Prisma schema: Add models for Base (owned by User), Table (belongs to Base).
tRPC routers: Create APIs for creating/listing bases and tables (e.g., createBase, createTable).
UI: Build a dashboard page showing user's bases. Button to create new base. Inside a base, button to create new table.
When creating a table: Auto-generate default columns (e.g., 3 text columns) and ~10 default rows using Faker.js (integrate via npm install @faker-js/faker).
Use TanStack Table for initial table rendering (basic setup with static data).
Test: Create base, create table, see default data.
Update: "Day 2 Update: Bases and tables CRUD implemented. Default data with Faker.js populating tables."

Day 3: Dynamic Columns

Prisma: Add Column model (belongs to Table, with type: 'text' or 'number').
tRPC: APIs to add/delete columns dynamically.
UI: In table view, add a "+" button to add columns (modal for type selection: text/number).
Update TanStack Table to render dynamic columns from DB.
Style to match Airtable: Column headers with resize handles (use TanStack's column resizing if available, or custom).
Test: Add columns, see them reflect in table.
Update: "Day 3 Update: Dynamic column addition for text/number types. Table UI updating accordingly."

Day 4: Cell Editing and Navigation

Prisma: Add Row and Cell models (Row belongs to Table, Cell belongs to Row and Column, with value string/number).
tRPC: APIs for editing cells.
UI: Make cells editable (click to edit, save on blur/enter). Use TanStack Table's editing features.
Keyboard navigation: Implement arrow keys/tab to move focus across cells (use TanStack's row/column indexing + custom event handlers).
Add loading state: Skeleton loaders for table while fetching.
Test: Edit cells, navigate smoothly.
Update: "Day 4 Update: Cell editing and keyboard navigation working. Loading states added."

Day 5: Basic Data Population and Review

tRPC: API to generate default rows/columns on table creation (use Faker.js server-side for consistency).
Populate initial 10-20 rows.
Review Week 1: Run full flow (login → create base → create table → add columns → edit cells).
Fix bugs, ensure UI matches Airtable (inspect Airtable's elements for colors/spacing).
Deploy initial version to Vercel for testing.
Update: "Day 5 Update: Week 1 complete. Basic structure deployed to Vercel. [Link]."

Week 2: Performance and Scalability (Days 6-10)
Day 6: Add 100k Rows Button

tRPC: API endpoint to bulk insert 100k rows (use Prisma's createMany, but batch if needed for performance; generate data with Faker.js).
UI: Add a button in table view to trigger this (with confirmation modal).
Handle large inserts: Use transactions or background jobs if Prisma struggles (but for now, simple createMany).
Test: Add 100k rows, check DB performance.
Update: "Day 6 Update: Bulk row addition implemented. Tested with 100k rows."

Day 7: Virtualization and Infinite Scroll

Integrate TanStack Virtual (npm install @tanstack/react-virtual).
Update TanStack Table to use virtualization: Render only visible rows, fetch more via infinite scroll.
tRPC hooks: Use useInfiniteQuery for paginated row fetching (e.g., fetch 100 rows at a time, based on scroll position).
Ensure smooth scrolling without lag for 100k rows.
Test: Scroll through 100k rows, no freezes.
Update: "Day 7 Update: Virtualized infinite scroll set up with tRPC. Smooth performance on large tables."

Day 8: Search Across Cells (as Filter)

tRPC: API for searching (use Prisma's where clause with OR across cells; e.g., ILIKE for text).
Since search is across all cells, join Cells to Rows and filter rows where any cell matches.
UI: Add search bar above table; on input, refetch filtered rows (debounce for performance).
Integrate with infinite query for paginated results.
Test: Search filters rows correctly at DB level.
Update: "Day 8 Update: Global search implemented as row filter, done server-side."

Day 9: Column Filters

tRPC: Extend query APIs to accept filters (e.g., { columnId: { type: 'text', op: 'contains', value: 'foo' } }).
For text: isEmpty, notEmpty, contains, notContains, equals.
For numbers: gt, lt.
Use Prisma dynamic where clauses.
UI: Per-column dropdown for filters (mimic Airtable's filter UI).
Apply filters server-side, update infinite query.
Test: Apply filters, see rows update.
Update: "Day 9 Update: Column filters for text/number types added, server-side."

Day 10: Sorting and Review

tRPC: Add sort params to queries (e.g., { columnId, direction: 'asc'/'desc' }).
For text: alphabetical; numbers: numerical.
UI: Clickable column headers to toggle sort.
Combine with search/filters in queries.
Review Week 2: Test with 100k rows (add, scroll, search, filter, sort).
Update: "Day 10 Update: Sorting implemented server-side. Week 2 performance tests passed."

Week 3: Views, Polish, and Scaling (Days 11-15)
Day 11: Table Views

Prisma: Add View model (belongs to Table, stores config: filters, sort, hiddenColumns, searchQuery).
tRPC: APIs to create/save/load views.
UI: Button to create view, save current config (filters/sort/search/hidden columns).
Load view applies config to table.
Test: Create/view switch works.
Update: "Day 11 Update: Views for saving configurations implemented."

Day 12: Hide/Show Columns and Search Columns

UI: Column header menu to hide/show (track in state, save in views).
Add column search: Input to filter visible columns (client-side for simplicity).
Integrate with views.
Test: Hide/show persists in views.
Update: "Day 12 Update: Column hide/show and search added."

Day 13: Scaling to 1m Rows

Optimize queries: Ensure indexes on Prisma (e.g., on cell values if searchable).
Test bulk insert for 1m rows (may need batches of 10k).
Verify infinite scroll/search/filter/sort with 1m (use count queries for total, limit/offset or cursors for pagination).
Handle edge cases: Empty tables, no results.
Update: "Day 13 Update: Scaled testing to 1m rows. Optimizations applied."

Day 14: UI Polish and Loading States

1:1 Airtable match: Fine-tune styles (grids, inputs, buttons) – reference Airtable screenshots.
Enhance loading: Spinners for fetches, progress for bulk adds.
Accessibility: Keyboard nav, ARIA labels.
Bug fixes from testing.
Update: "Day 14 Update: UI polished to match Airtable. Full loading states implemented."

Day 15: Deployment and Final Tests

Deploy to Vercel: Connect GitHub repo, set env vars (DB URL, Google keys).
Test end-to-end on production: Login, create base/table, add 100k rows, scroll/search/filter/sort/views.
Performance check: 1m rows load without issues (thanks to virtualization/server-side).
Document: README with setup instructions.
Update: "Day 15 Update: Project deployed to Vercel [link]. Final tests complete. Ready for review."