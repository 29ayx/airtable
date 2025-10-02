"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Filter, Plus, X } from "lucide-react"
import type { FilterCondition, ViewFilters, FilterOperator } from "@/types/view"
import type { TableColumn } from "@/types/table"
import { FILTER_OPERATORS } from "@/types/view"

interface FilterDropdownProps {
  filters?: ViewFilters;
  columns: TableColumn[];
  onFiltersChange?: (filters: ViewFilters) => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  filters,
  columns,
  onFiltersChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const activeFiltersCount = (filters?.conditions?.length || 0) + (filters?.groups?.length || 0);
  const hasActiveFilters = activeFiltersCount > 0;

  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: crypto.randomUUID(),
      columnId: columns[0]?.id || '',
      operator: 'contains',
      value: ''
    };
    
    const newFilters: ViewFilters = {
      type: 'and',
      conditions: [...(filters?.conditions || []), newCondition],
      groups: filters?.groups || []
    };
    
    onFiltersChange?.(newFilters);
  };

  const removeCondition = (conditionId: string) => {
    if (!filters) return;
    
    const newFilters: ViewFilters = {
      ...filters,
      conditions: filters.conditions.filter(c => c.id !== conditionId)
    };
    
    onFiltersChange?.(newFilters);
  };

  const updateCondition = (conditionId: string, updates: Partial<FilterCondition>) => {
    if (!filters) return;
    
    const newFilters: ViewFilters = {
      ...filters,
      conditions: filters.conditions.map(c => 
        c.id === conditionId ? { ...c, ...updates } : c
      )
    };
    
    onFiltersChange?.(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange?.({ type: 'and', conditions: [], groups: [] });
  };

  const getOperatorsForColumn = (columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    const columnType = column?.type || 'text';
    
    return Object.entries(FILTER_OPERATORS).filter(([_, config]) => 
      config.supportedTypes.includes(columnType)
    );
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-sm text-gray-700">
          <Filter className="h-4 w-4" />
          Filter
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[500px] p-4" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-black">Filter</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
              >
                Clear all
              </Button>
            )}
          </div>

          {!hasActiveFilters ? (
            <div className="text-center py-4">
              <p className="text-sm text-black mb-3">No filters applied</p>
              <Button
                variant="outline"
                size="sm"
                onClick={addCondition}
                className="text-black border hover:bg-blue-50 rounded-none"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add filter
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {filters?.conditions.map((condition) => {
                  const availableOperators = getOperatorsForColumn(condition.columnId);
                  const selectedOperator = FILTER_OPERATORS[condition.operator];
                  const requiresValue = selectedOperator?.requiresValue ?? true;

                  return (
                    <div key={condition.id} className="flex items-center gap-2 p-2 border bg-white">
                      <Select
                        value={condition.columnId}
                        onValueChange={(value) => {
                          updateCondition(condition.id, { columnId: value });
                          const newOperators = getOperatorsForColumn(value);
                          if (newOperators.length > 0 && !newOperators.find(([op]) => op === condition.operator)) {
                            updateCondition(condition.id, { columnId: value, operator: newOperators[0][0] as FilterOperator });
                          }
                        }}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs bg-white border text-black rounded-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((column) => (
                            <SelectItem key={column.id} value={column.id}>
                              {column.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={condition.operator}
                        onValueChange={(value) => updateCondition(condition.id, { operator: value as FilterOperator })}
                      >
                        <SelectTrigger className="w-40 h-8 text-xs bg-white border text-black rounded-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOperators.map(([operator, config]) => (
                            <SelectItem key={operator} value={operator}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {requiresValue && (
                        <Input
                          placeholder="Value"
                          value={condition.value}
                          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                          className="w-32 h-8 text-xs bg-white border text-black rounded-none"
                        />
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCondition(condition.id)}
                        className="h-8 w-8 text-black hover:text-red-500 rounded-none"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={addCondition}
                className="w-full h-8 text-xs text-black hover:text-blue-700 hover:bg-blue-50 rounded-none border"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add filter
              </Button>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
