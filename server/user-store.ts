import { put } from "@vercel/blob";
import { generateUserId, hashPassword, verifyPassword } from "./auth";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  sustainabilityScore: number;
  totalDecisions: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  sustainabilityScore?: number;
  totalDecisions?: number;
}

/**
 * In-memory user store (development)
 * Falls back to Vercel Blob in production
 */
export class UserStore {
  private users: Map<string, User> = new Map();
  private emailIndex: Map<string, string> = new Map(); // email -> userId

  async createUser(
    email: string,
    password: string,
    name: string,
  ): Promise<User> {
    // Check if user already exists
    if (this.emailIndex.has(email.toLowerCase())) {
      throw new Error("Email already registered");
    }

    const userId = generateUserId();
    const user: User = {
      id: userId,
      email: email.toLowerCase(),
      name,
      passwordHash: hashPassword(password),
      sustainabilityScore: 0,
      totalDecisions: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store in memory
    this.users.set(userId, user);
    this.emailIndex.set(email.toLowerCase(), userId);

    // Try to backup to Vercel Blob
    try {
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const blobPath = `users/${userId}.json`;
        await put(blobPath, JSON.stringify(user), {
          access: "private",
        });
        console.log(`✅ User backed up to Blob: ${userId}`);
      }
    } catch (error) {
      console.warn("Failed to backup user to Blob:", error);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userId = this.emailIndex.get(email.toLowerCase());
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async findById(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  async updateUser(userId: string, updates: UpdateUserPayload): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const updated: User = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.users.set(userId, updated);

    // Try to backup to Vercel Blob
    try {
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const blobPath = `users/${userId}.json`;
        await put(blobPath, JSON.stringify(updated), {
          access: "private",
        });
      }
    } catch (error) {
      console.warn("Failed to update user in Blob:", error);
    }

    return updated;
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;

    if (verifyPassword(password, user.passwordHash)) {
      return user;
    }
    return null;
  }

  async incrementUserStats(
    userId: string,
    scoreIncrease: number,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return this.updateUser(userId, {
      sustainabilityScore: user.sustainabilityScore + scoreIncrease,
      totalDecisions: user.totalDecisions + 1,
    });
  }
}

export const userStore = new UserStore();
