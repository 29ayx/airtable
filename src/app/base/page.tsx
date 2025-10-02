"use client"

import { useUser } from "@/hooks/use-session"
import { api } from "@/trpc/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AirtableClone() {
  const { isLoading } = useUser();
  const { data: bases, isLoading: basesLoading } = api.base.getAll.useQuery();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !basesLoading && bases && bases.length > 0 && bases[0]) {
      // Redirect to the first available base
      router.push(`/base/${bases[0].id}`);
    }
  }, [isLoading, basesLoading, bases, router]);

  if (isLoading || basesLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!bases || bases.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No bases found</h2>
          <p className="text-gray-600">Create a base from the dashboard to get started.</p>
        </div>
      </div>
    );
  }

  return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
}
