"use client"

import React from 'react'
import type { Table } from '@tanstack/react-table'
import { TableToolbar } from "./table-toolbar"
import { DataTable } from "./data-table"
import type { TableRow } from '@/types/table'

interface TableTabProps {
  table: Table<TableRow>
  addRow: () => void
  addColumn: () => void
}

export const TableTab: React.FC<TableTabProps> = ({ 
  table, 
  addRow, 
  addColumn
}) => {
  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white">
      <TableToolbar />
      
      <DataTable 
        table={table}
        addRow={addRow}
        addColumn={addColumn}
      />
      
      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-end">
        <span className="text-xs text-gray-500">
          {table.getRowModel().rows.length} records
        </span>
      </div>
    </div>
  )
}
