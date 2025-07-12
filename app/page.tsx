"use client"

import { useEffect, useState } from "react"
import { AuthService } from "@/lib/auth"
import type { User } from "@/lib/database"
import LoginPage from "./login/page"
import ChatApp from "@/components/chat-app"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center opal-gradient">
        <div className="text-white text-xl">Loading Zoft...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />
  }

  return <ChatApp user={user} onLogout={() => setUser(null)} />
}
