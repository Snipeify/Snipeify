"use client"

// Simple in-memory database for demo (replace with real database in production)
export interface User {
  id: string
  username: string
  displayName: string
  email: string
  avatar: string
  rank: "Owner" | "Admin" | "Moderator" | "Member" | "Loser of the Week"
  status: "online" | "away" | "busy" | "offline"
  joinedAt: Date
  lastSeen: Date
  theme: "dark" | "light" | "opal"
  isOwner: boolean
  ipAddress?: string
}

export interface Message {
  id: string
  content: string
  authorId: string
  channelId: string
  timestamp: Date
  edited?: Date
  attachments?: string[]
}

export interface Channel {
  id: string
  name: string
  type: "text" | "dm"
  participants?: string[]
}

export interface Event {
  id: string
  title: string
  description: string
  createdBy: string
  startDate: Date
  endDate: Date
  participants: string[]
}

class Database {
  private users: Map<string, User> = new Map()
  private messages: Map<string, Message> = new Map()
  private channels: Map<string, Channel> = new Map()
  private events: Map<string, Event> = new Map()
  private currentUser: User | null = null

  constructor() {
    // Initialize default channel
    this.channels.set("general", {
      id: "general",
      name: "general",
      type: "text",
    })
  }

  // User management
  createUser(userData: Omit<User, "id" | "joinedAt" | "lastSeen">): User {
    const id = Math.random().toString(36).substr(2, 9)
    const user: User = {
      ...userData,
      id,
      joinedAt: new Date(),
      lastSeen: new Date(),
    }
    this.users.set(id, user)
    return user
  }

  getUser(id: string): User | undefined {
    return this.users.get(id)
  }

  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find((user) => user.email === email)
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id)
    if (user) {
      const updatedUser = { ...user, ...updates }
      this.users.set(id, updatedUser)
      return updatedUser
    }
    return undefined
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values())
  }

  // Authentication
  setCurrentUser(user: User) {
    this.currentUser = user
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  // Messages
  createMessage(messageData: Omit<Message, "id" | "timestamp">): Message {
    const id = Math.random().toString(36).substr(2, 9)
    const message: Message = {
      ...messageData,
      id,
      timestamp: new Date(),
    }
    this.messages.set(id, message)
    return message
  }

  getMessages(channelId: string): Message[] {
    return Array.from(this.messages.values())
      .filter((msg) => msg.channelId === channelId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  // Channels
  createChannel(channelData: Omit<Channel, "id">): Channel {
    const id = Math.random().toString(36).substr(2, 9)
    const channel: Channel = { ...channelData, id }
    this.channels.set(id, channel)
    return channel
  }

  getChannel(id: string): Channel | undefined {
    return this.channels.get(id)
  }

  getAllChannels(): Channel[] {
    return Array.from(this.channels.values())
  }

  // Events
  createEvent(eventData: Omit<Event, "id">): Event {
    const id = Math.random().toString(36).substr(2, 9)
    const event: Event = { ...eventData, id }
    this.events.set(id, event)
    return event
  }

  getAllEvents(): Event[] {
    return Array.from(this.events.values())
  }

  // Owner commands
  setUserRank(userId: string, rank: User["rank"]): boolean {
    const user = this.users.get(userId)
    if (user) {
      user.rank = rank
      this.users.set(userId, user)
      return true
    }
    return false
  }

  // IP whitelist check
  isIPWhitelisted(ip: string): boolean {
    // Add your IP here for owner privileges
    const whitelistedIPs = ["127.0.0.1", "localhost"]
    return whitelistedIPs.includes(ip)
  }
}

export const db = new Database()
