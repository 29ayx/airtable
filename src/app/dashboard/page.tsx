"use client"

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { StartCards } from "@/components/start-cards";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Command, Calendar, Clock } from "lucide-react";
import Image from "next/image";
import { useUser } from "@/hooks/use-session";
import { api } from "@/trpc/react";
import Link from "next/link";

import data from "./data.json";

export default function Page() {
  const { user, name, email, image, isLoading } = useUser();
  const { data: bases, isLoading: basesLoading } = api.base.getAll.useQuery();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <header className="fixed top-0 left-0 right-0 flex h-16 shrink-0 items-center gap-4 border-b px-4 bg-white z-50">
        <SidebarTrigger className="-ml-1" />
        
        <div className="flex items-center gap-2">
          <Image src="/assets/airtable-logo-full.svg" alt="logo" width={100} height={100} />
        </div>
        
        <div className="flex-1 flex justify-center">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Search..." 
              className="pl-10 pr-20 bg-gray-50 border-gray-200 focus:bg-white rounded-full"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-xs text-gray-400">
              <Command className="h-3 w-3" />
              <span>K</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Button 1</Button>
          <Button variant="outline" size="sm">Button 2</Button>
          <Button variant="outline" size="sm">Button 3</Button>
        </div>
      </header>
      
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex flex-1 flex-col bg-[#f9fafb] pt-16">
          <div className="@container/main flex flex-1 flex-col gap-2 p-8">
            <div className="flex flex-col gap-6 py-2 md:gap-6 md:py-4">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-semibold">Home</h1>
                  <div className="flex items-center gap-3">
                    {image && (
                      <Image 
                        src={image} 
                        alt={name || "User"} 
                        width={32} 
                        height={32} 
                        className="rounded-full"
                      />
                    )}
                    <div className="text-right">
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-gray-500">{email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* First Section - Start Cards */}
              <div className="px-4 lg:px-6">
                <StartCards />
              </div>

              {/* Second Section - User Bases */}
              <div className="px-4 lg:px-6">
                <h2 className="text-sm mb-4 text-gray-500">Your Bases</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {basesLoading ? (
                    <div>Loading bases...</div>
                  ) : bases && bases.length > 0 ? (
                    bases.map((base) => (
                      <Link key={base.id} href={`/base/${base.id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer max-h-[85px] max-w-[270px]">
                          <CardContent className="p-4 h-full">
                            <div className="flex items-center gap-4 h-full">
                              <Calendar className="h-8 w-8 text-blue-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base truncate">{base.name}</h3>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Created {new Date(base.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm">No bases created yet. Create your first base!</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
