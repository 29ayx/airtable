"use client"

import React, { useState, useCallback, useMemo } from 'react'
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel } from '@tanstack/react-table'
import type { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { api } from "@/trpc/react"

export function useTableData(baseId: string) {
  // State
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [optimisticData, setOptimisticData] = useState<{
    columns: any[];
    rows: any[];
  } | null>(null);

  // Fetch table data from database
  const { data: tableData, isLoading, refetch } = api.table.getTableData.useQuery({ baseId });

  // Update optimistic state when real data changes
  React.useEffect(() => {
    if (tableData) {
      setOptimisticData({
        columns: tableData.columns,
        rows: tableData.rows,
      });
    }
  }, [tableData]);

  // Mutations
  const addColumnMutation = api.table.addColumn.useMutation({
    onSuccess: () => refetch(),
  });
  
  const deleteColumnMutation = api.table.deleteColumn.useMutation({
    onSuccess: () => refetch(),
  });
  
  const updateColumnNameMutation = api.table.updateColumnName.useMutation({
    onSuccess: () => refetch(),
  });
  
  const addRowMutation = api.table.addRow.useMutation({
    onSuccess: () => refetch(),
  });
  
  const deleteRowMutation = api.table.deleteRow.useMutation({
    onSuccess: () => refetch(),
  });
  
  const updateCellMutation = api.table.updateCell.useMutation({
    onSuccess: () => refetch(),
  });

  // Table operations with optimistic updates
  const updateData = useCallback((rowId: string, columnId: string, value: any) => {
    setOptimisticData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map(row => 
          row.id === rowId ? { ...row, [columnId]: value || "" } : row
        )
      };
    });
    
    updateCellMutation.mutate({
      baseId,
      rowId,
      columnId,
      value: value || "",
    });
  }, [baseId, updateCellMutation]);

  const addRow = useCallback(() => {
    const newRowId = crypto.randomUUID();
    
    setOptimisticData(prev => {
      if (!prev) return prev;
      const newRow: any = { id: newRowId };
      prev.columns.forEach((col: any) => {
        newRow[col.id] = "";
      });
      return {
        ...prev,
        rows: [...prev.rows, newRow]
      };
    });
    
    addRowMutation.mutate({ baseId });
  }, [baseId, addRowMutation]);

  const deleteRow = useCallback((rowId: string) => {
    setOptimisticData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.filter(row => row.id !== rowId)
      };
    });
    
    deleteRowMutation.mutate({ baseId, rowId });
  }, [baseId, deleteRowMutation]);

  const addColumn = useCallback(() => {
    const newColumnId = crypto.randomUUID();
    
    setOptimisticData(prev => {
      if (!prev) return prev;
      const newColumn = {
        id: newColumnId,
        name: "New Column",
        type: "text",
        order: prev.columns.length
      };
      return {
        columns: [...prev.columns, newColumn],
        rows: prev.rows.map(row => ({ ...row, [newColumnId]: "" }))
      };
    });
    
    addColumnMutation.mutate({
      baseId,
      name: "New Column",
      type: "text",
    });
  }, [baseId, addColumnMutation]);

  const deleteColumn = useCallback((columnId: string) => {
    if (optimisticData?.columns && optimisticData.columns.length <= 1) return;
    
    setOptimisticData(prev => {
      if (!prev) return prev;
      return {
        columns: prev.columns.filter(col => col.id !== columnId),
        rows: prev.rows.map(row => {
          const { [columnId]: deleted, ...rest } = row;
          return rest;
        })
      };
    });
    
    deleteColumnMutation.mutate({ baseId, columnId });
  }, [baseId, optimisticData?.columns, deleteColumnMutation]);

  const updateColumnName = useCallback((columnId: string, newName: string) => {
    setOptimisticData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: prev.columns.map(col => 
          col.id === columnId ? { ...col, name: newName } : col
        )
      };
    });
    
    updateColumnNameMutation.mutate({
      baseId,
      columnId,
      name: newName,
    });
  }, [baseId, updateColumnNameMutation]);

  // Create table columns (without JSX - just return column config)
  const tableColumns = useMemo<ColumnDef<any>[]>(() => {
    const columns = optimisticData?.columns || tableData?.columns || [];
    if (!columns.length) return [];
    
    const cols: ColumnDef<any>[] = columns.map((col: any) => ({
      id: col.id,
      header: col.name,
      accessorKey: col.id,
      size: 150,
      minSize: 100,
      maxSize: 300,
      // Don't include cell renderer here - it will be added in the component
    }));

    return cols;
  }, [optimisticData?.columns, tableData?.columns]);

  // Create table instance
  const table = useReactTable({
    data: optimisticData?.rows || tableData?.rows || [],
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      columnFilters,
    },
    meta: {
      updateData,
      addRow,
      deleteRow,
      addColumn,
      deleteColumn,
      updateColumnName,
    },
  });

  return {
    table,
    tableData,
    optimisticData,
    isLoading,
    columns: optimisticData?.columns || tableData?.columns || [],
    rows: optimisticData?.rows || tableData?.rows || [],
    tableInfo: tableData?.table || null,
  };
}
