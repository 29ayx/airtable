"use client"

import { AppSidebar } from "@/components/app-sidebar";
import { StartCards } from "@/components/start-cards";
import { CreateDialog } from "@/components/create-dialog";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Command, Calendar, Clock, MoreVertical, Trash2, Edit2, Plus, LogOut } from "lucide-react";
import Image from "next/image";
import { useUser } from "@/hooks/use-session";
import { api } from "@/trpc/react";
import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";

export default function Page() {
  const { name, email, image, isLoading } = useUser();
  const { data: bases, isLoading: basesLoading, refetch } = api.base.getAll.useQuery();
  const [deletingBaseId, setDeletingBaseId] = useState<string | null>(null);
  const [renamingBaseId, setRenamingBaseId] = useState<string | null>(null);
  const [newBaseName, setNewBaseName] = useState("");
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);

  const deleteBaseMutation = api.base.delete.useMutation({
    onSuccess: () => {
      void refetch();
      setDeletingBaseId(null);
    },
    onError: (error) => {
      console.error("Failed to delete base:", error);
      setDeletingBaseId(null);
    },
  });

  const renameBaseMutation = api.base.rename.useMutation({
    onSuccess: () => {
      void refetch();
      setRenamingBaseId(null);
      setIsRenameDialogOpen(false);
      setNewBaseName("");
    },
    onError: (error) => {
      console.error("Failed to rename base:", error);
      setRenamingBaseId(null);
      setIsRenameDialogOpen(false);
      setNewBaseName("");
    },
  });


  const handleDeleteBase = (baseId: string) => {
    setDeletingBaseId(baseId);
    deleteBaseMutation.mutate({ id: baseId });
  };

  const handleRenameBase = (baseId: string, currentName: string) => {
    setRenamingBaseId(baseId);
    setNewBaseName(currentName);
    setIsRenameDialogOpen(true);
  };

  const submitRename = () => {
    if (renamingBaseId && newBaseName.trim()) {
      renameBaseMutation.mutate({ 
        id: renamingBaseId, 
        name: newBaseName.trim() 
      });
    }
  };


  const handleLogout = () => {
    void signOut({ callbackUrl: "/" });
  };

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
        
        <div className="flex items-center gap-3">
          {image && (
            <Image 
              src={image} 
              alt={name ?? "User"} 
              width={32} 
              height={32} 
              className="rounded-full"
            />
          )}
          <div className="text-right">
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-gray-500">{email}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                  
                </div>
              </div>
              {/* First Section - Start Cards */}
              <div className="px-4 lg:px-6">
                <StartCards />
              </div>

              {/* Second Section - User Bases */}
              <div className="px-4 lg:px-6">
                <h2 className="text-sm mb-4 text-gray-500">Your Bases</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Create New Base Card - Always visible */}
                  <CreateDialog>
                    <Card className="hover:shadow-md transition-shadow h-20 w-full cursor-pointer border-dashed border-2 border-gray-300 hover:border-blue-400">
                      <CardContent className="h-full">
                        <div className="flex items-center justify-center gap-3 h-full">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Plus className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-gray-600">Create New Base</h3>
                            <p className="text-xs text-gray-500 mt-1">Start building your app</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CreateDialog>

                  {basesLoading ? (
                    <div>Loading bases...</div>
                  ) : bases && bases.length > 0 ? (
                    bases.map((base, index) => {
                      // Generate initial letter and color
                      const initial = base.name.charAt(0).toUpperCase();
                      const colors = [
                        'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500', 
                        'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 'bg-teal-500'
                      ];
                      const bgColor = colors[index % colors.length];
                      
                      return (
                        <Card key={base.id} className="hover:shadow-md transition-shadow h-20 w-full relative group">
                          <Link href={`/base/${base.id}`}>
                            <CardContent className="h-full">
                              <div className="flex items-center gap-3 h-full">
                                <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                  <span className="text-white font-semibold text-sm">{initial}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-sm truncate">{base.name}</h3>
                                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                    <Clock className="h-3 w-3" />
                                    <span>Created {new Date(base.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Link>
                          
                          {/* Dropdown Menu */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 hover:bg-gray-100"
                                  onClick={(e) => e.preventDefault()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleRenameBase(base.id, base.name);
                                  }}
                                  disabled={renamingBaseId === base.id}
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600 focus:text-red-600"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteBase(base.id);
                                  }}
                                  disabled={deletingBaseId === base.id}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {deletingBaseId === base.id ? "Deleting..." : "Delete"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </Card>
                      );
                    })
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle >Rename Base</DialogTitle>
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

    </SidebarProvider>
  );
}
