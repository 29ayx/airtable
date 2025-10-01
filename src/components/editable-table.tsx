"use client"

import React, { useState, useMemo, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  Row,
} from '@tanstack/react-table'
import {
  ChevronDown,
  Plus,
  Search,
  Menu,
  Grid3x3,
  EyeOff,
  Filter,
  Group,
  ArrowUpDown,
  Palette,
  Share2,
  MoreVertical,
  ArrowUp,
  MessageSquare,
  User,
  Circle,
  Paperclip,
  Info,
  HelpCircle,
  Bell,
  LogOut,
  X,
  Edit3,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Types
interface TableData {
  id: string
  [key: string]: any
}

interface Column {
  id: string
  name: string
  type: 'text' | 'number' | 'select' | 'date' | 'attachment'
  options?: string[]
}

// Editable Cell Component
interface EditableCellProps {
  value: any
  row: Row<TableData>
  column: any
  table: any
}

const EditableCell: React.FC<EditableCellProps> = ({ value, row, column, table }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || '')

  const handleSave = () => {
    table.options.meta?.updateData(row.index, column.id, editValue)
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

// Column Header Component
interface ColumnHeaderProps {
  column: any
  table: any
}

const ColumnHeader: React.FC<ColumnHeaderProps> = ({ column, table }) => {
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

// Main Table Component
export default function EditableTable() {
  // Initial data
  const [data, setData] = useState<TableData[]>([
    { id: '1', name: 'Task 1', notes: '', assignee: '', status: '', attachments: '' },
    { id: '2', name: 'Task 2', notes: '', assignee: '', status: '', attachments: '' },
    { id: '3', name: 'Task 3', notes: '', assignee: '', status: '', attachments: '' },
    { id: '4', name: 'Task 4', notes: '', assignee: '', status: '', attachments: '' },
    { id: '5', name: 'Task 5', notes: '', assignee: '', status: '', attachments: '' },
  ])

  const [columns, setColumns] = useState<Column[]>([
    { id: 'name', name: 'Name', type: 'text' },
    { id: 'notes', name: 'Notes', type: 'text' },
    { id: 'assignee', name: 'Assignee', type: 'text' },
    { id: 'status', name: 'Status', type: 'select', options: ['To Do', 'In Progress', 'Done'] },
    { id: 'attachments', name: 'Attachments', type: 'attachment' },
  ])

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Table meta functions
  const updateData = useCallback((rowIndex: number, columnId: string, value: any) => {
    setData(prev => prev.map((row, index) => 
      index === rowIndex ? { ...row, [columnId]: value } : row
    ))
  }, [])

  const addRow = useCallback(() => {
    const newId = (data.length + 1).toString()
    const newRow: TableData = { id: newId }
    columns.forEach(col => {
      newRow[col.id] = ''
    })
    setData(prev => [...prev, newRow])
  }, [data.length, columns])

  const deleteRow = useCallback((rowIndex: number) => {
    setData(prev => prev.filter((_, index) => index !== rowIndex))
  }, [])

  const addColumn = useCallback(() => {
    const newColumnId = `column_${columns.length + 1}`
    const newColumn: Column = { id: newColumnId, name: 'New Column', type: 'text' }
    setColumns(prev => [...prev, newColumn])
    
    // Add empty values for the new column to all existing rows
    setData(prev => prev.map(row => ({ ...row, [newColumnId]: '' })))
  }, [columns.length])

  const deleteColumn = useCallback((columnId: string) => {
    if (columns.length <= 1) return // Don't delete the last column
    
    setColumns(prev => prev.filter(col => col.id !== columnId))
    setData(prev => prev.map(row => {
      const { [columnId]: deleted, ...rest } = row
      return rest as TableData
    }))
  }, [columns.length])

  const updateColumnName = useCallback((columnId: string, newName: string) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, name: newName } : col
    ))
  }, [])

  // Create columns dynamically
  const tableColumns = useMemo<ColumnDef<TableData>[]>(() => {
    const cols: ColumnDef<TableData>[] = columns.map(col => ({
      id: col.id,
      header: col.name,
      accessorKey: col.id,
      size: 150,
      minSize: 100,
      maxSize: 300,
      cell: ({ getValue, row, column, table }) => (
        <EditableCell
          value={getValue()}
          row={row}
          column={column}
          table={table}
        />
      ),
    }))

    return cols
  }, [columns])

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      columnFilters,
    },
    meta: {
      updateData,
      addRow,
      deleteRow,
      addColumn,
      deleteColumn,
      updateColumnName,
    },
  })

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Top Navigation Bar */}
      <header className="flex h-12 items-center justify-between border-b border-gray-200 px-4">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#e91e63]">
            <div className="h-5 w-5 rounded-sm bg-white" />
          </div>

          {/* Base Name */}
          <button className="flex items-center gap-1 text-sm font-semibold text-gray-900 hover:bg-gray-100 rounded px-2 py-1">
            Untitled Base
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Center Navigation */}
        <nav className="flex items-center gap-6">
          <button className="text-sm font-medium text-gray-900 border-b-2 border-[#e91e63] pb-3 pt-3">Data</button>
          <button className="text-sm font-medium text-gray-600 hover:text-gray-900 pb-3 pt-3">Automations</button>
          <button className="text-sm font-medium text-gray-600 hover:text-gray-900 pb-3 pt-3">Interfaces</button>
          <button className="text-sm font-medium text-gray-600 hover:text-gray-900 pb-3 pt-3">Forms</button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-sm bg-transparent">
            <Grid3x3 className="h-4 w-4" />
            Launch
          </Button>
          <Button size="sm" className="h-8 bg-[#e91e63] hover:bg-[#d81b60] text-white text-sm">
            Share
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
          <div className="p-3 border-b border-gray-200">
            {/* Table Selector */}
            <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-100">
              <div className="flex h-6 w-6 items-center justify-center">
                <Grid3x3 className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Table 1</span>
              <ChevronDown className="ml-auto h-4 w-4 text-gray-600" />
            </button>
          </div>

     

          {/* Views Section */}
          <div className="flex-1 p-3">
        

            <div className="space-y-1">
              <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
                <Plus className="h-4 w-4" />
                Create new...
              </button>
              <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
                <Search className="h-4 w-4" />
                Find a view
              </button>
            </div>

            <div className="mt-2">
              <button className="flex w-full items-center gap-2 rounded bg-blue-50 px-2 py-1.5 text-sm font-medium text-blue-600">
                <Grid3x3 className="h-4 w-4" />
                Grid view
              </button>
            </div>
          </div>

          {/* Bottom Icons */}
          <div className="border-t border-gray-200 p-3 space-y-2">
            <button className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100">
              <HelpCircle className="h-5 w-5 text-gray-600" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100">
              <Bell className="h-5 w-5 text-gray-600" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded bg-[#e91e63] text-white font-semibold text-sm">
              T
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-sm text-gray-700">
                <Grid3x3 className="h-4 w-4" />
                Grid view
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-sm text-gray-700">
                <EyeOff className="h-4 w-4" />
                Hide fields
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-sm text-gray-700">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-sm text-gray-700">
                <Group className="h-4 w-4" />
                Group
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-sm text-gray-700">
                <ArrowUpDown className="h-4 w-4" />
                Sort
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-sm text-gray-700">
                <Palette className="h-4 w-4" />
                Color
              </Button>
              <div className="mx-1 h-5 w-px bg-gray-200" />
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4 text-gray-700" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-sm text-gray-700">
                <Share2 className="h-4 w-4" />
                Share and sync
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Search className="h-4 w-4 text-gray-700" />
              </Button>
            </div>

            <Button variant="ghost" size="sm" className="h-8 gap-1 text-sm text-gray-700">
              Tools
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Grid/Table */}
          <div className="flex-1 overflow-auto bg-gray-200 p-4">
            <table className="w-full border-collapse bg-white shadow-sm">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="bg-gray-50 group">
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="border-r border-b border-gray-200 px-3 py-2 text-left relative"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className="cursor-pointer select-none"
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
                    <th className="border-b border-gray-200 px-3 py-2 text-left w-12">
                      <button
                        className="flex items-center justify-center w-full h-7 rounded hover:bg-gray-100"
                        onClick={addColumn}
                      >
                        <Plus className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    </th>
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="group hover:bg-gray-50">
                    {row.getVisibleCells().map(cell => (
                      <td
                        key={cell.id}
                        className="border-r border-b border-gray-200 px-3 py-1 h-9"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    {/* Empty cell for add column button alignment */}
                    <td className="border-b border-gray-200 px-3 py-1 h-9 w-12"></td>
                  </tr>
                ))}
                {/* Add Row Template - Single Row Spanning All Columns */}
                <tr className="group hover:bg-gray-50 border-b border-gray-200">
                  <td 
                    colSpan={(table.getHeaderGroups()[0]?.headers.length || 0) + 1} 
                    className="border-r border-gray-200 px-3 py-1 h-9"
                  >
                    <button
                      className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 w-full h-7 px-2 py-1 rounded hover:bg-gray-100  border-gray-300 hover:border-gray-400"
                      onClick={addRow}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-xs">Add row</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-end">
            <span className="text-xs text-gray-500">{data.length} records</span>
          </div>
        </main>
      </div>
    </div>
  )
}
