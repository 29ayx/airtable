"use client"

import React, { useState } from 'react'
import { useTableData } from "@/hooks/use-table-data"
import { TableHeader } from "@/components/table/table-header"
import { TableTabsHeader } from "@/components/table/table-tabs-header"
import { TableSidebar } from "@/components/table/table-sidebar"
import { TableToolbar } from "@/components/table/table-toolbar"
import { DataTable } from "@/components/table/data-table"

interface EditableTableProps {
  baseId: string;
  baseName?: string;
}

export default function EditableTable({ baseId, baseName = "Untitled Base" }: EditableTableProps) {
  const { 
    table, 
    tableData, 
    optimisticData, 
    isLoading, 
    columns, 
    rows,
    editingCell,
    setEditingCell 
  } = useTableData(baseId);

  // State for managing multiple tables
  const [tables, setTables] = useState([
    { id: 'table-1', name: 'Table 1', table: table }
  ]);
  const [activeTab, setActiveTab] = useState('table-1');

  // Add new table
  const addNewTable = () => {
    const newTableId = `table-${tables.length + 1}`;
    const newTable = {
      id: newTableId,
      name: `Table ${tables.length + 1}`,
      table: table // For now, using the same table data
    };
    setTables([...tables, newTable]);
    setActiveTab(newTableId);
  };

  // Early returns
  if (isLoading && !optimisticData) {
    return <div className="flex items-center justify-center min-h-screen">Loading table...</div>;
  }

  if (!tableData && !optimisticData) {
    return <div className="flex items-center justify-center min-h-screen">Table not found</div>;
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      {/* Main Header */}
      <TableHeader baseName={baseName} />
      
      {/* Secondary Header with Table Tabs */}
      <TableTabsHeader 
        tables={tables}
        activeTable={activeTab}
        onTableChange={setActiveTab}
        onAddTable={addNewTable}
      />
      
      {/* Toolbar - Full Width Overlapping Sidebar */}
      <TableToolbar />
      
      <div className="flex flex-1 overflow-hidden">
        <TableSidebar />
        
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          <DataTable 
            table={table}
            addRow={(table.options.meta as any)?.addRow}
            addColumn={(table.options.meta as any)?.addColumn}
            deleteRow={(table.options.meta as any)?.deleteRow}
          />
          
          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-end">
            <span className="text-xs text-gray-500">
              {rows.length} records
              {optimisticData && tableData && optimisticData !== tableData && (
                <span className="ml-2 text-blue-500">• Syncing...</span>
              )}
            </span>
          </div>
        </main>
      </div>
    </div>
  )
}
