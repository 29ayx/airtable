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
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || '')

  const handleSave = () => {
    table.options.meta?.updateData(row.original.id, column.id, editValue)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(value || '')
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="h-7 border-0 p-1 text-sm focus:ring-1 focus:ring-blue-500"
        autoFocus
      />
    )
  }

  return (
    <div
      className="h-7 px-1 py-1 text-sm cursor-pointer hover:bg-gray-100 rounded flex items-center"
      onClick={() => setIsEditing(true)}
    >
      {value || ''}
    </div>
  )
}
