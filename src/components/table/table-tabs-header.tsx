"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface TableTabsHeaderProps {
  tables: Array<{ id: string; name: string }>
  activeTable: string
  onTableChange: (tableId: string) => void
  onAddTable: () => void
}

export const TableTabsHeader: React.FC<TableTabsHeaderProps> = ({ 
  tables, 
  activeTable, 
  onTableChange, 
  onAddTable 
}) => {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex items-center px-4">
        {/* Table Tabs */}
        <div className="flex items-center">
          {tables.map((table) => (
            <button
              key={table.id}
              onClick={() => onTableChange(table.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTable === table.id
                  ? 'border-[#e91e63] text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {table.name}
            </button>
          ))}
          
          {/* Add Table Button */}
          <button
            onClick={onAddTable}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded ml-2"
          >
            <Plus className="h-4 w-4" />
            Add table
          </button>
        </div>
      </div>
    </div>
  )
}
