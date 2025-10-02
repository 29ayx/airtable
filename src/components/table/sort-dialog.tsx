"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown, ArrowUp, ArrowDown, Plus, Trash2, X, GripVertical } from "lucide-react"
import type { SortConfig } from "@/types/view"
import type { TableColumn } from "@/types/table"

interface SortDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sorts: SortConfig[];
  columns: TableColumn[];
  onSortsChange: (sorts: SortConfig[]) => void;
}

interface SortItemProps {
  sort: SortConfig;
  columns: TableColumn[];
  onUpdate: (updates: Partial<SortConfig>) => void;
  onDelete: () => void;
  showDelete: boolean;
  index: number;
}

const SortItem: React.FC<SortItemProps> = ({
  sort,
  columns,
  onUpdate,
  onDelete,
  showDelete,
  index
}) => {
  const selectedColumn = columns.find(c => c.id === sort.columnId);

  return (
    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <GripVertical className="h-4 w-4 text-gray-400" />
        <span className="min-w-[60px]">Sort by</span>
      </div>

      {/* Column Selection */}
      <Select
        value={sort.columnId}
        onValueChange={(value) => onUpdate({ columnId: value })}
      >
        <SelectTrigger className="w-[160px] bg-white">
          <SelectValue placeholder="Find a field" />
        </SelectTrigger>
        <SelectContent>
          <div className="p-2">
            <div className="text-xs text-gray-500 mb-2">Find a field</div>
            {columns.map((column) => (
              <SelectItem key={column.id} value={column.id}>
                <div className="flex items-center gap-2">
                  <span>{column.name}</span>
                  <span className="text-xs text-gray-400 capitalize">{column.type}</span>
                </div>
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>

      {/* Direction Selection */}
      <Select
        value={sort.direction}
        onValueChange={(value: 'asc' | 'desc') => onUpdate({ direction: value })}
      >
        <SelectTrigger className="w-[120px] bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">
            <div className="flex items-center gap-2">
              <ArrowUp className="h-4 w-4" />
              <span>A → Z</span>
            </div>
          </SelectItem>
          <SelectItem value="desc">
            <div className="flex items-center gap-2">
              <ArrowDown className="h-4 w-4" />
              <span>Z → A</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Delete Button */}
      {showDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 text-gray-400 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export const SortDialog: React.FC<SortDialogProps> = ({
  isOpen,
  onClose,
  sorts,
  columns,
  onSortsChange
}) => {
  const [localSorts, setLocalSorts] = useState<SortConfig[]>(sorts);

  // Sync with external sorts when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalSorts(sorts);
    }
  }, [isOpen, sorts]);

  const addSort = () => {
    // Find a column that's not already being sorted
    const usedColumnIds = localSorts.map(s => s.columnId);
    const availableColumn = columns.find(col => !usedColumnIds.includes(col.id));
    
    if (availableColumn) {
      const newSort: SortConfig = {
        columnId: availableColumn.id,
        direction: 'asc'
      };
      setLocalSorts(prev => [...prev, newSort]);
    }
  };

  const removeSort = (index: number) => {
    setLocalSorts(prev => prev.filter((_, i) => i !== index));
  };

  const updateSort = (index: number, updates: Partial<SortConfig>) => {
    setLocalSorts(prev => prev.map((sort, i) => 
      i === index ? { ...sort, ...updates } : sort
    ));
  };

  const applySorts = () => {
    onSortsChange(localSorts);
    onClose();
  };

  const clearAllSorts = () => {
    setLocalSorts([]);
    onSortsChange([]);
    onClose();
  };

  const canAddMore = localSorts.length < columns.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Sort
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {localSorts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No sort applied</p>
              <Button
                variant="outline"
                onClick={addSort}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                disabled={!canAddMore}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add sort
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {localSorts.map((sort, index) => (
                  <SortItem
                    key={`${sort.columnId}-${index}`}
                    sort={sort}
                    columns={columns}
                    onUpdate={(updates) => updateSort(index, updates)}
                    onDelete={() => removeSort(index)}
                    showDelete={localSorts.length > 1}
                    index={index}
                  />
                ))}
              </div>

              {canAddMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addSort}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add sort
                </Button>
              )}

              {localSorts.length > 1 && (
                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                  <strong>Note:</strong> Records will be sorted by the first sort, then by the second sort, and so on.
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={clearAllSorts}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={localSorts.length === 0}
          >
            Clear all sorts
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={applySorts}>
              Apply sorts
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
