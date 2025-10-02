"use client"

import React from 'react'
import { flexRender } from '@tanstack/react-table'
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { ColumnHeader } from "./column-header"
import { EditableCell } from "./editable-cell"

interface DataTableProps {
  table: any
  addRow: () => Promise<void>
  addColumn: () => Promise<void>
  deleteRow: (rowId: string) => Promise<void>
}

export const DataTable: React.FC<DataTableProps> = ({ 
  table, 
  addRow, 
  addColumn, 
  deleteRow 
}) => {

  return (
    <div className="flex-1 overflow-auto bg-[#f6f8fc]">
      <table className="border-collapse bg-white">
        <thead>
          {table.getHeaderGroups().map((headerGroup: any) => (
            <tr key={headerGroup.id}>
              {/* Row Selection Header */}
              <th className="border border-gray-200 px-1 py-1 w-12 ">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={table.getIsAllRowsSelected()}
                  onChange={table.getToggleAllRowsSelectedHandler()}
                />
              </th>
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
                onClick={() => addColumn()}
              >
                  <Plus className="h-3 w-3" />
                </button>
              </th>
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row: any, index: number) => (
            <tr 
              key={row.id} 
              className={`group ${row.getIsSelected() ? 'bg-blue-50' : ''}`}
            >
              {/* Row Selection Cell */}
              <td className={`border border-gray-200 px-1 py-1 h-8 w-12 text-center text-xs cursor-pointer group ${row.getIsSelected() ? 'bg-blue-100' : ''}`}>
                <div 
                  className="flex items-center justify-center h-full"
                  onClick={row.getToggleSelectedHandler()}
                >
                  {row.getIsSelected() ? (
                    <input
                      type="checkbox"
                      className="w-3 h-3"
                      checked={true}
                      onChange={() => {}}
                      tabIndex={-1}
                    />
                  ) : (
                    <>
                      <input
                        type="checkbox"
                        className="w-3 h-3 opacity-0 group-hover:opacity-100"
                        checked={false}
                        onChange={() => {}}
                        tabIndex={-1}
                      />
                      <span className="text-gray-500 group-hover:opacity-0 absolute">{index + 1}</span>
                    </>
                  )}
                </div>
              </td>
              {row.getVisibleCells().map((cell: any) => (
                <td
                  key={cell.id}
                  className="border border-gray-200 px-1 py-1 h-8 text-xs"
                >
                  <EditableCell
                    value={cell.getValue()}
                    row={row}
                    column={cell.column}
                    table={table}
                  />
                </td>
              ))}
            </tr>
          ))}
          {/* Add Row Template - Single Row Spanning All Columns */}
          <tr className="group">
            <td 
              colSpan={(table.getHeaderGroups()[0]?.headers.length || 0) + 2} 
              className="border border-gray-200 px-1 py-1 h-8"
            >
              <button
                className="flex items-center justify-center gap-1 w-full h-8 text-xs"
                onClick={() => addRow()}
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
