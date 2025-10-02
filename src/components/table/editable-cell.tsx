"use client"

import React, { useState } from 'react'
import type { Row } from '@tanstack/react-table'
import { createCellKey } from '@/hooks/table/utils'

interface EditableCellProps {
  value: any
  row: Row<any>
  column: any
  table: any
  searchTerm?: string
}

export const EditableCell: React.FC<EditableCellProps> = ({ value, row, column, table, searchTerm = '' }) => {
  const [editValue, setEditValue] = useState(value ?? '')
  
  // Function to check if cell should be highlighted
  const shouldHighlight = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return false;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };
  
  // Get editing state from table meta
  const editingCell = table.options.meta?.editingCell
  const setEditingCell = table.options.meta?.setEditingCell
  const focusedCell = table.options.meta?.focusedCell
  const setFocusedCell = table.options.meta?.setFocusedCell
  const selectedColumn = table.options.meta?.selectedColumn
  const setSelectedColumn = table.options.meta?.setSelectedColumn
  const rowId = row.original?.id ?? row.id;
  const isEditing = editingCell?.rowId === rowId && editingCell?.columnId === column.id
  const isFocused = focusedCell?.rowId === rowId && focusedCell?.columnId === column.id
  const isColumnSelected = selectedColumn === column.id
  
  // Get selection state from table meta
  const selectedCells = table.options.meta?.selectedCells ?? new Set()
  const startSelection = table.options.meta?.startSelection
  const updateSelection = table.options.meta?.updateSelection
  const endSelection = table.options.meta?.endSelection
  const clearSelection = table.options.meta?.clearSelection
  const isSelecting = table.options.meta?.isSelecting
  
  const cellKey = createCellKey(String(rowId), String(column.id))
  const isSelected = selectedCells.has(cellKey)

  const handleSave = () => {
    if (editValue !== value) {
      const rowId = row.original?.id ?? row.id;
      table.options.meta?.updateData(rowId, column.id, editValue)
    }
    setEditingCell(null)
  }

  const startEditing = () => {
    const rowId = row.original?.id ?? row.id;
    const cellId = { rowId, columnId: column.id };
    setEditValue(value ?? '')
    // Always sync both edit and focus state
    setEditingCell(cellId)
    setFocusedCell?.(cellId)
    clearSelection?.() // Clear selection when starting to edit
    setSelectedColumn?.(null) // Clear column selection when starting to edit
  }

  const handleCellClick = () => {
    const rowId = row.original?.id ?? row.id;
    // Exit edit mode when clicking on a different cell
    setEditingCell?.(null);
    setFocusedCell?.({ rowId, columnId: column.id })
    clearSelection?.() // Clear selection when focusing a cell
    setSelectedColumn?.(null) // Clear column selection when focusing a cell
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return; // Don't start selection if editing
    
    e.preventDefault();
    startSelection?.(rowId, column.id);
  }

  const handleMouseEnter = () => {
    if (isSelecting && updateSelection) {
      updateSelection(rowId, column.id);
    }
  }

  const handleMouseUp = () => {
    if (isSelecting) {
      endSelection?.();
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      if (e.shiftKey) {
        // Shift+Enter: Save current cell immediately, then create new row
        
        // Force immediate save of current cell (bypass debouncing)
        if (editValue !== value) {
          const currentRowId = row.original?.id ?? row.id;
          table.options.meta?.updateData(currentRowId, column.id, editValue);
        }
        
        // Exit editing mode
        setEditingCell(null);
        
        // Create new row
        table.options.meta?.addRow();
        
        // Wait for the new row to be added, then select the cell below
        setTimeout(() => {
          const rows = table.getRowModel().rows;
          const currentRowIndex = row.index;
          const newRowIndex = currentRowIndex + 1;
          
          if (newRowIndex < rows.length) {
            const newRow = rows[newRowIndex];
            if (newRow && setEditingCell && setFocusedCell) {
              const newRowId = newRow.original?.id ?? newRow.id;
              const newCellId = { rowId: newRowId, columnId: column.id };
              // Update both editing and focused cell for proper highlighting
              setFocusedCell(newCellId);
              setEditingCell(newCellId);
              // Clear any selections
              clearSelection?.();
              setSelectedColumn?.(null);
            }
          }
        }, 150); // Slightly longer wait to ensure row is added
        
        return;
      }
      
      // Regular Enter: Save and move to cell below
      handleSave()
      
      // Regular Enter: Move to cell below
      const currentRowIndex = row.index
      const nextRowIndex = currentRowIndex + 1
      const rows = table.getRowModel().rows
      if (nextRowIndex < rows.length) {
        // Focus next row, same column
        setTimeout(() => {
          const nextRow = rows[nextRowIndex]
          if (nextRow && setEditingCell && setFocusedCell) {
            const nextRowId = nextRow.original?.id ?? nextRow.id;
            const nextCellId = { rowId: nextRowId, columnId: column.id };
            // Update both editing and focused cell for proper highlighting
            setFocusedCell(nextCellId);
            setEditingCell(nextCellId);
            // Clear any selections
            clearSelection?.();
            setSelectedColumn?.(null);
          }
        }, 10)
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      handleSave()
      // Move to next cell (right)
      const columns = table.getVisibleLeafColumns()
      const currentColumnIndex = columns.findIndex((col: any) => col.id === column.id)
      const nextColumnIndex = e.shiftKey ? currentColumnIndex - 1 : currentColumnIndex + 1
      
      if (nextColumnIndex >= 0 && nextColumnIndex < columns.length) {
        // Same row, next column
        setTimeout(() => {
          const nextColumn = columns[nextColumnIndex]
          if (nextColumn && setEditingCell && setFocusedCell) {
            const nextCellId = { rowId: rowId, columnId: nextColumn.id };
            // Update both editing and focused cell for proper highlighting
            setFocusedCell(nextCellId);
            setEditingCell(nextCellId);
            // Clear any selections
            clearSelection?.();
            setSelectedColumn?.(null);
          }
        }, 10)
      }
    } else if (e.key === 'Escape') {
      setEditValue(value ?? '')
      setEditingCell(null)
      // Keep the cell focused when exiting edit mode with Escape
      const rowId = row.original?.id ?? row.id;
      setFocusedCell?.({ rowId, columnId: column.id })
    }
  }

  if (isEditing) {
    return (
      <div className="w-full h-full flex items-center px-1 ring-2 ring-blue-500 ring-inset bg-blue-50">
        <input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full h-full border-0 outline-0 bg-transparent text-sm p-0 m-0"
          autoFocus
        />
      </div>
    )
  }

  const isHighlighted = shouldHighlight(String(value ?? ''), searchTerm);

  return (
    <div
      className={`w-full h-full text-sm cursor-pointer flex items-center px-1 ${
        isSelected ? 'bg-blue-100 border-blue-300' : 
        isFocused ? 'ring-2 ring-blue-500 ring-inset bg-blue-50' :
        isColumnSelected ? 'bg-blue-50' :
        isHighlighted ? 'bg-yellow-200' : ''
      }`}
      onClick={(e) => {
        // If cell is already focused, start editing on second click
        if (isFocused) {
          startEditing();
        } else {
          // Otherwise, just focus the cell
          handleCellClick();
        }
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseUp={handleMouseUp}
      data-row-index={row.index}
      data-column-id={column.id}
    >
      {value ?? ''}
    </div>
  )
}
