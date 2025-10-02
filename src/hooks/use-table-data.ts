"use client"

import React, { useState, useMemo, useRef } from 'react'
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel } from '@tanstack/react-table'
import type { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { api } from "@/trpc/react"
import type { TableData, TableColumn, TableRow, CellUpdate } from '@/types/table'
import type { ViewFilters, SortConfig } from '@/types/view'

// Import extracted modules
import { useCellSelection } from './table/use-cell-selection'
import { useTableMutations } from './table/use-table-mutations'
import { useTableOperations } from './table/use-table-operations'

// Filter evaluation function
function evaluateFilters(filters: ViewFilters, row: TableRow, columns: TableColumn[]): boolean {
  const evaluateCondition = (condition: any, row: TableRow): boolean => {
    const value = String((row as any)[condition.columnId] ?? '').toLowerCase();
    const filterValue = condition.value.toLowerCase();
    
    switch (condition.operator) {
      case 'contains':
        return String(value).includes(String(filterValue));
      case 'does_not_contain':
        return !String(value).includes(String(filterValue));
      case 'is':
        return value === filterValue;
      case 'is_not':
        return value !== filterValue;
      case 'is_empty':
        return value === '';
      case 'is_not_empty':
        return value !== '';
      case 'starts_with':
        return String(value).startsWith(String(filterValue));
      case 'ends_with':
        return String(value).endsWith(String(filterValue));
      case 'equals':
        return parseFloat(String(value)) === parseFloat(String(filterValue));
      case 'not_equals':
        return parseFloat(String(value)) !== parseFloat(String(filterValue));
      case 'greater_than':
        return parseFloat(String(value)) > parseFloat(String(filterValue));
      case 'less_than':
        return parseFloat(String(value)) < parseFloat(String(filterValue));
      case 'greater_than_or_equal':
        return parseFloat(String(value)) >= parseFloat(String(filterValue));
      case 'less_than_or_equal':
        return parseFloat(String(value)) <= parseFloat(String(filterValue));
      default:
        return true;
    }
  };

  const evaluateGroup = (group: any, row: TableRow): boolean => {
    const conditionResults = group.conditions.map((condition: any) => evaluateCondition(condition, row));
    const groupResults = (group.groups || []).map((nestedGroup: any) => evaluateGroup(nestedGroup, row));
    const allResults = [...conditionResults, ...groupResults];
    
    return group.type === 'and' ? allResults.every(Boolean) : allResults.some(Boolean);
  };

  const conditionResults = filters.conditions.map(condition => evaluateCondition(condition, row));
  const groupResults = filters.groups.map(group => evaluateGroup(group, row));
  const allResults = [...conditionResults, ...groupResults];
  
  if (allResults.length === 0) return true;
  
  return filters.type === 'and' ? allResults.every(Boolean) : allResults.some(Boolean);
}

export function useTableData(baseId: string, tableId?: string) {
  // Core table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [optimisticData, setOptimisticData] = useState<{
    columns: TableColumn[];
    rows: TableRow[];
  } | null>(null);
  
  // View state
  const [viewFilters, setViewFilters] = useState<ViewFilters>({ type: 'and', conditions: [], groups: [] })
  const [viewSorts, setViewSorts] = useState<SortConfig[]>([])
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([])
  const [currentViewId, setCurrentViewId] = useState<string | null>(null)
  
  // Editing state
  const [editingCell, setEditingCell] = useState<{rowId: string, columnId: string} | null>(null)
  const [focusedCell, setFocusedCell] = useState<{rowId: string, columnId: string} | null>(null)
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null)
  
  // History tracking for undo/redo
  const [history, setHistory] = useState<Array<{
    type: 'cell_update' | 'cell_delete';
    data: Array<{rowId: string, columnId: string, oldValue: string, newValue: string}>;
    timestamp: number;
  }>>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  // Refs for tracking temp data and pending operations
  const pendingUpdates = useRef<Map<string, CellUpdate>>(new Map())
  const tempRowIds = useRef<Set<string>>(new Set())
  const tempRowData = useRef<Map<string, Record<string, string>>>(new Map())

  // Fetch table data from database
  const { data: tableData, isLoading } = api.table.getTableData.useQuery({ 
    baseId, 
    tableId 
  }, {
    enabled: !!tableId, // Only fetch when we have a tableId
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
    staleTime: 0, // Always consider data stale to force fresh fetches
  });

  // Fetch view data
  const { data: viewData } = api.table.getTableView.useQuery({
    baseId,
    tableId: tableId || '',
  }, {
    enabled: !!tableId,
  });

  // Update view mutation
  const updateViewMutation = api.table.updateView.useMutation();

  // Use extracted hooks
  const cellSelection = useCellSelection();
  
  // Get tableId from tableData
  const currentTableId = tableId || tableData?.table?.id;

  // Initialize mutations
  const mutations = useTableMutations({
    baseId,
    tableId: currentTableId || '',
    tempRowIds,
    tempRowData,
    pendingUpdates,
    setOptimisticData,
    tableData
  });

  // Initialize table operations
  const operations = useTableOperations({
    baseId,
    tableId: currentTableId || '',
    tempRowIds,
    tempRowData,
    pendingUpdates,
    setOptimisticData,
    optimisticData,
    mutations
  });

  // Reset optimistic data when tableId changes
  React.useEffect(() => {
    // Immediately clear all optimistic data and pending operations
    setOptimisticData(null);
    pendingUpdates.current.clear();
    tempRowIds.current.clear();
    tempRowData.current.clear();
  }, [tableId]);

  // Update optimistic state when real data changes
  React.useEffect(() => {
    if (tableData) {
      // Always update optimistic data with fresh table data
      setOptimisticData({
        columns: tableData.columns,
        rows: tableData.rows,
      });
    }
  }, [tableData]);

  // Sync view data when it changes
  React.useEffect(() => {
    if (viewData) {
      setCurrentViewId(viewData.id);
      setViewFilters(viewData.filters as ViewFilters || { type: 'and', conditions: [], groups: [] });
      setViewSorts(viewData.sorts as SortConfig[] || []);
      setHiddenColumns(viewData.hiddenColumns as string[] || []);
    }
  }, [viewData]);

  // Filter columns based on hidden columns
  const visibleColumns = useMemo(() => {
    const columns = optimisticData?.columns ?? tableData?.columns ?? [];
    return columns.filter(col => !hiddenColumns.includes(col.id));
  }, [optimisticData?.columns, tableData?.columns, hiddenColumns]);

  // Create table columns (without JSX - just return column config)
  const tableColumns = useMemo<ColumnDef<TableRow, any>[]>(() => {
    if (!visibleColumns.length) return [];
    
    const cols: ColumnDef<TableRow, any>[] = visibleColumns.map((col) => ({
      id: col.id,
      header: col.name,
      accessorKey: col.id as keyof TableRow,
      size: 150,
      minSize: 100,
      maxSize: 300,
    }));

    return cols;
  }, [visibleColumns]);

  // Navigation functions
  const navigateCell = React.useCallback((direction: 'up' | 'down' | 'left' | 'right' | 'arrowup' | 'arrowdown' | 'arrowleft' | 'arrowright') => {
    if (!focusedCell) {
      return;
    }
    
    const rows = optimisticData?.rows ?? tableData?.rows ?? [];
    const columns = optimisticData?.columns ?? tableData?.columns ?? [];
    
    if (!rows.length || !columns.length) {
      return;
    }
    
    const currentRowIndex = rows.findIndex(row => row.id === focusedCell.rowId);
    const currentColumnIndex = columns.findIndex(col => col.id === focusedCell.columnId);
    
    if (currentRowIndex === -1 || currentColumnIndex === -1) {
      return;
    }
    
    let newRowIndex = currentRowIndex;
    let newColumnIndex = currentColumnIndex;
    
    switch (direction) {
      case 'up':
      case 'arrowup':
        newRowIndex = Math.max(0, currentRowIndex - 1);
        break;
      case 'down':
      case 'arrowdown':
        newRowIndex = Math.min(rows.length - 1, currentRowIndex + 1);
        break;
      case 'left':
      case 'arrowleft':
        newColumnIndex = Math.max(0, currentColumnIndex - 1);
        break;
      case 'right':
      case 'arrowright':
        newColumnIndex = Math.min(columns.length - 1, currentColumnIndex + 1);
        break;
    }
    
    if (newRowIndex !== currentRowIndex || newColumnIndex !== currentColumnIndex) {
      const newRow = rows[newRowIndex];
      const newColumn = columns[newColumnIndex];
      if (newRow && newColumn) {
        const newFocusedCell = { rowId: newRow.id, columnId: newColumn.id };
        
        // Exit edit mode when navigating
        setEditingCell(null);
        setFocusedCell(newFocusedCell);
        // Clear selection when navigating
        cellSelection.clearSelection();
        // Clear column selection when navigating
        setSelectedColumn(null);
      }
    }
  }, [focusedCell, optimisticData?.rows, optimisticData?.columns, tableData?.rows, tableData?.columns, setEditingCell, cellSelection, setSelectedColumn]);

  // History management functions
  const addToHistory = React.useCallback((
    type: 'cell_update' | 'cell_delete',
    changes: Array<{rowId: string, columnId: string, oldValue: string, newValue: string}>
  ) => {
    setHistory(prev => {
      // Remove any history after current index (when undoing then making new changes)
      const newHistory = prev.slice(0, historyIndex + 1);
      // Add new history entry
      newHistory.push({
        type,
        data: changes,
        timestamp: Date.now()
      });
      // Keep only last 50 history entries
      return newHistory.slice(-50);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const undo = React.useCallback(() => {
    if (historyIndex < 0 || historyIndex >= history.length) return;
    
    const historyEntry = history[historyIndex];
    if (!historyEntry) return;

    // Apply reverse changes
    historyEntry.data.forEach(change => {
      operations.updateData(change.rowId, change.columnId, change.oldValue);
    });

    setHistoryIndex(prev => prev - 1);
  }, [historyIndex, history, operations]);

  const redo = React.useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    
    const nextIndex = historyIndex + 1;
    const historyEntry = history[nextIndex];
    if (!historyEntry) return;

    // Apply forward changes
    historyEntry.data.forEach(change => {
      operations.updateData(change.rowId, change.columnId, change.newValue);
    });

    setHistoryIndex(nextIndex);
  }, [historyIndex, history, operations]);

  // Function to get current cell value
  const getCurrentCellValue = React.useCallback((rowId: string, columnId: string): string => {
    const rows = optimisticData?.rows ?? tableData?.rows ?? [];
    const row = rows.find(r => r.id === rowId);
    return row ? String((row as any)[columnId] ?? '') : '';
  }, [optimisticData?.rows, tableData?.rows]);

  // Wrapper function for deleteSelectedCells
  const deleteSelectedCellsWrapper = React.useCallback(() => {
    cellSelection.deleteSelectedCells(
      (rowId: string, columnId: string, value: string) => {
        // updateData now handles immediate updates for delete operations
        operations.updateData(rowId, columnId, value, undefined);
      },
      getCurrentCellValue,
      addToHistory
    );
  }, [cellSelection, operations, getCurrentCellValue, addToHistory]);

  // View update functions
  const updateViewFilters = React.useCallback((filters: ViewFilters) => {
    setViewFilters(filters);
    if (currentViewId) {
      updateViewMutation.mutate({
        baseId,
        viewId: currentViewId,
        filters,
      });
    }
  }, [baseId, currentViewId, updateViewMutation]);

  const updateViewSorts = React.useCallback((sorts: SortConfig[]) => {
    setViewSorts(sorts);
    if (currentViewId) {
      updateViewMutation.mutate({
        baseId,
        viewId: currentViewId,
        sorts,
      });
    }
  }, [baseId, currentViewId, updateViewMutation]);

  const updateHiddenColumns = React.useCallback((hidden: string[]) => {
    setHiddenColumns(hidden);
    if (currentViewId) {
      updateViewMutation.mutate({
        baseId,
        viewId: currentViewId,
        hiddenColumns: hidden,
      });
    }
  }, [baseId, currentViewId, updateViewMutation]);

  // Apply filters to rows
  const filteredRows = useMemo(() => {
    const rows = optimisticData?.rows ?? tableData?.rows ?? [];
    const columns = optimisticData?.columns ?? tableData?.columns ?? [];
    
    if (!viewFilters.conditions.length && !viewFilters.groups.length) {
      return rows;
    }

    return rows.filter(row => {
      // Apply search term filter first
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = columns.some(col => {
          const value = String((row as any)[col.id] ?? '').toLowerCase();
          return value.includes(searchLower);
        });
        if (!matchesSearch) return false;
      }

      // Apply view filters
      return evaluateFilters(viewFilters, row, columns);
    });
  }, [optimisticData?.rows, tableData?.rows, optimisticData?.columns, tableData?.columns, viewFilters, searchTerm]);

  // Apply sorts to filtered rows
  const sortedRows = useMemo(() => {
    if (!viewSorts.length) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      for (const sort of viewSorts) {
        const aValue = String((a as any)[sort.columnId] ?? '');
        const bValue = String((b as any)[sort.columnId] ?? '');
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        else if (aValue > bValue) comparison = 1;
        
        if (comparison !== 0) {
          return sort.direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }, [filteredRows, viewSorts]);

  // Create table instance
  const table = useReactTable({
    data: sortedRows as any[],
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
      updateData: (rowId: string, columnId: string, value: string) => operations.updateData(rowId, columnId, value, addToHistory),
      addRow: operations.addRow,
      deleteRow: operations.deleteRow,
      addColumn: operations.addColumn,
      deleteColumn: operations.deleteColumn,
      updateColumnName: operations.updateColumnName,
      editingCell,
      setEditingCell,
      focusedCell,
      setFocusedCell,
      navigateCell,
      selectedColumn,
      setSelectedColumn,
      addToHistory,
      undo,
      redo,
      selectedCells: cellSelection.selectedCells,
      startSelection: cellSelection.startSelection,
      updateSelection: (endRowId: string, endColumnId: string) => 
        cellSelection.updateSelection(endRowId, endColumnId, optimisticData?.rows ?? [], optimisticData?.columns ?? []),
      endSelection: cellSelection.endSelection,
      clearSelection: cellSelection.clearSelection,
      deleteSelectedCells: deleteSelectedCellsWrapper,
      isSelecting: cellSelection.isSelecting,
    },
  });

  return {
    table,
    tableData,
    optimisticData,
    isLoading,
    columns: visibleColumns,
    rows: sortedRows,
    allColumns: optimisticData?.columns ?? tableData?.columns ?? [],
    allRows: optimisticData?.rows ?? tableData?.rows ?? [],
    tableInfo: tableData?.table ?? null,
    // View state
    viewFilters,
    viewSorts,
    hiddenColumns,
    currentViewId,
    // View update functions
    updateViewFilters,
    updateViewSorts,
    updateHiddenColumns,
    // Search state
    searchTerm,
    setSearchTerm,
    // Editing state
    editingCell,
    setEditingCell,
    // Focus state
    focusedCell,
    setFocusedCell,
    navigateCell,
    // Column selection state
    selectedColumn,
    setSelectedColumn,
    // Selection state
    selectedCells: cellSelection.selectedCells,
    startSelection: cellSelection.startSelection,
    updateSelection: (endRowId: string, endColumnId: string) => 
      cellSelection.updateSelection(endRowId, endColumnId, optimisticData?.rows ?? [], optimisticData?.columns ?? []),
    endSelection: cellSelection.endSelection,
    clearSelection: cellSelection.clearSelection,
    deleteSelectedCells: deleteSelectedCellsWrapper,
    isSelecting: cellSelection.isSelecting,
    // History functions
    undo,
    redo,
    canUndo: historyIndex >= 0,
    canRedo: historyIndex < history.length - 1,
    // Utility functions
    isTemporaryRow: (rowId: string) => tempRowIds.current.has(rowId),
    isPendingUpdate: (rowId: string, columnId: string) => pendingUpdates.current.has(`${rowId}-${columnId}`),
  };
}