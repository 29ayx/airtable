"use client"

import React from 'react'

interface ColumnHeaderProps {
  column: any
  table: any
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({ column }) => {
  return (
    <div className="text-xs font-medium text-gray-700 px-1">
      {column.columnDef.header}
    </div>
  )
}
