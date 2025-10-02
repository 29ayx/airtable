"use client"

import EditableTable from "@/components/editable-table"
import { ThinSidebar } from "@/components/sidebar/thin-sidebar"
import { useUser } from "@/hooks/use-session"
import { api } from "@/trpc/react"
import { useParams } from "next/navigation"

export default function BasePage() {
  const { user, name, email, image, isLoading } = useUser();
  const params = useParams();
  const baseId = params.id as string;
  
  const { data: base, isLoading: baseLoading } = api.base.getById.useQuery({ id: baseId });

  if (isLoading || baseLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!base) {
    return <div className="flex items-center justify-center min-h-screen">Base not found</div>;
  }

  return (
    <div className="flex h-screen">
      <ThinSidebar />
      <div className="flex-1 flex flex-col">
        <EditableTable baseId={baseId} baseName={base.name} />
      </div>
    </div>
  )
}
