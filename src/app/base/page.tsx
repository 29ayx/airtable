"use client"

import EditableTable from "@/components/editable-table"
import { useUser } from "@/hooks/use-session"

export default function AirtableClone() {
  const { user, name, email, image, isLoading } = useUser();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return <EditableTable />
}
