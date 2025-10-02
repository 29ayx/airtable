"use client"

import React, { useState } from 'react'
import { ChevronDown, ArrowUpAZ, ArrowDownAZ, Edit2, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

interface ColumnHeaderProps {
  column: any
  table: any
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({ column, table }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(column.columnDef.header as string)
  
  const selectedColumn = table.options.meta?.selectedColumn;
  const setSelectedColumn = table.options.meta?.setSelectedColumn;
  const isSelected = selectedColumn === column.id;

  const handleHeaderClick = () => {
    // Toggle column selection
    if (isSelected) {
      setSelectedColumn?.(null);
    } else {
      setSelectedColumn?.(column.id);
    }
  };

  const handleSortAsc = () => {
    column.toggleSorting(false);
  };

  const handleSortDesc = () => {
    column.toggleSorting(true);
  };

  const handleEditName = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    table.options.meta?.updateColumnName(column.id, editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditValue(column.columnDef.header as string);
      setIsEditing(false);
    }
  };

  const handleDeleteColumn = () => {
    table.options.meta?.deleteColumn(column.id);
  };

  if (isEditing) {
    return (
      <div className={`w-full h-full flex items-center px-2 py-2 ${isSelected ? 'bg-blue-100' : ''}`}>
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          className="h-6 text-xs border-0 p-1 focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div 
      className={`w-full h-full text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 flex items-center justify-between group ${
        isSelected ? 'bg-blue-100' : ''
      }`}
    >
      <div 
        className="flex-1 px-2 py-2 flex items-center"
        onClick={handleHeaderClick}
      >
        {column.columnDef.header}
        {column.getIsSorted() === 'asc' && <ArrowUpAZ className="ml-1 h-3 w-3" />}
        {column.getIsSorted() === 'desc' && <ArrowDownAZ className="ml-1 h-3 w-3" />}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="px-1 py-2 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded-sm">
            <ChevronDown className="h-3 w-3" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={handleSortAsc}>
            <ArrowUpAZ className="mr-2 h-4 w-4" />
            Sort A → Z
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSortDesc}>
            <ArrowDownAZ className="mr-2 h-4 w-4" />
            Sort Z → A
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleEditName}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit column name
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDeleteColumn} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
