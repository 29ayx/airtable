"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUp, X } from "lucide-react"

interface ColumnHeaderProps {
  column: {
    id: string
    columnDef: { header: string }
    getIsSorted: () => string | false
  }
  table: {
    options: {
      meta?: {
        updateColumnName: (columnId: string, name: string) => void
        deleteColumn: (columnId: string) => void
      }
    }
  }
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({ column, table }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(column.columnDef.header as string)

  const handleSave = () => {
    table.options.meta?.updateColumnName(column.id, editValue)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(column.columnDef.header as string)
      setIsEditing(false)
    }
  }

  const handleDeleteColumn = () => {
    table.options.meta?.deleteColumn(column.id)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-6 text-xs border-0 p-1 focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4"
          onClick={handleDeleteColumn}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <div
        className="flex items-center gap-1 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 rounded px-1"
        onClick={() => setIsEditing(true)}
      >
        {column.columnDef.header}
        {column.getIsSorted() === 'asc' && <ArrowUp className="h-3 w-3" />}
        {column.getIsSorted() === 'desc' && <ArrowUp className="h-3 w-3 rotate-180" />}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 opacity-0 group-hover:opacity-100"
        onClick={handleDeleteColumn}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
