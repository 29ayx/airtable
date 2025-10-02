"use client"

import React from 'react'
import { flexRender } from '@tanstack/react-table'
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { ColumnHeader } from "./column-header"
import { EditableCell } from "./editable-cell"

interface DataTableProps {
  table: any
  addRow: () => void
  addColumn: () => void
  deleteRow: (rowId: string) => void
}

export const DataTable: React.FC<DataTableProps> = ({ 
  table, 
  addRow, 
  addColumn, 
  deleteRow 
}) => {
  // Add cell renderer to columns dynamically
  const columnsWithCellRenderer = table.getAllColumns().map((column: any) => {
    if (column.columnDef.cell) return column; // Already has cell renderer
    
    return {
      ...column,
      columnDef: {
        ...column.columnDef,
        cell: ({ getValue, row, column, table }: any) => (
          <EditableCell
            value={getValue()}
            row={row}
            column={column}
            table={table}
          />
        ),
      }
    };
  });

  return (
    <div className="flex-1 overflow-auto bg-[#f6f8fc]">
      <table className="border-collapse bg-white">
        <thead>
          {table.getHeaderGroups().map((headerGroup: any) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header: any) => (
                <th
                  key={header.id}
                  className="border border-gray-200 px-2 py-1 relative"
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder ? null : (
                    <div
                      className="cursor-pointer select-none text-xs"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <ColumnHeader
                        column={header.column}
                        table={table}
                      />
                    </div>
                  )}
                  {/* Column Resize Handle */}
                  <div
                    className="absolute right-0 top-0 h-full w-1 bg-transparent hover:bg-blue-500 cursor-col-resize"
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                  />
                </th>
              ))}
              {/* Add Column Template */}
              <th className="border border-gray-200 px-2 py-1 w-10">
                <button
                  className="flex items-center justify-center h-5 w-6"
                  onClick={addColumn}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </th>
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row: any) => (
            <tr key={row.id} className="group">
              {row.getVisibleCells().map((cell: any) => (
                <td
                  key={cell.id}
                  className="border border-gray-200 px-2 py-1 h-7 text-xs"
                >
                  {cell.column.columnDef.cell ? (
                    flexRender(cell.column.columnDef.cell, cell.getContext())
                  ) : (
                    <EditableCell
                      value={cell.getValue()}
                      row={row}
                      column={cell.column}
                      table={table}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
          {/* Add Row Template - Single Row Spanning All Columns */}
          <tr className="group">
            <td 
              colSpan={(table.getHeaderGroups()[0]?.headers.length || 0)} 
              className="border border-gray-200 px-2 py-1 h-7"
            >
              <button
                className="flex items-center justify-center gap-1 w-full h-5 text-xs"
                onClick={addRow}
              >
                <Plus className="h-3 w-3" />
                <span>Add row</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
