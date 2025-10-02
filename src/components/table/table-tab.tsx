"use client"

import React from 'react'
import { TableToolbar } from "./table-toolbar"
import { DataTable } from "./data-table"

interface TableTabProps {
  table: any
  addRow: () => void
  addColumn: () => void
  deleteRow: (rowId: string) => void
}

export const TableTab: React.FC<TableTabProps> = ({ 
  table, 
  addRow, 
  addColumn, 
  deleteRow 
}) => {
  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white">
      <TableToolbar />
      
      <DataTable 
        table={table}
        addRow={addRow}
        addColumn={addColumn}
        deleteRow={deleteRow}
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
