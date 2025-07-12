"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { type User, db, type Message } from "@/lib/database"
import { AuthService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  Hash,
  Send,
  Smile,
  Plus,
  Search,
  Crown,
  Shield,
  Star,
  Trash2,
  Calendar,
  Users,
  MessageSquare,
  LogOut,
} from "lucide-react"
import UserSettings from "./user-settings"
import AdminPanel from "./admin-panel"
import EventsPanel from "./events-panel"

interface ChatAppProps {
  user: User
  onLogout: () => void
}

export default function ChatApp({ user, onLogout }: ChatAppProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [activeChannel, setActiveChannel] = useState("general")
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showEvents, setShowEvents] = useState(false)
  const [selectedDMUser, setSelectedDMUser] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load messages for active channel
    const channelMessages = db.getMessages(activeChannel)
    setMessages(channelMessages)

    // Load online users
    const users = db.getAllUsers().filter((u) => u.status === "online")
    setOnlineUsers(users)

    // Simulate real-time updates
    const interval = setInterval(() => {
      const updatedMessages = db.getMessages(activeChannel)
      setMessages(updatedMessages)

      const updatedUsers = db.getAllUsers().filter((u) => u.status === "online")
      setOnlineUsers(updatedUsers)
    }, 1000)

    return () => clearInterval(interval)
  }, [activeChannel])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = () => {
    if (!newMessage.trim()) return

    db.createMessage({
      content: newMessage,
      authorId: user.id,
      channelId: activeChannel,
    })

    setNewMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startDM = (targetUserId: string) => {
    const dmChannelId = `dm-${[user.id, targetUserId].sort().join("-")}`

    // Create DM channel if it doesn't exist
    if (!db.getChannel(dmChannelId)) {
      db.createChannel({
        name: `DM with ${db.getUser(targetUserId)?.displayName}`,
        type: "dm",
        participants: [user.id, targetUserId],
      })
    }

    setActiveChannel(dmChannelId)
    setSelectedDMUser(targetUserId)
  }

  const getRankIcon = (rank: User["rank"]) => {
    switch (rank) {
      case "Owner":
        return <Crown className="h-4 w-4 text-yellow-500" />
      case "Admin":
        return <Shield className="h-4 w-4 text-red-500" />
      case "Moderator":
        return <Star className="h-4 w-4 text-blue-500" />
      case "Loser of the Week":
        return <Trash2 className="h-4 w-4 text-gray-500" />
      default:
        return null
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

  const handleLogout = () => {
    AuthService.logout()
    onLogout()
  }

  if (showSettings) {
    return <UserSettings user={user} onClose={() => setShowSettings(false)} />
  }

  if (showAdminPanel && user.isOwner) {
    return <AdminPanel user={user} onClose={() => setShowAdminPanel(false)} />
  }

  if (showEvents) {
    return <EventsPanel user={user} onClose={() => setShowEvents(false)} />
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Left Sidebar */}
      <div className="w-60 bg-secondary/50 flex flex-col">
        {/* Server Header */}
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Zoft
          </h2>
        </div>

        {/* Channels */}
        <div className="flex-1 p-2">
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Text Channels</h3>
            <Button
              variant={activeChannel === "general" ? "secondary" : "ghost"}
              className="w-full justify-start h-8 px-2"
              onClick={() => {
                setActiveChannel("general")
                setSelectedDMUser(null)
              }}
            >
              <Hash className="h-4 w-4 mr-2" />
              general
            </Button>
          </div>

          <div className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Direct Messages
            </h3>
            <div className="space-y-1">
              {onlineUsers
                .filter((u) => u.id !== user.id)
                .map((u) => (
                  <Button
                    key={u.id}
                    variant={selectedDMUser === u.id ? "secondary" : "ghost"}
                    className="w-full justify-start h-8 px-2"
                    onClick={() => startDM(u.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={u.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">{u.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                      </div>
                      <span className="text-sm truncate">{u.displayName}</span>
                    </div>
                  </Button>
                ))}
            </div>
          </div>
        </div>

        {/* User Panel */}
        <div className="p-2 border-t border-border">
          <div className="flex items-center space-x-2 p-2 rounded hover:bg-secondary/50">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar || "/placeholder.svg"} />
              <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <p className="text-sm font-medium truncate">{user.displayName}</p>
                {getRankIcon(user.rank)}
              </div>
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            </div>
            <div className="flex space-x-1">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-12 border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">
              {selectedDMUser ? `DM with ${db.getUser(selectedDMUser)?.displayName}` : "general"}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" onClick={() => setShowEvents(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </Button>
            {user.isOwner && (
              <Button size="sm" variant="ghost" onClick={() => setShowAdminPanel(true)}>
                <Crown className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}
            <Button size="sm" variant="ghost">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const author = db.getUser(message.authorId)
              if (!author) return null

              return (
                <div key={message.id} className="flex space-x-3 message-hover p-2 rounded">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={author.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{author.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-sm">{author.displayName}</span>
                      {getRankIcon(author.rank)}
                      <Badge variant="secondary" className={`text-xs ${getRankColor(author.rank)}`}>
                        {author.rank}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{message.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm break-words">{message.content}</p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" className="h-10 w-10 p-0">
              <Plus className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${selectedDMUser ? db.getUser(selectedDMUser)?.displayName : "#general"}`}
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Online Users */}
      <div className="w-60 bg-secondary/50 border-l border-border">
        <div className="p-4">
          <h3 className="font-semibold mb-4 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Online — {onlineUsers.length}
          </h3>
          <div className="space-y-2">
            {onlineUsers.map((u) => (
              <div key={u.id} className="flex items-center space-x-2 p-2 rounded hover:bg-secondary/50">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">{u.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <p className="text-sm font-medium truncate">{u.displayName}</p>
                    {getRankIcon(u.rank)}
                  </div>
                  <Badge variant="secondary" className={`text-xs ${getRankColor(u.rank)}`}>
                    {u.rank}
                  </Badge>
                </div>
                {u.id !== user.id && (
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => startDM(u.id)}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
