"use client"

import React, { useState, useEffect, useRef } from 'react'
import type { Row } from '@tanstack/react-table'

interface EditableCellProps {
  value: any
  row: Row<any>
  column: any
  table: any
}

export const EditableCell: React.FC<EditableCellProps> = ({ value, row, column, table }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update editValue when value prop changes (from optimistic updates)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value || '')
    }
  }, [value, isEditing])

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // Call the update function with optimistic update
      await table.options.meta?.updateData(row.original.id, column.id, editValue)
      setIsEditing(false)
    } catch (err) {
      setError('Failed to save')
      // Revert to original value on error
      setEditValue(value || '')
      // Keep editing mode so user can retry
    } finally {
      setIsLoading(false)
    }
  }

  const moveToNextCell = (direction: 'down' | 'right' | 'left') => {
    if (direction === 'down') {
      const currentRowIndex = row.index
      const nextRowIndex = currentRowIndex + 1
      const rows = table.getRowModel().rows
      if (nextRowIndex < rows.length) {
        setTimeout(() => {
          const nextCell = document.querySelector(
            `[data-row-index="${nextRowIndex}"][data-column-id="${column.id}"]`
          ) as HTMLElement
          if (nextCell) {
            nextCell.click()
          }
        }, 50)
      }
    } else if (direction === 'right' || direction === 'left') {
      const columns = table.getVisibleLeafColumns()
      const currentColumnIndex = columns.findIndex(col => col.id === column.id)
      const nextColumnIndex = direction === 'right' ? currentColumnIndex + 1 : currentColumnIndex - 1
      
      if (nextColumnIndex >= 0 && nextColumnIndex < columns.length) {
        setTimeout(() => {
          const nextCell = document.querySelector(
            `[data-row-index="${row.index}"][data-column-id="${columns[nextColumnIndex].id}"]`
          ) as HTMLElement
          if (nextCell) {
            nextCell.click()
          }
        }, 50)
      }
    }
  }

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      await handleSave()
      if (!error) {
        moveToNextCell('down')
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      await handleSave()
      if (!error) {
        moveToNextCell(e.shiftKey ? 'left' : 'right')
      }
    } else if (e.key === 'Escape') {
      setEditValue(value || '')
      setError(null)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <div className="w-full h-full relative">
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value)
            setError(null) // Clear error on new input
          }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`w-full h-full border-0 outline-0 bg-transparent text-sm p-0 m-0 ${
            error ? 'bg-red-50' : isLoading ? 'bg-blue-50' : ''
          }`}
          disabled={isLoading}
          autoFocus
        />
        {isLoading && (
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        )}
        {error && (
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
            <div className="w-2 h-2 bg-red-500 rounded-full" title={error}></div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`w-full h-full text-sm cursor-pointer p-0 m-0 ${
        error ? 'bg-red-50' : ''
      }`}
      onClick={() => {
        setIsEditing(true)
        setError(null)
      }}
      data-row-index={row.index}
      data-column-id={column.id}
      title={error || undefined}
    >
      {value || ''}
    </div>
  )
}
