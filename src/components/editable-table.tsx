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
  const [isTableSwitching, setIsTableSwitching] = useState(false);
  
  // Set active table when tables load
  React.useEffect(() => {
    if (allTables && allTables.length > 0 && !activeTableId) {
      setActiveTableId(allTables[0]!.id);
    }
  }, [allTables, activeTableId]);

  // Handle table switching with loading state
  const handleTableSwitch = async (newTableId: string) => {
    if (newTableId === activeTableId) return;
    
    setIsTableSwitching(true);
    setActiveTableId(newTableId);
    
    // Force invalidate and refetch the new table data
    await utils.table.getTableData.invalidate({ baseId, tableId: newTableId });
    await utils.table.getTableData.refetch({ baseId, tableId: newTableId });
    
    // Small delay to ensure data is loaded before removing loading state
    setTimeout(() => {
      setIsTableSwitching(false);
    }, 300);
  };

  const { 
    table, 
    tableData, 
    optimisticData, 
    isLoading, 
    columns,
    rows,
    allColumns,
    tableInfo,
    searchTerm,
    setSearchTerm,
    viewFilters,
    viewSorts,
    hiddenColumns,
    updateViewFilters,
    updateViewSorts,
    updateHiddenColumns,
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

  // Rename table mutation
  const renameTableMutation = api.table.renameTable.useMutation({
    onSuccess: () => {
      void utils.table.getAllTables.invalidate({ baseId });
    },
  });

  // Delete table mutation  
  const deleteTableMutation = api.table.deleteTable.useMutation({
    onSuccess: () => {
      void utils.table.getAllTables.invalidate({ baseId });
      // If deleted table was active, switch to first available table
      if (allTables && allTables.length > 1) {
        const remainingTables = allTables.filter(t => t.id !== activeTableId);
        if (remainingTables.length > 0) {
          setActiveTableId(remainingTables[0]!.id);
        }
      }
    },
  });

  // Handle table rename
  const handleRenameTable = (tableId: string, newName: string) => {
    renameTableMutation.mutate({
      baseId,
      tableId,
      name: newName,
    });
  };

  // Handle table delete
  const handleDeleteTable = (tableId: string) => {
    if (allTables && allTables.length > 1) {
      deleteTableMutation.mutate({
        baseId,
        tableId,
      });
    }
  };

  // Early returns for critical errors only
  if (tablesLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading tables...</div>;
  }

  if (!allTables || allTables.length === 0) {
    return <div className="flex items-center justify-center min-h-screen">No tables found</div>;
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      {/* Main Header */}
      <TableHeader 
        baseName={baseName} 
        baseId={baseId} 
        isAddingTable={createTableMutation.isPending}
      />
      
      {/* Secondary Header with Table Tabs */}
      <TableTabsHeader 
        tables={allTables.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name }))}
        activeTable={activeTableId || ''}
        onTableChange={handleTableSwitch}
        onAddTable={addNewTable}
        onRenameTable={handleRenameTable}
        onDeleteTable={handleDeleteTable}
      />
      
      {/* Toolbar - Full Width Overlapping Sidebar */}
        <TableToolbar 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          columns={allColumns}
          filters={viewFilters}
          sorts={viewSorts}
          hiddenColumns={hiddenColumns}
          onFiltersChange={updateViewFilters}
          onSortsChange={updateViewSorts}
          onHiddenColumnsChange={updateHiddenColumns}
          baseId={baseId}
          tableId={activeTableId || undefined}
          onDataChange={async () => {
            // Refetch table data when demo data is generated
            if (activeTableId) {
              await utils.table.getTableData.invalidate({ baseId, tableId: activeTableId });
              await utils.table.getTableData.refetch({ baseId, tableId: activeTableId });
            }
          }}
        />
      
      <div className="flex flex-1 overflow-hidden">
        <TableSidebar />
        
        <main className="flex-1 flex flex-col overflow-hidden bg-white relative">
          {isTableSwitching || (isLoading && !optimisticData) || !activeTableId ? (
            <>
              {/* Show empty DataTable structure */}
              <div className="flex-1 p-6">
                <div className="animate-pulse">
                  {/* Table Header Skeleton */}
                  <div className="grid grid-cols-4 gap-4 mb-6 pb-4 border-b border-gray-200">
                    <div className="h-12 bg-gray-300 rounded-lg"></div>
                    <div className="h-12 bg-gray-300 rounded-lg"></div>
                    <div className="h-12 bg-gray-300 rounded-lg"></div>
                    <div className="h-12 bg-gray-300 rounded-lg"></div>
                  </div>
                  
                  {/* Table Rows Skeleton */}
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="grid grid-cols-4 gap-4 mb-4">
                      <div className={`h-10 bg-gray-100 rounded ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-3/4' : 'w-5/6'}`}></div>
                      <div className={`h-10 bg-gray-100 rounded ${i % 2 === 0 ? 'w-2/3' : 'w-full'}`}></div>
                      <div className={`h-10 bg-gray-100 rounded ${i % 4 === 0 ? 'w-full' : 'w-4/5'}`}></div>
                      <div className={`h-10 bg-gray-100 rounded ${i % 3 === 2 ? 'w-3/4' : 'w-full'}`}></div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Loading Overlay - Only over table area */}
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95 backdrop-blur-sm">
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-6">
                    {/* Outer ring */}
                    <div className="absolute inset-0 w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                    {/* Inner spinning ring */}
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-500 border-r-blue-500 rounded-full animate-spin"></div>
                    {/* Pulse effect */}
                    <div className="absolute inset-2 w-12 h-12 bg-blue-50 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-xl font-semibold text-gray-800 mb-2">
                    {isTableSwitching ? "Switching Table" : "Loading Table"}
                  </p>
                  <p className="text-base text-gray-600">
                    Please wait while we fetch your data
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </main>
      </div>
    </div>
  )
}
