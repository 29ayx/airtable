import { useRef } from 'react'
import { api } from "@/trpc/react"

export interface TableMutationsConfig {
  baseId: string
  tempRowIds: React.MutableRefObject<Set<string>>
  tempRowData: React.MutableRefObject<Map<string, Record<string, string>>>
  pendingUpdates: React.MutableRefObject<Map<string, {rowId: string, columnId: string, value: any}>>
  setOptimisticData: React.Dispatch<React.SetStateAction<{columns: any[], rows: any[]} | null>>
  tableData: any
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
            col.id === `temp-col-${variables.name}` ? newColumn : col
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
        const originalColumn = tableData.columns.find((col: any) => col.id === variables.columnId);
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
        const originalColumn = tableData.columns.find((col: any) => col.id === variables.columnId);
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

  // Row mutations
  const addRowMutation = api.table.addRow.useMutation({
    onSuccess: (newRow, variables) => {
      const tempRowId = variables.tempRowId;
      console.log('✅ addRowMutation success:', { newRow, tempRowId });
      
      if (tempRowId && tempRowIds.current.has(tempRowId)) {
        const trackedTempData = tempRowData.current.get(tempRowId) || {};
        console.log('📋 Using real-time tracked temp data:', trackedTempData);
        
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
        
        // Send cell updates for temp row data
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
              value: value || "",
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
        tempRowIds.current.delete(tempRowId);
        tempRowData.current.delete(tempRowId);
      }
    }
  });
  
  const deleteRowMutation = api.table.deleteRow.useMutation({
    onError: (error, variables) => {
      if (tableData) {
        const originalRow = tableData.rows.find((row: any) => row.id === variables.rowId);
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
      
      if (tableData) {
        const originalRow = tableData.rows.find((row: any) => row.id === variables.rowId);
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
