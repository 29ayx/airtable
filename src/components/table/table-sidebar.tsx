"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { ChevronDown, Plus, Search, Grid3x3, HelpCircle, Bell } from "lucide-react"

export const TableSidebar: React.FC = () => {
  return (
    <aside className="border-r border-gray-200 bg-white flex flex-col" style={{ width: '256px' }}>
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
      
    </aside>
  )
}
