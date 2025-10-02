"use client"

import React, { useState } from 'react'
import { useTableData } from "@/hooks/use-table-data"
import { TableHeader } from "@/components/table/table-header"
import { TableTabsHeader } from "@/components/table/table-tabs-header"
import { TableSidebar } from "@/components/table/table-sidebar"
import { TableToolbar } from "@/components/table/table-toolbar"
import { DataTable } from "@/components/table/data-table"
import { api } from "@/trpc/react"

interface EditableTableProps {
  baseId: string;
  baseName?: string;
}

export default function EditableTable({ baseId, baseName = "Untitled Base" }: EditableTableProps) {
  // Get utils for invalidating queries
  const utils = api.useUtils();
  
  // Fetch all tables for this base
  const { data: allTables, isLoading: tablesLoading } = api.table.getAllTables.useQuery({ baseId });
  
  // State for managing active table
  const [activeTableId, setActiveTableId] = useState<string | undefined>();
  
  // Set active table when tables load
  React.useEffect(() => {
    if (allTables && allTables.length > 0 && !activeTableId) {
      setActiveTableId(allTables[0]!.id);
    }
  }, [allTables, activeTableId]);

  // Invalidate table data when switching tables
  React.useEffect(() => {
    if (activeTableId) {
      void utils.table.getTableData.invalidate({ baseId, tableId: activeTableId });
    }
  }, [activeTableId, baseId, utils.table.getTableData]);

  const { 
    table, 
    tableData, 
    optimisticData, 
    isLoading, 
    rows,
    searchTerm,
    setSearchTerm
  } = useTableData(baseId, activeTableId);

  // Create new table mutation
  const createTableMutation = api.table.createTable.useMutation({
    onSuccess: (newTable: { id: string; name: string }) => {
      // Invalidate the tables list to show the new table
      void utils.table.getAllTables.invalidate({ baseId });
      // Set the new table as active
      setActiveTableId(newTable.id);
    },
  });

  // Add new table
  const addNewTable = () => {
    const tableCount = allTables ? allTables.length + 1 : 1;
    createTableMutation.mutate({
      baseId,
      name: `Table ${tableCount}`,
    });
  };

  // Early returns
  if (tablesLoading || (isLoading && !optimisticData)) {
    return <div className="flex items-center justify-center min-h-screen">Loading table...</div>;
  }

  if (!allTables || allTables.length === 0) {
    return <div className="flex items-center justify-center min-h-screen">No tables found</div>;
  }

  if (!activeTableId || (!tableData && !optimisticData)) {
    return <div className="flex items-center justify-center min-h-screen">Table not found</div>;
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      {/* Main Header */}
      <TableHeader baseName={baseName} baseId={baseId} />
      
      {/* Secondary Header with Table Tabs */}
      <TableTabsHeader 
        tables={allTables.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name }))}
        activeTable={activeTableId}
        onTableChange={setActiveTableId}
        onAddTable={addNewTable}
      />
      
      {/* Toolbar - Full Width Overlapping Sidebar */}
      <TableToolbar 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <TableSidebar />
        
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          <DataTable 
            table={table}
            addRow={(table.options.meta as any)?.addRow}
            addColumn={(table.options.meta as any)?.addColumn}
            searchTerm={searchTerm}
          />
          
          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-end">
            <span className="text-xs text-gray-500">
              {rows.length} records
            </span>
          </div>
        </main>
      </div>
    </div>
  )
}
