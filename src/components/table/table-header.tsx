"use client"


import React from 'react'
import { Button } from "@/components/ui/button"
import { ChevronDown, Grid3x3 } from "lucide-react"
import { RiSidebarUnfoldLine } from "react-icons/ri";
interface TableHeaderProps {
  baseName: string
}

export const TableHeader: React.FC<TableHeaderProps> = ({ baseName }) => {

  return (
    <header className="flex h-12 items-center justify-between border-b border-gray-200 px-4">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#e91e63]">
         <img src="/assets/airtable_icon_white.svg" alt="Airtable Icon" className="w-6 h-6" />
        </div>

        {/* Base Name */}
        <button className="flex items-center gap-1 text-sm font-semibold text-gray-900 hover:bg-gray-100 rounded px-2 py-1">
          {baseName}
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
        <Button variant="outline" size="sm" className="h-8 gap-1 text-sm bg-transparent">
        <RiSidebarUnfoldLine />

          Launch
        </Button>
        <Button size="sm" className="h-8 bg-[#e91e63] hover:bg-[#d81b60] text-white text-sm">
          Share
        </Button>
      </div>
    </header>
  )
}
