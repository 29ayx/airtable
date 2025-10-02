"use client"

import { useSession } from "next-auth/react"

export function useUser() {
  const { data: session, status } = useSession()
  
  return {
    user: session?.user,
    name: session?.user?.name,
    email: session?.user?.email,
    image: session?.user?.image,
    isLoading: status === "loading",
    isAuthenticated: !!session?.user,
  }
}
