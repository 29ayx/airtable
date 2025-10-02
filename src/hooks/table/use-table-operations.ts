import { useCallback, useMemo } from 'react'
import { debounce, createTempRowId, createTempColumnId } from './utils'
import type { TableColumn, TableRow, CellUpdate, TableMutations } from '@/types/table'

export interface TableOperationsConfig {
  baseId: string
  tableId: string
  tempRowIds: React.MutableRefObject<Set<string>>
  tempRowData: React.MutableRefObject<Map<string, Record<string, string>>>
  pendingUpdates: React.MutableRefObject<Map<string, CellUpdate>>
  setOptimisticData: React.Dispatch<React.SetStateAction<{columns: TableColumn[], rows: TableRow[]} | null>>
  optimisticData: {columns: TableColumn[], rows: TableRow[]} | null
  mutations: TableMutations
}

export function useTableOperations(config: TableOperationsConfig) {
  const {
    baseId,
    tableId,
    tempRowIds,
    tempRowData,
    pendingUpdates,
    setOptimisticData,
    optimisticData,
    mutations
  } = config;

  // Immediate update function for delete operations
  const immediateUpdateCell = useCallback((rowId: string, columnId: string, value: string) => {
    const key = `${rowId}-${columnId}`;
    
    if (!rowId || !columnId) {
      console.error('❌ Invalid parameters for updateCell:', { rowId, columnId, value });
      return;
    }
    
    // Check if there's already a pending update for this cell
    if (pendingUpdates.current.has(key)) {
      // Update the pending value to the new one
      pendingUpdates.current.set(key, { rowId, columnId, value: value ?? "" });
    } else {
      pendingUpdates.current.set(key, { rowId, columnId, value: value ?? "" });
    }
    
    mutations.updateCellMutation.mutate({
      baseId,
      tableId,
      rowId,
      columnId,
      value: value ?? "",
    });
  }, [baseId, mutations.updateCellMutation, pendingUpdates]);

  // Debounced update function
  const debouncedUpdateCell = useMemo(() => 
    debounce((rowId: string, columnId: string, value: string) => {
      const key = `${rowId}-${columnId}`;
      
      if (pendingUpdates.current.has(key)) {
        return;
      }
      
      if (!rowId || !columnId) {
        console.error('❌ Invalid parameters for updateCell:', { rowId, columnId, value });
        return;
      }
      
      pendingUpdates.current.set(key, { rowId, columnId, value: value ?? "" });
      
      mutations.updateCellMutation.mutate({
        baseId,
        tableId,
        rowId,
        columnId,
        value: value ?? "",
      });
    }, 300), [baseId, mutations.updateCellMutation]
  );

  // Core table operations
  const updateData = useCallback((rowId: string, columnId: string, value: string, addToHistory?: (type: 'cell_update', changes: Array<{rowId: string, columnId: string, oldValue: string, newValue: string}>) => void) => {
    // Handle temporary rows
    if (tempRowIds.current.has(rowId)) {
      if (!tempRowData.current.has(rowId)) {
        tempRowData.current.set(rowId, {});
      }
      const currentTempData = tempRowData.current.get(rowId)!;
      currentTempData[columnId] = value ?? "";
      tempRowData.current.set(rowId, currentTempData);
      
      setOptimisticData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          rows: prev.rows.map(row => 
            row.id === rowId ? { ...row, [columnId]: value ?? "" } : row
          )
        };
      });
      return;
    }

    // Get old value for history tracking
    const oldValue = optimisticData?.rows.find(row => row.id === rowId)?.[columnId] ?? '';
    
    // Add to history if function provided and values are different
    if (addToHistory && String(oldValue) !== String(value)) {
      addToHistory('cell_update', [{ rowId, columnId, oldValue: String(oldValue), newValue: String(value) }]);
    }
    
    setOptimisticData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map(row => 
          row.id === rowId ? { ...row, [columnId]: value ?? "" } : row
        )
      };
    });
    
    // Use immediate update for delete operations (empty values)
    if (value === '') {
      immediateUpdateCell(rowId, columnId, value);
    } else {
      debouncedUpdateCell(rowId, columnId, value);
    }
  }, [debouncedUpdateCell, immediateUpdateCell, tempRowIds, tempRowData, setOptimisticData, optimisticData]);

  const addRow = useCallback(() => {
    const tempRowId = createTempRowId();
    tempRowIds.current.add(tempRowId);
    tempRowData.current.set(tempRowId, {});
    
    setOptimisticData(prev => {
      if (!prev) return prev;
      const newRow: TableRow = { id: tempRowId };
      prev.columns.forEach((col) => {
        newRow[col.id] = "";
      });
      return {
        ...prev,
        rows: [...prev.rows, newRow]
      };
    });
    
    mutations.addRowMutation.mutate({ baseId, tableId, tempRowId });
  }, [baseId, mutations.addRowMutation, tempRowIds, tempRowData, setOptimisticData]);

  const deleteRow = useCallback((rowId: string) => {
    setOptimisticData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.filter(row => row.id !== rowId)
      };
    });
    
    mutations.deleteRowMutation.mutate({ baseId, tableId, rowId });
  }, [baseId, mutations.deleteRowMutation, setOptimisticData]);

  const addColumn = useCallback(() => {
    const columnName = "New Column";
    const tempColumnId = createTempColumnId(columnName);
    
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
    
    mutations.addColumnMutation.mutate({
      baseId,
      tableId,
      name: columnName,
      type: "text",
    });
  }, [baseId, mutations.addColumnMutation, setOptimisticData]);

  const deleteColumn = useCallback((columnId: string) => {
    if (optimisticData?.columns && optimisticData.columns.length <= 1) return;
    
    setOptimisticData(prev => {
      if (!prev) return prev;
      return {
        columns: prev.columns.filter(col => col.id !== columnId),
        rows: prev.rows.map(row => {
          const { [columnId]: _deleted, ...rest } = row;
          return { id: row.id, ...rest } as TableRow;
        })
      };
    });
    
    mutations.deleteColumnMutation.mutate({ baseId, tableId, columnId });
  }, [baseId, optimisticData?.columns, mutations.deleteColumnMutation, setOptimisticData]);

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
    
    mutations.updateColumnNameMutation.mutate({
      baseId,
      tableId,
      columnId,
      name: newName,
    });
  }, [baseId, mutations.updateColumnNameMutation, setOptimisticData]);

  return {
    updateData,
    immediateUpdateCell,
    addRow,
    deleteRow,
    addColumn,
    deleteColumn,
    updateColumnName,
  };
}
