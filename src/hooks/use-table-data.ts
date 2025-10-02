"use client"

import React, { useState, useMemo, useRef } from 'react'
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel } from '@tanstack/react-table'
import type { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { api } from "@/trpc/react"
import type { TableData, TableColumn, TableRow, CellUpdate } from '@/types/table'

// Import extracted modules
import { useCellSelection } from './table/use-cell-selection'
import { useTableMutations } from './table/use-table-mutations'
import { useTableOperations } from './table/use-table-operations'

export function useTableData(baseId: string) {
  // Core table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [optimisticData, setOptimisticData] = useState<{
    columns: TableColumn[];
    rows: TableRow[];
  } | null>(null);
  
  // Editing state
  const [editingCell, setEditingCell] = useState<{rowId: string, columnId: string} | null>(null)
  
  // Refs for tracking temp data and pending operations
  const pendingUpdates = useRef<Map<string, CellUpdate>>(new Map())
  const tempRowIds = useRef<Set<string>>(new Set())
  const tempRowData = useRef<Map<string, Record<string, string>>>(new Map())

  // Fetch table data from database
  const { data: tableData, isLoading } = api.table.getTableData.useQuery({ baseId });

  // Use extracted hooks
  const cellSelection = useCellSelection();
  
  // Initialize mutations
  const mutations = useTableMutations({
    baseId,
    tempRowIds,
    tempRowData,
    pendingUpdates,
    setOptimisticData,
    tableData
  });

  // Initialize table operations
  const operations = useTableOperations({
    baseId,
    tempRowIds,
    tempRowData,
    pendingUpdates,
    setOptimisticData,
    optimisticData,
    mutations
  });

  // Update optimistic state when real data changes (only on initial load)
  React.useEffect(() => {
    if (tableData && !optimisticData) {
      setOptimisticData({
        columns: tableData.columns,
        rows: tableData.rows,
      });
    }
  }, [tableData, optimisticData]);

  // Create table columns (without JSX - just return column config)
  const tableColumns = useMemo<ColumnDef<TableRow>[]>(() => {
    const columns = optimisticData?.columns ?? tableData?.columns ?? [];
    if (!columns.length) return [];
    
    const cols: ColumnDef<TableRow>[] = columns.map((col) => ({
      id: col.id,
      header: col.name,
      accessorKey: col.id,
      size: 150,
      minSize: 100,
      maxSize: 300,
    }));

    return cols;
  }, [optimisticData?.columns, tableData?.columns]);

  // Create table instance
  const table = useReactTable({
    data: optimisticData?.rows ?? tableData?.rows ?? [],
    columns: tableColumns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    enableColumnResizing: true,
    enableRowSelection: true,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    meta: {
      updateData: operations.updateData,
      addRow: operations.addRow,
      deleteRow: operations.deleteRow,
      addColumn: operations.addColumn,
      deleteColumn: operations.deleteColumn,
      updateColumnName: operations.updateColumnName,
      editingCell,
      setEditingCell,
      selectedCells: cellSelection.selectedCells,
      startSelection: cellSelection.startSelection,
      updateSelection: (endRowId: string, endColumnId: string) => 
        cellSelection.updateSelection(endRowId, endColumnId, optimisticData?.rows ?? [], optimisticData?.columns ?? []),
      endSelection: cellSelection.endSelection,
      clearSelection: cellSelection.clearSelection,
      deleteSelectedCells: () => cellSelection.deleteSelectedCells(operations.updateData),
      isSelecting: cellSelection.isSelecting,
    },
  });

  return {
    table,
    tableData,
    optimisticData,
    isLoading,
    columns: optimisticData?.columns ?? tableData?.columns ?? [],
    rows: optimisticData?.rows ?? tableData?.rows ?? [],
    tableInfo: tableData?.table ?? null,
    // Editing state
    editingCell,
    setEditingCell,
    // Selection state
    selectedCells: cellSelection.selectedCells,
    startSelection: cellSelection.startSelection,
    updateSelection: (endRowId: string, endColumnId: string) => 
      cellSelection.updateSelection(endRowId, endColumnId, optimisticData?.rows ?? [], optimisticData?.columns ?? []),
    endSelection: cellSelection.endSelection,
    clearSelection: cellSelection.clearSelection,
    deleteSelectedCells: () => cellSelection.deleteSelectedCells(operations.updateData),
    isSelecting: cellSelection.isSelecting,
    // Utility functions
    isTemporaryRow: (rowId: string) => tempRowIds.current.has(rowId),
    isPendingUpdate: (rowId: string, columnId: string) => pendingUpdates.current.has(`${rowId}-${columnId}`),
  };
}