"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { EyeOff, Eye } from "lucide-react"
import type { TableColumn } from "@/types/table"

interface ColumnVisibilityDropdownProps {
  columns: TableColumn[];
  hiddenColumns: string[];
  onHiddenColumnsChange: (hiddenColumns: string[]) => void;
}

export const ColumnVisibilityDropdown: React.FC<ColumnVisibilityDropdownProps> = ({
  columns,
  hiddenColumns,
  onHiddenColumnsChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const visibleColumnsCount = columns.length - hiddenColumns.length;

  const toggleColumnVisibility = (columnId: string) => {
    const isHidden = hiddenColumns.includes(columnId);
    if (isHidden) {
      onHiddenColumnsChange(hiddenColumns.filter(id => id !== columnId));
    } else {
      onHiddenColumnsChange([...hiddenColumns, columnId]);
    }
  };

  const showAllColumns = () => {
    onHiddenColumnsChange([]);
  };

  const hideAllColumns = () => {
    if (columns.length > 1) {
      onHiddenColumnsChange(columns.slice(1).map(col => col.id));
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-sm text-gray-700">
          <EyeOff className="h-4 w-4" />
          Hide fields
          {hiddenColumns.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              {hiddenColumns.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Hide fields</h4>
            <span className="text-xs text-gray-500">
              {visibleColumnsCount}/{columns.length} shown
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={showAllColumns}
              className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              Show all
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={hideAllColumns}
              className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              disabled={columns.length <= 1}
            >
              Hide all
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {columns.map((column, index) => {
              const isHidden = hiddenColumns.includes(column.id);
              const isFirstColumn = index === 0;
              
              return (
                <div key={column.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isHidden ? (
                      <EyeOff className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    ) : (
                      <Eye className="h-3 w-3 text-gray-600 flex-shrink-0" />
                    )}
                    <span className={`text-xs truncate ${isHidden ? 'text-gray-400' : 'text-gray-900'}`}>
                      {column.name}
                      {isFirstColumn && (
                        <span className="ml-1 text-gray-500">(Primary)</span>
                      )}
                    </span>
                  </div>
                  <Switch
                    checked={!isHidden}
                    onCheckedChange={() => toggleColumnVisibility(column.id)}
                    disabled={isFirstColumn}
                    className="scale-75"
                  />
                </div>
              );
            })}
          </div>

          {hiddenColumns.length > 0 && (
            <p className="text-xs text-gray-500 pt-2 border-t">
              Hidden fields preserve their data but won't appear in this view.
            </p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
