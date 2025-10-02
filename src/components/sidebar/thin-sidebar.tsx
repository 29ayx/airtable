"use client"

import React from 'react'
import { useUser } from "@/hooks/use-session"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { HelpCircle, Bell } from "lucide-react"

export const ThinSidebar: React.FC = () => {
  const { name, image } = useUser();
  const router = useRouter();

  const handleLogoClick = () => {
    router.push('/dashboard');
  };

  return (
    <aside className="bg-white flex flex-col items-center px-3 py-4 max-h-screen border-r border-[#e8e8e8]">
      {/* Top Section - Airtable Icon */}
      <div className="flex-1 flex items-start">
        <button 
          onClick={handleLogoClick}
          className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <img src="/assets/airtable_icon_dark.svg" alt="Airtable Icon" className="w-7 h-7" />
        </button>
      </div>

      {/* Bottom Section - User Profile */}
      <div className="flex flex-col items-center space-y-5">
      <button className="flex h-4 w-4 items-center justify-center rounded hover:bg-gray-800">
          <HelpCircle className="h-5 w-5 text-gray-800" />
        </button>
        <button className="flex h-5 w-5 items-center justify-center rounded hover:bg-gray-100">
          <Bell className="h-4 w-4 text-gray-800" />
        </button>
        {image ? (
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-600">
            <Image
              src={image}
              alt={name ?? "User"}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">
              {name?.charAt(0)?.toUpperCase() ?? "U"}
            </span>
          </div>
        )}
      </div>

    </aside>
  )
}
