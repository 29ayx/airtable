"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronDown, 
  Grid3x3, 
  Group, 
  ArrowUpDown, 
  Palette, 
  MoreVertical, 
  Share2, 
  Search,
  X
} from "lucide-react"
import type { ViewFilters, SortConfig } from "@/types/view"
import type { TableColumn } from "@/types/table"
import { FilterDropdown } from "./filter-dropdown"
import { ColumnVisibilityDropdown } from "./column-visibility-dropdown"
import { SortDialog } from "./sort-dialog"

interface TableToolbarProps {
  searchTerm?: string;
  setSearchTerm?: (value: string) => void;
  columns?: TableColumn[];
  filters?: ViewFilters;
  sorts?: SortConfig[];
  hiddenColumns?: string[];
  onFiltersChange?: (filters: ViewFilters) => void;
  onSortsChange?: (sorts: SortConfig[]) => void;
  onHiddenColumnsChange?: (hiddenColumns: string[]) => void;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({ 
  searchTerm = '', 
  setSearchTerm,
  columns = [],
  filters,
  sorts = [],
  hiddenColumns = [],
  onFiltersChange,
  onSortsChange,
  onHiddenColumnsChange
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchTerm);
  const [isSortDialogOpen, setIsSortDialogOpen] = useState(false);

  // Debounce search input to avoid too many re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm?.(searchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, setSearchTerm]);

  // Sync with external searchTerm changes
  useEffect(() => {
    setSearchValue(searchTerm);
  }, [searchTerm]);

  // Count active filters
  const activeFiltersCount = (filters?.conditions?.length || 0) + (filters?.groups?.length || 0);

  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-sm text-gray-700">
          <Grid3x3 className="h-4 w-4" />
          Grid view
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <ColumnVisibilityDropdown
          columns={columns}
          hiddenColumns={hiddenColumns}
          onHiddenColumnsChange={onHiddenColumnsChange || (() => { /* no-op */ })}
        />
        <FilterDropdown
          filters={filters}
          columns={columns}
          onFiltersChange={onFiltersChange}
        />
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-sm text-gray-700">
          <Group className="h-4 w-4" />
          Group
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 gap-1 text-sm text-gray-700"
          onClick={() => setIsSortDialogOpen(true)}
        >
          <ArrowUpDown className="h-4 w-4" />
          Sort
          {sorts.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              {sorts.length}
            </Badge>
          )}
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
        {isSearchOpen ? (
          <div className="flex items-center gap-1">
            <Input
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-8 w-48 text-sm"
              autoFocus
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => {
                setIsSearchOpen(false);
                setSearchValue('');
                setSearchTerm?.('');
              }}
            >
              <X className="h-4 w-4 text-gray-700" />
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-4 w-4 text-gray-700" />
          </Button>
        )}
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-sm text-gray-700">
          Tools
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Dialog Components */}
      <SortDialog
        isOpen={isSortDialogOpen}
        onClose={() => setIsSortDialogOpen(false)}
        sorts={sorts}
        columns={columns}
        onSortsChange={onSortsChange || (() => { /* no-op */ })}
      />
    </div>
  )
}
