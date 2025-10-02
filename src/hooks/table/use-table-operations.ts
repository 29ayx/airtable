import { useCallback, useMemo, useRef } from 'react'
import { debounce, createTempRowId, createTempColumnId } from './utils'

export interface TableOperationsConfig {
  baseId: string
  tempRowIds: React.MutableRefObject<Set<string>>
  tempRowData: React.MutableRefObject<Map<string, Record<string, string>>>
  pendingUpdates: React.MutableRefObject<Map<string, {rowId: string, columnId: string, value: any}>>
  setOptimisticData: React.Dispatch<React.SetStateAction<{columns: any[], rows: any[]} | null>>
  optimisticData: {columns: any[], rows: any[]} | null
  mutations: {
    addRowMutation: any
    deleteRowMutation: any
    addColumnMutation: any
    deleteColumnMutation: any
    updateColumnNameMutation: any
    updateCellMutation: any
  }
}

export function useTableOperations(config: TableOperationsConfig) {
  const {
    baseId,
    tempRowIds,
    tempRowData,
    pendingUpdates,
    setOptimisticData,
    optimisticData,
    mutations
  } = config;

  // Debounced update function
  const debouncedUpdateCell = useMemo(() => 
    debounce((rowId: string, columnId: string, value: any) => {
      const key = `${rowId}-${columnId}`;
      console.log('⏰ debouncedUpdateCell called:', { rowId, columnId, value, key });
      
      if (pendingUpdates.current.has(key)) {
        console.log('⏸️ Skipping - already pending:', key);
        return;
      }
      
      pendingUpdates.current.set(key, { rowId, columnId, value });
      console.log('📡 Sending updateCell mutation:', { baseId, rowId, columnId, value });
      
      mutations.updateCellMutation.mutate({
        baseId,
        rowId,
        columnId,
        value: value || "",
      });
    }, 300), [baseId, mutations.updateCellMutation]
  );

  // Core table operations
  const updateData = useCallback((rowId: string, columnId: string, value: any) => {
    console.log('🔄 updateData called:', { rowId, columnId, value, isTemp: tempRowIds.current.has(rowId) });
    
    // Handle temporary rows
    if (tempRowIds.current.has(rowId)) {
      console.log('📝 Updating temp row data in real-time');
      
      if (!tempRowData.current.has(rowId)) {
        tempRowData.current.set(rowId, {});
      }
      const currentTempData = tempRowData.current.get(rowId)!;
      currentTempData[columnId] = value || "";
      tempRowData.current.set(rowId, currentTempData);
      
      console.log('💾 Temp row data updated:', { rowId, data: currentTempData });
      
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
    setOptimisticData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map(row => 
          row.id === rowId ? { ...row, [columnId]: value || "" } : row
        )
      };
    });
    
    debouncedUpdateCell(rowId, columnId, value);
  }, [debouncedUpdateCell, tempRowIds, tempRowData, setOptimisticData]);

  const addRow = useCallback(() => {
    const tempRowId = createTempRowId();
    tempRowIds.current.add(tempRowId);
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
    mutations.addRowMutation.mutate({ baseId, tempRowId });
  }, [baseId, mutations.addRowMutation, tempRowIds, tempRowData, setOptimisticData]);

  const deleteRow = useCallback((rowId: string) => {
    setOptimisticData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.filter(row => row.id !== rowId)
      };
    });
    
    mutations.deleteRowMutation.mutate({ baseId, rowId });
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
          const { [columnId]: deleted, ...rest } = row;
          return rest;
        })
      };
    });
    
    mutations.deleteColumnMutation.mutate({ baseId, columnId });
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
      columnId,
      name: newName,
    });
  }, [baseId, mutations.updateColumnNameMutation, setOptimisticData]);

  return {
    updateData,
    addRow,
    deleteRow,
    addColumn,
    deleteColumn,
    updateColumnName,
  };
}
