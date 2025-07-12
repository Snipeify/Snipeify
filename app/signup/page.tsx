"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthService } from "@/lib/auth"
import { ArrowLeft, UserPlus } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const username = formData.get("username") as string
    const displayName = formData.get("displayName") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      await AuthService.register(email, username, password, displayName)
      router.push("/")
    } catch (err) {
      setError("Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen opal-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <UserPlus className="h-6 w-6 text-purple-400" />
            <CardTitle className="text-white text-2xl">Join Zoft</CardTitle>
          </div>
          <CardDescription className="text-gray-300">
            Create your account to start chatting with friends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Input
                name="email"
                type="email"
                placeholder="Email address"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Input
                name="username"
                type="text"
                placeholder="Username"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Input
                name="displayName"
                type="text"
                placeholder="Display Name"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Input
                name="password"
                type="password"
                placeholder="Password"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Input
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700">
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-purple-400 hover:text-purple-300 text-sm flex items-center justify-center space-x-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Login</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
