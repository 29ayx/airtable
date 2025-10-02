import { useState, useCallback } from 'react'
import { createCellKey, parseCellKey } from './utils'

export interface CellSelectionState {
  selectedCells: Set<string>
  selectionStart: {rowId: string, columnId: string} | null
  isSelecting: boolean
}

export interface CellSelectionActions {
  startSelection: (rowId: string, columnId: string) => void
  updateSelection: (endRowId: string, endColumnId: string, rows: any[], columns: any[]) => void
  endSelection: () => void
  clearSelection: () => void
  deleteSelectedCells: (updateData: (rowId: string, columnId: string, value: string) => void) => void
}

export function useCellSelection(): CellSelectionState & CellSelectionActions {
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [selectionStart, setSelectionStart] = useState<{rowId: string, columnId: string} | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)

  const startSelection = useCallback((rowId: string, columnId: string) => {
    setSelectionStart({ rowId, columnId });
    setSelectedCells(new Set([createCellKey(rowId, columnId)]));
    setIsSelecting(true);
  }, []);

  const updateSelection = useCallback((endRowId: string, endColumnId: string, rows: any[], columns: any[]) => {
    if (!selectionStart) return;

    const startRowIndex = rows.findIndex(row => row.id === selectionStart.rowId);
    const endRowIndex = rows.findIndex(row => row.id === endRowId);
    const startColIndex = columns.findIndex(col => col.id === selectionStart.columnId);
    const endColIndex = columns.findIndex(col => col.id === endColumnId);

    if (startRowIndex === -1 || endRowIndex === -1 || startColIndex === -1 || endColIndex === -1) return;

    const minRow = Math.min(startRowIndex, endRowIndex);
    const maxRow = Math.max(startRowIndex, endRowIndex);
    const minCol = Math.min(startColIndex, endColIndex);
    const maxCol = Math.max(startColIndex, endColIndex);

    const newSelection = new Set<string>();
    for (let rowIdx = minRow; rowIdx <= maxRow; rowIdx++) {
      for (let colIdx = minCol; colIdx <= maxCol; colIdx++) {
        const rowId = rows[rowIdx].id;
        const columnId = columns[colIdx].id;
        newSelection.add(createCellKey(rowId, columnId));
      }
    }

    setSelectedCells(newSelection);
  }, [selectionStart]);

  const endSelection = useCallback(() => {
    setIsSelecting(false);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCells(new Set());
    setSelectionStart(null);
    setIsSelecting(false);
  }, []);

  const deleteSelectedCells = useCallback((updateData: (rowId: string, columnId: string, value: string) => void) => {
    if (selectedCells.size === 0) return;

    selectedCells.forEach(cellKey => {
      const [rowId, columnId] = parseCellKey(cellKey);
      if (rowId && columnId) {
        updateData(rowId, columnId, '');
      }
    });

    clearSelection();
  }, [selectedCells, clearSelection]);

  return {
    selectedCells,
    selectionStart,
    isSelecting,
    startSelection,
    updateSelection,
    endSelection,
    clearSelection,
    deleteSelectedCells,
  };
}
