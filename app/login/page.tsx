"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthService } from "@/lib/auth"
import type { User } from "@/lib/database"
import { MessageSquare, Users, Shield, Zap } from "lucide-react"

interface LoginPageProps {
  onLogin: (user: User) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const user = await AuthService.login(email, password)
      if (user) {
        onLogin(user)
      }
    } catch (err) {
      setError("Invalid credentials")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const username = formData.get("username") as string
    const displayName = formData.get("displayName") as string
    const password = formData.get("password") as string

    try {
      const user = await AuthService.register(email, username, password, displayName)
      if (user) {
        onLogin(user)
      }
    } catch (err) {
      setError("Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen opal-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-white space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Zoft
            </h1>
            <p className="text-xl text-gray-300">Connect with your friends in a whole new way</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <MessageSquare className="h-8 w-8 text-purple-400" />
              <h3 className="font-semibold">Real-time Chat</h3>
              <p className="text-sm text-gray-400">Instant messaging with your friends</p>
            </div>
            <div className="space-y-2">
              <Users className="h-8 w-8 text-cyan-400" />
              <h3 className="font-semibold">Friend System</h3>
              <p className="text-sm text-gray-400">Connect and chat with friends</p>
            </div>
            <div className="space-y-2">
              <Shield className="h-8 w-8 text-green-400" />
              <h3 className="font-semibold">Rank System</h3>
              <p className="text-sm text-gray-400">Earn ranks and special privileges</p>
            </div>
            <div className="space-y-2">
              <Zap className="h-8 w-8 text-yellow-400" />
              <h3 className="font-semibold">Events & More</h3>
              <p className="text-sm text-gray-400">Participate in community events</p>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <Card className="w-full max-w-md mx-auto bg-black/20 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Welcome to Zoft</CardTitle>
            <CardDescription className="text-gray-300">Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger value="login" className="text-white data-[state=active]:bg-purple-600">
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="text-white data-[state=active]:bg-purple-600">
                  Register
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      name="email"
                      type="email"
                      placeholder="Email"
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
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <Button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700">
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      name="email"
                      type="email"
                      placeholder="Email"
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
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <Button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700">
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
