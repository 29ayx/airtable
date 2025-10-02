"use client"

import React, { useState } from 'react'
import { Input } from "@/components/ui/input"
import type { Row } from '@tanstack/react-table'

interface EditableCellProps {
  value: any
  row: Row<any>
  column: any
  table: any
}

export const EditableCell: React.FC<EditableCellProps> = ({ value, row, column, table }) => {
  const [editValue, setEditValue] = useState(value || '')
  
  // Get editing state from table meta
  const editingCell = table.options.meta?.editingCell
  const setEditingCell = table.options.meta?.setEditingCell
  const rowId = row.original?.id || row.id;
  const isEditing = editingCell?.rowId === rowId && editingCell?.columnId === column.id

  const handleSave = () => {
    if (editValue !== value) {
      const rowId = row.original?.id || row.id;
      table.options.meta?.updateData(rowId, column.id, editValue)
    }
    setEditingCell(null)
  }

  const startEditing = () => {
    const rowId = row.original?.id || row.id;
    setEditValue(value || '')
    setEditingCell({ rowId, columnId: column.id })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      if (e.shiftKey) {
        // Shift+Enter: Save current cell immediately, then create new row
        console.log('🆕 Shift+Enter pressed - saving current cell and creating new row');
        
        // Force immediate save of current cell (bypass debouncing)
        if (editValue !== value) {
          const currentRowId = row.original?.id || row.id;
          console.log('💾 Force saving current cell before new row:', { rowId: currentRowId, columnId: column.id, value: editValue });
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
            if (newRow && setEditingCell) {
              const newRowId = newRow.original?.id || newRow.id;
              console.log('🎯 Auto-selecting cell in new row:', { rowId: newRowId, columnId: column.id });
              setEditingCell({ rowId: newRowId, columnId: column.id });
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
          if (nextRow && setEditingCell) {
            const nextRowId = nextRow.original?.id || nextRow.id;
            setEditingCell({ rowId: nextRowId, columnId: column.id })
          }
        }, 10)
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      handleSave()
      // Move to next cell (right)
      const columns = table.getVisibleLeafColumns()
      const currentColumnIndex = columns.findIndex(col => col.id === column.id)
      const nextColumnIndex = e.shiftKey ? currentColumnIndex - 1 : currentColumnIndex + 1
      
      if (nextColumnIndex >= 0 && nextColumnIndex < columns.length) {
        // Same row, next column
        setTimeout(() => {
          const nextColumn = columns[nextColumnIndex]
          if (nextColumn && setEditingCell) {
            setEditingCell({ rowId: rowId, columnId: nextColumn.id })
          }
        }, 10)
      }
    } else if (e.key === 'Escape') {
      setEditValue(value || '')
      setEditingCell(null)
    }
  }

  if (isEditing) {
    return (
      <input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full h-full border-0 outline-0 bg-transparent text-sm p-0 m-0"
        autoFocus
      />
    )
  }

  return (
    <div
      className="w-full h-full text-sm cursor-pointer p-0 m-0"
      onClick={startEditing}
      data-row-index={row.index}
      data-column-id={column.id}
    >
      {value || ''}
    </div>
  )
}
