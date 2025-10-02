"use client"

import React, { useState, useCallback, useMemo } from 'react'
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel } from '@tanstack/react-table'
import type { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { api } from "@/trpc/react"

export function useTableData(baseId: string) {
  // State
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  // Fetch table data from database
  const { data: tableData, isLoading, refetch } = api.table.getTableData.useQuery({ baseId });

  // Mutations
  const addColumnMutation = api.table.addColumn.useMutation({
    onMutate: async ({ name, type }) => {
      await api.table.getTableData.cancel({ baseId });
      const previousData = api.table.getTableData.getData({ baseId });
      
      if (previousData) {
        const newColumnId = crypto.randomUUID();
        const newColumn = {
          id: newColumnId,
          name: name || "New Column",
          type: type || "text",
          order: previousData.columns.length
        };
        
        api.table.getTableData.setData({ baseId }, {
          ...previousData,
          columns: [...previousData.columns, newColumn],
          rows: previousData.rows.map(row => ({ ...row, [newColumnId]: "" }))
        });
      }
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        api.table.getTableData.setData({ baseId }, context.previousData);
      }
    },
    onSettled: () => {
      api.table.getTableData.invalidate({ baseId });
    },
  });
  
  const deleteColumnMutation = api.table.deleteColumn.useMutation({
    onMutate: async ({ columnId }) => {
      await api.table.getTableData.cancel({ baseId });
      const previousData = api.table.getTableData.getData({ baseId });
      
      if (previousData) {
        api.table.getTableData.setData({ baseId }, {
          ...previousData,
          columns: previousData.columns.filter(col => col.id !== columnId),
          rows: previousData.rows.map(row => {
            const { [columnId]: deleted, ...rest } = row;
            return rest;
          })
        });
      }
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        api.table.getTableData.setData({ baseId }, context.previousData);
      }
    },
    onSettled: () => {
      api.table.getTableData.invalidate({ baseId });
    },
  });
  
  const updateColumnNameMutation = api.table.updateColumnName.useMutation({
    onMutate: async ({ columnId, name }) => {
      await api.table.getTableData.cancel({ baseId });
      const previousData = api.table.getTableData.getData({ baseId });
      
      if (previousData) {
        api.table.getTableData.setData({ baseId }, {
          ...previousData,
          columns: previousData.columns.map(col => 
            col.id === columnId ? { ...col, name } : col
          )
        });
      }
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        api.table.getTableData.setData({ baseId }, context.previousData);
      }
    },
    onSettled: () => {
      api.table.getTableData.invalidate({ baseId });
    },
  });
  
  const addRowMutation = api.table.addRow.useMutation({
    onMutate: async () => {
      await api.table.getTableData.cancel({ baseId });
      const previousData = api.table.getTableData.getData({ baseId });
      
      if (previousData) {
        const newRowId = crypto.randomUUID();
        const newRow: any = { id: newRowId };
        previousData.columns.forEach((col: any) => {
          newRow[col.id] = "";
        });
        
        api.table.getTableData.setData({ baseId }, {
          ...previousData,
          rows: [...previousData.rows, newRow]
        });
      }
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        api.table.getTableData.setData({ baseId }, context.previousData);
      }
    },
    onSettled: () => {
      api.table.getTableData.invalidate({ baseId });
    },
  });
  
  const deleteRowMutation = api.table.deleteRow.useMutation({
    onMutate: async ({ rowId }) => {
      await api.table.getTableData.cancel({ baseId });
      const previousData = api.table.getTableData.getData({ baseId });
      
      if (previousData) {
        api.table.getTableData.setData({ baseId }, {
          ...previousData,
          rows: previousData.rows.filter(row => row.id !== rowId)
        });
      }
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        api.table.getTableData.setData({ baseId }, context.previousData);
      }
    },
    onSettled: () => {
      api.table.getTableData.invalidate({ baseId });
    },
  });
  
  const updateCellMutation = api.table.updateCell.useMutation({
    onMutate: async ({ rowId, columnId, value }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await api.table.getTableData.cancel({ baseId });

      // Snapshot the previous value
      const previousData = api.table.getTableData.getData({ baseId });

      // Optimistically update to the new value
      if (previousData) {
        api.table.getTableData.setData({ baseId }, {
          ...previousData,
          rows: previousData.rows.map(row => 
            row.id === rowId ? { ...row, [columnId]: value } : row
          )
        });
      }

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        api.table.getTableData.setData({ baseId }, context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      api.table.getTableData.invalidate({ baseId });
    },
  });

  // Table operations with optimistic updates
  const updateData = useCallback(async (rowId: string, columnId: string, value: any) => {
    return updateCellMutation.mutateAsync({
      baseId,
      rowId,
      columnId,
      value: value || "",
    });
  }, [baseId, updateCellMutation]);

  const addRow = useCallback(async () => {
    return addRowMutation.mutateAsync({ baseId });
  }, [baseId, addRowMutation]);

  const deleteRow = useCallback(async (rowId: string) => {
    return deleteRowMutation.mutateAsync({ baseId, rowId });
  }, [baseId, deleteRowMutation]);

  const addColumn = useCallback(async () => {
    return addColumnMutation.mutateAsync({
      baseId,
      name: "New Column",
      type: "text",
    });
  }, [baseId, addColumnMutation]);

  const deleteColumn = useCallback(async (columnId: string) => {
    if (tableData?.columns && tableData.columns.length <= 1) return;
    return deleteColumnMutation.mutateAsync({ baseId, columnId });
  }, [baseId, tableData?.columns, deleteColumnMutation]);

  const updateColumnName = useCallback(async (columnId: string, newName: string) => {
    return updateColumnNameMutation.mutateAsync({
      baseId,
      columnId,
      name: newName,
    });
  }, [baseId, updateColumnNameMutation]);

  // Create table columns (without JSX - just return column config)
  const tableColumns = useMemo<ColumnDef<any>[]>(() => {
    const columns = tableData?.columns || [];
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
  }, [tableData?.columns]);

  // Create table instance
  const table = useReactTable({
    data: tableData?.rows || [],
    columns: tableColumns,
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
    isLoading,
    columns: tableData?.columns || [],
    rows: tableData?.rows || [],
    tableInfo: tableData?.table || null,
  };
}
