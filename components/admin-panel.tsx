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
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Crown, Users, Calendar, Trash2, Plus, Save } from "lucide-react"

interface AdminPanelProps {
  user: User
  onClose: () => void
}

export default function AdminPanel({ user, onClose }: AdminPanelProps) {
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [newRank, setNewRank] = useState<User["rank"]>("Member")
  const [eventTitle, setEventTitle] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [eventDate, setEventDate] = useState("")

  const allUsers = db.getAllUsers()
  const allEvents = db.getAllEvents()

  const handleRankChange = () => {
    if (selectedUser && newRank) {
      db.setUserRank(selectedUser, newRank)
      setSelectedUser("")
      setNewRank("Member")
    }
  }

  const createEvent = () => {
    if (eventTitle && eventDescription && eventDate) {
      db.createEvent({
        title: eventTitle,
        description: eventDescription,
        createdBy: user.id,
        startDate: new Date(eventDate),
        endDate: new Date(eventDate),
        participants: [],
      })
      setEventTitle("")
      setEventDescription("")
      setEventDate("")
    }
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
            <Crown className="h-4 w-4 mr-2" />
            Owner Panel
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Users className="h-4 w-4 mr-2" />
            User Management
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Calendar className="h-4 w-4 mr-2" />
            Events
          </Button>
        </div>
      </div>

      <div className="flex-1 p-8">
        <div className="max-w-4xl">
          <div className="flex items-center space-x-2 mb-6">
            <Crown className="h-6 w-6 text-yellow-500" />
            <h1 className="text-2xl font-bold">Owner Panel</h1>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="moderation">Moderation</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change User Ranks</CardTitle>
                  <CardDescription>Assign ranks to users including "Loser of the Week"</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Select User</Label>
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {allUsers
                            .filter((u) => u.id !== user.id)
                            .map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.displayName} (@{u.username})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>New Rank</Label>
                      <Select value={newRank} onValueChange={(value: any) => setNewRank(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Moderator">Moderator</SelectItem>
                          <SelectItem value="Member">Member</SelectItem>
                          <SelectItem value="Loser of the Week">Loser of the Week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleRankChange} disabled={!selectedUser}>
                    <Save className="h-4 w-4 mr-2" />
                    Update Rank
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>Overview of all registered users and their ranks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={u.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{u.displayName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{u.displayName}</p>
                            <p className="text-sm text-muted-foreground">@{u.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getRankColor(u.rank)} text-white`}>{u.rank}</Badge>
                          <div
                            className={`h-3 w-3 rounded-full ${
                              u.status === "online"
                                ? "bg-green-500"
                                : u.status === "away"
                                  ? "bg-yellow-500"
                                  : u.status === "busy"
                                    ? "bg-red-500"
                                    : "bg-gray-500"
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Event</CardTitle>
                  <CardDescription>Create events for the community</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventTitle">Event Title</Label>
                    <Input
                      id="eventTitle"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Enter event title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventDescription">Description</Label>
                    <Textarea
                      id="eventDescription"
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      placeholder="Describe the event"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Event Date</Label>
                    <Input
                      id="eventDate"
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                  </div>

                  <Button onClick={createEvent} disabled={!eventTitle || !eventDescription || !eventDate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Events</CardTitle>
                  <CardDescription>Manage community events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allEvents.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No events created yet</p>
                    ) : (
                      allEvents.map((event) => (
                        <div key={event.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="font-semibold">{event.title}</h4>
                              <p className="text-sm text-muted-foreground">{event.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {event.startDate.toLocaleDateString()} at {event.startDate.toLocaleTimeString()}
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="moderation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Moderation Tools</CardTitle>
                  <CardDescription>Advanced moderation and server management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-20 flex-col bg-transparent">
                      <Users className="h-6 w-6 mb-2" />
                      Kick User
                    </Button>
                    <Button variant="outline" className="h-20 flex-col bg-transparent">
                      <Trash2 className="h-6 w-6 mb-2" />
                      Ban User
                    </Button>
                    <Button variant="outline" className="h-20 flex-col bg-transparent">
                      <Calendar className="h-6 w-6 mb-2" />
                      Clear Messages
                    </Button>
                    <Button variant="outline" className="h-20 flex-col bg-transparent">
                      <Crown className="h-6 w-6 mb-2" />
                      Server Settings
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">IP Whitelist Status</h4>
                    <p className="text-sm text-muted-foreground mb-2">Your IP is whitelisted for owner privileges</p>
                    <Badge className="bg-green-500 text-white">Owner Access Granted</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
