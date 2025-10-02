"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  ChevronDown, 
  Grid3x3, 
  EyeOff, 
  Filter, 
  Group, 
  ArrowUpDown, 
  Palette, 
  MoreVertical, 
  Share2, 
  Search,
  X
} from "lucide-react"

interface TableToolbarProps {
  searchTerm?: string;
  setSearchTerm?: (value: string) => void;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({ 
  searchTerm = '', 
  setSearchTerm 
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchTerm);

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
    </div>
  )
}
