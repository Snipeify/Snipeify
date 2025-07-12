"use client"

import { useState } from "react"
import { type User, db } from "@/lib/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/components/theme-provider"
import { ArrowLeft, Save, UserIcon, Palette, Bell, Shield } from "lucide-react"

interface UserSettingsProps {
  user: User
  onClose: () => void
}

export default function UserSettings({ user, onClose }: UserSettingsProps) {
  const [displayName, setDisplayName] = useState(user.displayName)
  const [username, setUsername] = useState(user.username)
  const [status, setStatus] = useState(user.status)
  const { theme, setTheme } = useTheme()

  const handleSave = () => {
    db.updateUser(user.id, {
      displayName,
      username,
      status,
    })
    onClose()
  }

  const getRankColor = (rank: User["rank"]) => {
    switch (rank) {
      case "Owner":
        return "bg-yellow-500"
      case "Admin":
        return "bg-red-500"
      case "Moderator":
        return "bg-blue-500"
      case "Loser of the Week":
        return "bg-gray-500"
      default:
        return "bg-green-500"
    }
  }

  return (
    <div className="h-screen bg-background flex">
      <div className="w-60 bg-secondary/50 p-4">
        <Button variant="ghost" className="w-full justify-start mb-4" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Chat
        </Button>

        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <UserIcon className="h-4 w-4 mr-2" />
            My Account
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Shield className="h-4 w-4 mr-2" />
            Privacy
          </Button>
        </div>
      </div>

      <div className="flex-1 p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold mb-6">User Settings</h1>

          <Tabs defaultValue="account" className="space-y-6">
            <TabsList>
              <TabsTrigger value="account">My Account</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your profile information and settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-2xl">{user.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Button variant="outline">Change Avatar</Button>
                      <p className="text-sm text-muted-foreground mt-2">JPG, PNG or GIF. Max size 8MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">🟢 Online</SelectItem>
                        <SelectItem value="away">🟡 Away</SelectItem>
                        <SelectItem value="busy">🔴 Busy</SelectItem>
                        <SelectItem value="offline">⚫ Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Current Rank</Label>
                    <Badge className={`${getRankColor(user.rank)} text-white`}>{user.rank}</Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>Member Since</Label>
                    <p className="text-sm text-muted-foreground">{user.joinedAt.toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Theme</CardTitle>
                  <CardDescription>Customize the appearance of Zoft</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">☀️ Light</SelectItem>
                        <SelectItem value="dark">🌙 Dark</SelectItem>
                        <SelectItem value="opal">✨ Black Opal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer ${theme === "light" ? "border-primary" : "border-border"}`}
                      onClick={() => setTheme("light")}
                    >
                      <div className="bg-white p-2 rounded mb-2">
                        <div className="h-2 bg-gray-200 rounded mb-1"></div>
                        <div className="h-2 bg-gray-100 rounded"></div>
                      </div>
                      <p className="text-sm text-center">Light</p>
                    </div>

                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer ${theme === "dark" ? "border-primary" : "border-border"}`}
                      onClick={() => setTheme("dark")}
                    >
                      <div className="bg-gray-800 p-2 rounded mb-2">
                        <div className="h-2 bg-gray-600 rounded mb-1"></div>
                        <div className="h-2 bg-gray-700 rounded"></div>
                      </div>
                      <p className="text-sm text-center">Dark</p>
                    </div>

                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer ${theme === "opal" ? "border-primary" : "border-border"}`}
                      onClick={() => setTheme("opal")}
                    >
                      <div className="opal-gradient p-2 rounded mb-2">
                        <div className="h-2 bg-purple-400 rounded mb-1"></div>
                        <div className="h-2 bg-cyan-400 rounded"></div>
                      </div>
                      <p className="text-sm text-center">Black Opal</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Direct Messages</p>
                      <p className="text-sm text-muted-foreground">Get notified for new DMs</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mentions</p>
                      <p className="text-sm text-muted-foreground">Get notified when mentioned</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Events</p>
                      <p className="text-sm text-muted-foreground">Get notified about events</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
