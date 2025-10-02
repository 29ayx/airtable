import type React from 'react'
import { api } from "@/trpc/react"
import type { TableData, CellUpdate, TableColumn, TableRow } from '@/types/table'

export interface TableMutationsConfig {
  baseId: string
  tempRowIds: React.MutableRefObject<Set<string>>
  tempRowData: React.MutableRefObject<Map<string, Record<string, string>>>
  pendingUpdates: React.MutableRefObject<Map<string, CellUpdate>>
  setOptimisticData: React.Dispatch<React.SetStateAction<{columns: TableColumn[], rows: TableRow[]} | null>>
  tableData: TableData | undefined
}

export function useTableMutations(config: TableMutationsConfig) {
  const {
    baseId,
    tempRowIds,
    tempRowData,
    pendingUpdates,
    setOptimisticData,
    tableData
  } = config;

  // Column mutations
  const addColumnMutation = api.table.addColumn.useMutation({
    onSuccess: (newColumn, variables) => {
      setOptimisticData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map(col => 
            col.id === `temp-col-${variables.name}` ? (newColumn as TableColumn) : col
          )
        };
      });
    },
    onError: (error, variables) => {
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
      if (tableData) {
        const originalColumn = tableData.columns.find((col) => col.id === variables.columnId);
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
      if (tableData) {
        const originalColumn = tableData.columns.find((col) => col.id === variables.columnId);
        if (originalColumn) {
          setOptimisticData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
          columns: prev.columns.map(col => 
            col.id === variables.columnId ? (originalColumn as TableColumn) : col
          )
            };
          });
        }
      }
    }
  });

  // Row mutations
  const addRowMutation = api.table.addRow.useMutation({
    onSuccess: (newRow, variables) => {
      const tempRowId = variables.tempRowId;
      
      if (tempRowId && tempRowIds.current.has(tempRowId)) {
        const trackedTempData = tempRowData.current.get(tempRowId) || {};
        
        setOptimisticData(prev => {
          if (!prev) return prev;
          
          const updatedRows = prev.rows.map(row => {
            if (row.id === tempRowId) {
              const mergedRow = { 
                id: newRow.id,
                order: newRow.order,
                createdAt: newRow.createdAt,
                ...trackedTempData,
              };
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
        
        // Send cell updates for temp row data
        setTimeout(() => {
          const cellUpdates = Object.keys(trackedTempData).filter(key => 
            trackedTempData[key] && trackedTempData[key] !== ""
          );
          
          cellUpdates.forEach((columnId) => {
            const value = trackedTempData[columnId];
            updateCellMutation.mutate({
              baseId,
              rowId: newRow.id,
              columnId: columnId,
              value: value ?? "",
            });
          });
        }, 50);
      }
    },
    onError: (error, variables) => {
      const tempRowId = variables.tempRowId;
      
      if (tempRowId && tempRowIds.current.has(tempRowId)) {
        setOptimisticData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            rows: prev.rows.filter(row => row.id !== tempRowId)
          };
        });
        tempRowIds.current.delete(tempRowId);
        tempRowData.current.delete(tempRowId);
      }
    }
  });
  
  const deleteRowMutation = api.table.deleteRow.useMutation({
    onError: (error, variables) => {
      if (tableData) {
        const originalRow = tableData.rows.find((row) => row.id === variables.rowId);
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
      const key = `${variables.rowId}-${variables.columnId}`;
      pendingUpdates.current.delete(key);
    },
    onError: (error, variables) => {
      const key = `${variables.rowId}-${variables.columnId}`;
      pendingUpdates.current.delete(key);
      
      // Don't revert to old data for delete operations (empty values)
      // This prevents deleted content from reappearing
      if (variables.value === '') {
        return;
      }
      
      // For non-delete operations, revert to original value only if we have it
      if (tableData) {
        const originalRow = tableData.rows.find((row) => row.id === variables.rowId);
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

  return {
    addColumnMutation,
    deleteColumnMutation,
    updateColumnNameMutation,
    addRowMutation,
    deleteRowMutation,
    updateCellMutation,
  };
}
