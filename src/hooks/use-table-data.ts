"use client"

import React, { useState, useCallback, useMemo, useRef } from 'react'
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel } from '@tanstack/react-table'
import type { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { api } from "@/trpc/react"

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

export function useTableData(baseId: string) {
  // State
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [optimisticData, setOptimisticData] = useState<{
    columns: any[];
    rows: any[];
  } | null>(null);
  
  // Editing state management
  const [editingCell, setEditingCell] = useState<{rowId: string, columnId: string} | null>(null)
  const pendingUpdates = useRef<Map<string, {rowId: string, columnId: string, value: any}>>(new Map())
  const tempRowIds = useRef<Set<string>>(new Set())
  const tempRowData = useRef<Map<string, Record<string, string>>>(new Map()) // Track temp row data in real-time

  // Fetch table data from database
  const { data: tableData, isLoading, refetch } = api.table.getTableData.useQuery({ baseId });

  // Update optimistic state when real data changes (only on initial load)
  React.useEffect(() => {
    if (tableData && !optimisticData) {
      setOptimisticData({
        columns: tableData.columns,
        rows: tableData.rows,
      });
    }
  }, [tableData, optimisticData]);

  // Mutations with proper optimistic updates
  const addColumnMutation = api.table.addColumn.useMutation({
    onSuccess: (newColumn, variables) => {
      // Replace temp column with real column
      setOptimisticData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map(col => 
            col.id === `temp-col-${variables.name}` ? newColumn : col
          )
        };
      });
    },
    onError: (error, variables) => {
      // Remove temp column on error
      setOptimisticData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.filter(col => col.id !== `temp-col-${variables.name}`)
        };
      });
    }
  });
  
  const deleteColumnMutation = api.table.deleteColumn.useMutation({
    onError: (error, variables) => {
      // Restore column on error
      if (tableData) {
        const originalColumn = tableData.columns.find(col => col.id === variables.columnId);
        if (originalColumn) {
          setOptimisticData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              columns: [...prev.columns, originalColumn]
            };
          });
        }
      }
    }
  });
  
  const updateColumnNameMutation = api.table.updateColumnName.useMutation({
    onError: (error, variables) => {
      // Revert column name on error
      if (tableData) {
        const originalColumn = tableData.columns.find(col => col.id === variables.columnId);
        if (originalColumn) {
          setOptimisticData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              columns: prev.columns.map(col => 
                col.id === variables.columnId ? originalColumn : col
              )
            };
          });
        }
      }
    }
  });
  
  const addRowMutation = api.table.addRow.useMutation({
    onSuccess: (newRow, variables) => {
      const tempRowId = variables.tempRowId;
      console.log('✅ addRowMutation success:', { newRow, tempRowId });
      
      if (tempRowId && tempRowIds.current.has(tempRowId)) {
        // Get real-time tracked temp row data
        const trackedTempData = tempRowData.current.get(tempRowId) || {};
        console.log('📋 Using real-time tracked temp data:', trackedTempData);
        
        setOptimisticData(prev => {
          if (!prev) return prev;
          
          const updatedRows = prev.rows.map(row => {
            if (row.id === tempRowId) {
              // Merge tracked temp data with real row
              const mergedRow = { 
                id: newRow.id,
                order: newRow.order,
                createdAt: newRow.createdAt,
                ...trackedTempData, // Real-time tracked user edits
              };
              console.log('🔄 Replacing temp row with real row:', mergedRow);
              return mergedRow;
            }
            return row;
          });
          
          return {
            ...prev,
            rows: updatedRows
          };
        });
        
        // Clean up tracking
        tempRowIds.current.delete(tempRowId);
        tempRowData.current.delete(tempRowId);
        console.log('🗑️ Cleaned up temp row tracking:', tempRowId);
        
        // Send any cell data that was entered in the temp row
        setTimeout(() => {
          const cellUpdates = Object.keys(trackedTempData).filter(key => 
            trackedTempData[key] && trackedTempData[key] !== ""
          );
          
          console.log('📤 Sending cell updates for new row:', cellUpdates, trackedTempData);
          
          cellUpdates.forEach((columnId) => {
            const value = trackedTempData[columnId];
            console.log('💾 Updating cell:', { rowId: newRow.id, columnId, value });
            updateCellMutation.mutate({
              baseId,
              rowId: newRow.id,
              columnId: columnId,
              value: value,
            });
          });
        }, 50);
      }
    },
    onError: (error, variables) => {
      const tempRowId = variables.tempRowId;
      console.log('❌ addRowMutation error:', { error, tempRowId });
      
      if (tempRowId && tempRowIds.current.has(tempRowId)) {
        setOptimisticData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            rows: prev.rows.filter(row => row.id !== tempRowId)
          };
        });
        // Clean up tracking
        tempRowIds.current.delete(tempRowId);
        tempRowData.current.delete(tempRowId);
      }
    }
  });
  
  const deleteRowMutation = api.table.deleteRow.useMutation({
    onError: (error, variables) => {
      // Restore row on error
      if (tableData) {
        const originalRow = tableData.rows.find(row => row.id === variables.rowId);
        if (originalRow) {
          setOptimisticData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              rows: [...prev.rows, originalRow]
            };
          });
        }
      }
    }
  });
  
  const updateCellMutation = api.table.updateCell.useMutation({
    onSuccess: (result, variables) => {
      // Remove from pending updates
      const key = `${variables.rowId}-${variables.columnId}`;
      pendingUpdates.current.delete(key);
    },
    onError: (error, variables) => {
      // Revert cell value on error
      const key = `${variables.rowId}-${variables.columnId}`;
      pendingUpdates.current.delete(key);
      
      if (tableData) {
        const originalRow = tableData.rows.find(row => row.id === variables.rowId);
        if (originalRow) {
          setOptimisticData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              rows: prev.rows.map(row => 
                row.id === variables.rowId 
                  ? { ...row, [variables.columnId]: originalRow[variables.columnId] }
                  : row
              )
            };
          });
        }
      }
    }
  });

  // Debounced update function
  const debouncedUpdateCell = useMemo(() => 
    debounce((rowId: string, columnId: string, value: any) => {
      const key = `${rowId}-${columnId}`;
      console.log('⏰ debouncedUpdateCell called:', { rowId, columnId, value, key });
      
      // Don't send if there's already a pending update for this cell
      if (pendingUpdates.current.has(key)) {
        console.log('⏸️ Skipping - already pending:', key);
        return;
      }
      
      pendingUpdates.current.set(key, { rowId, columnId, value });
      console.log('📡 Sending updateCell mutation:', { baseId, rowId, columnId, value });
      
      updateCellMutation.mutate({
        baseId,
        rowId,
        columnId,
        value: value || "",
      });
    }, 300), [baseId, updateCellMutation]
  );

  // Table operations with optimistic updates
  const updateData = useCallback((rowId: string, columnId: string, value: any) => {
    console.log('🔄 updateData called:', { rowId, columnId, value, isTemp: tempRowIds.current.has(rowId) });
    
    // Handle temporary rows
    if (tempRowIds.current.has(rowId)) {
      console.log('📝 Updating temp row data in real-time');
      
      // Store temp row data in real-time
      if (!tempRowData.current.has(rowId)) {
        tempRowData.current.set(rowId, {});
      }
      const currentTempData = tempRowData.current.get(rowId)!;
      currentTempData[columnId] = value || "";
      tempRowData.current.set(rowId, currentTempData);
      
      console.log('💾 Temp row data updated:', { rowId, data: currentTempData });
      
      // Update optimistic UI
      setOptimisticData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          rows: prev.rows.map(row => 
            row.id === rowId ? { ...row, [columnId]: value || "" } : row
          )
        };
      });
      return;
    }

    console.log('💾 Updating real row - optimistic + server call');
    // Immediate optimistic update for real rows
    setOptimisticData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map(row => 
          row.id === rowId ? { ...row, [columnId]: value || "" } : row
        )
      };
    });
    
    // Debounced server update for real rows only
    debouncedUpdateCell(rowId, columnId, value);
  }, [debouncedUpdateCell]);

  const addRow = useCallback(() => {
    const tempRowId = `temp-row-${Date.now()}`;
    tempRowIds.current.add(tempRowId);
    
    // Initialize temp row data storage
    tempRowData.current.set(tempRowId, {});
    
    console.log('➕ Adding new row with tempId:', tempRowId);
    
    setOptimisticData(prev => {
      if (!prev) return prev;
      const newRow: any = { id: tempRowId };
      prev.columns.forEach((col: any) => {
        newRow[col.id] = "";
      });
      return {
        ...prev,
        rows: [...prev.rows, newRow]
      };
    });
    
    console.log('🚀 Calling addRowMutation with:', { baseId, tempRowId });
    addRowMutation.mutate({ baseId, tempRowId });
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
    const columnName = "New Column";
    const tempColumnId = `temp-col-${columnName}`;
    
    setOptimisticData(prev => {
      if (!prev) return prev;
      const newColumn = {
        id: tempColumnId,
        name: columnName,
        type: "text",
        order: prev.columns.length
      };
      return {
        columns: [...prev.columns, newColumn],
        rows: prev.rows.map(row => ({ ...row, [tempColumnId]: "" }))
      };
    });
    
    addColumnMutation.mutate({
      baseId,
      name: columnName,
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
      updateData,
      addRow,
      deleteRow,
      addColumn,
      deleteColumn,
      updateColumnName,
      editingCell,
      setEditingCell,
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
    // Editing state
    editingCell,
    setEditingCell,
    // Utility functions
    isTemporaryRow: (rowId: string) => tempRowIds.current.has(rowId),
    isPendingUpdate: (rowId: string, columnId: string) => pendingUpdates.current.has(`${rowId}-${columnId}`),
  };
}
