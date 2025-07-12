"use client"

import { db, type User } from "./database"

export class AuthService {
  static async register(email: string, username: string, password: string, displayName: string): Promise<User | null> {
    // Check if user already exists
    if (db.getUserByEmail(email)) {
      throw new Error("User already exists")
    }

    // Get user's IP (in real app, this would be done server-side)
    const isOwner = db.isIPWhitelisted("127.0.0.1") // Simulate IP check

    const user = db.createUser({
      username,
      displayName,
      email,
      avatar: `/placeholder.svg?height=40&width=40`,
      rank: isOwner ? "Owner" : "Member",
      status: "online",
      theme: "opal",
      isOwner,
    })

    db.setCurrentUser(user)
    return user
  }

  static async login(email: string, password: string): Promise<User | null> {
    const user = db.getUserByEmail(email)
    if (user) {
      user.status = "online"
      user.lastSeen = new Date()
      db.updateUser(user.id, user)
      db.setCurrentUser(user)
      return user
    }
    throw new Error("Invalid credentials")
  }

  static logout() {
    const currentUser = db.getCurrentUser()
    if (currentUser) {
      currentUser.status = "offline"
      db.updateUser(currentUser.id, currentUser)
    }
    db.setCurrentUser(null)
  }

  static getCurrentUser(): User | null {
    return db.getCurrentUser()
  }
}
