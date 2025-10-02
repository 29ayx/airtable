"use client"

import React, { useState } from 'react'
import { Plus, ChevronDown, Edit2, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface TableTabsHeaderProps {
  tables: Array<{ id: string; name: string }>
  activeTable: string
  onTableChange: (tableId: string) => void
  onAddTable: () => void
  onRenameTable?: (tableId: string, newName: string) => void
  onDeleteTable?: (tableId: string) => void
}

export const TableTabsHeader: React.FC<TableTabsHeaderProps> = ({ 
  tables, 
  activeTable, 
  onTableChange, 
  onAddTable,
  onRenameTable,
  onDeleteTable
}) => {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renamingTableId, setRenamingTableId] = useState<string | null>(null);
  const [newTableName, setNewTableName] = useState("");

  const handleRenameClick = (tableId: string, currentName: string) => {
    setRenamingTableId(tableId);
    setNewTableName(currentName);
    setIsRenameDialogOpen(true);
  };

  const handleRenameSubmit = () => {
    if (renamingTableId && newTableName.trim() && onRenameTable) {
      onRenameTable(renamingTableId, newTableName.trim());
      setIsRenameDialogOpen(false);
      setRenamingTableId(null);
      setNewTableName("");
    }
  };

  const handleDeleteClick = (tableId: string) => {
    if (onDeleteTable && tables.length > 1) { // Prevent deleting the last table
      onDeleteTable(tableId);
    }
  };
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex items-center px-4">
        {/* Table Tabs */}
        <div className="flex items-center">
          {tables.map((table) => (
            <div key={table.id} className="relative group">
              <button
                onClick={() => onTableChange(table.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
                  activeTable === table.id
                    ? 'border-[#e91e63] text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {table.name}
                
                {/* Dropdown trigger - only show on hover */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-1 hover:bg-gray-100 rounded">
                      <ChevronDown className="h-3 w-3" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameClick(table.id, table.name);
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Rename table
                    </DropdownMenuItem>
                    {tables.length > 1 && (
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(table.id);
                        }}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete table
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </button>
            </div>
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

      {/* Rename Table Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tableName" className="pb-4">Table Name</Label>
              <Input
                id="tableName"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="Enter table name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameSubmit();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsRenameDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRenameSubmit}
                disabled={!newTableName.trim()}
              >
                Rename
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
