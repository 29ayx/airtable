"use client"


import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Grid3x3, Edit2 } from "lucide-react"
import { RiSidebarUnfoldLine } from "react-icons/ri"
import { api } from "@/trpc/react"
interface TableHeaderProps {
  baseName: string
  baseId: string
}

export const TableHeader: React.FC<TableHeaderProps> = ({ baseName, baseId }) => {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newBaseName, setNewBaseName] = useState("");

  const utils = api.useUtils();
  
  const renameBaseMutation = api.base.rename.useMutation({
    onSuccess: () => {
      void utils.base.getById.invalidate({ id: baseId });
      setIsRenameDialogOpen(false);
      setNewBaseName("");
    },
    onError: (error) => {
      console.error("Failed to rename base:", error);
      setIsRenameDialogOpen(false);
      setNewBaseName("");
    },
  });

  const handleRenameBase = () => {
    setNewBaseName(baseName);
    setIsRenameDialogOpen(true);
  };

  const submitRename = () => {
    if (newBaseName.trim()) {
      renameBaseMutation.mutate({ 
        id: baseId, 
        name: newBaseName.trim() 
      });
    }
  };

  return (
    <header className="flex h-12 items-center justify-between border-b border-gray-200 px-4">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#e91e63]">
         <img src="/assets/airtable_icon_white.svg" alt="Airtable Icon" className="w-6 h-6" />
        </div>

        {/* Base Name */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 text-sm font-semibold text-gray-900 hover:bg-gray-100 rounded px-2 py-1">
              {baseName}
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={handleRenameBase}>
              <Edit2 className="h-4 w-4 mr-2" />
              Rename base
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
        <Button variant="outline" size="sm" className="h-8 gap-1 text-sm bg-transparent">
        <RiSidebarUnfoldLine />

          Launch
        </Button>
        <Button size="sm" className="h-8 bg-[#e91e63] hover:bg-[#d81b60] text-white text-sm">
          Share
        </Button>
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Base</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="baseName" className="pb-4">Base Name</Label>
              <Input
                id="baseName"
                value={newBaseName}
                onChange={(e) => setNewBaseName(e.target.value)}
                placeholder="Enter base name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    submitRename();
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
                onClick={submitRename}
                disabled={!newBaseName.trim() || renameBaseMutation.isPending}
              >
                {renameBaseMutation.isPending ? "Renaming..." : "Rename"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
