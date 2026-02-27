import { decisions, type Decision, type InsertDecision } from "@shared/schema";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  getDecisions(userId?: string): Promise<Decision[]>;
  createDecision(decision: InsertDecision, userId?: string): Promise<Decision>;
  getDecision(id: string): Promise<Decision | null>;
  deleteDecision(id: string): Promise<void>;
}

/**
 * Hybrid storage: uses database if available, falls back to Vercel Blob
 * Supports user-specific decision tracking
 */
export class HybridStorage implements IStorage {
  private decisionsCache: Map<number, Decision & { userId?: string }> =
    new Map();

  async getDecisions(userId?: string): Promise<Decision[]> {
    // Try database first
    if (db) {
      try {
        const allDecisions = await db.select().from(decisions);
        // Filter by userId if provided
        if (userId) {
          return allDecisions.filter((d) => (d as any).userId === userId);
        }
        return allDecisions;
      } catch (error) {
        console.warn("Error fetching from database, using cache:", error);
      }
    }

    // Return cached decisions filtered by userId
    const cached = Array.from(this.decisionsCache.values());
    if (userId) {
      return cached.filter((d) => d.userId === userId);
    }
    return cached;
  }

  async createDecision(
    decision: InsertDecision,
    userId?: string,
  ): Promise<Decision> {
    // Try database first
    if (db) {
      try {
        const [created] = await db
          .insert(decisions)
          .values(decision)
          .returning();
        const withUserId = { ...created, userId };
        this.decisionsCache.set(created.id, withUserId);
        return created;
      } catch (error) {
        console.warn("Error saving to database, using Vercel Blob:", error);
      }
    }

    // Fallback: Create in-memory decision
    const mockDecision: Decision & { userId?: string } = {
      ...decision,
      id: Math.floor(Math.random() * 1000000),
      userId,
    } as unknown as Decision & { userId?: string };

    // Try Vercel Blob storage
    try {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.warn(
          "⚠️  BLOB_READ_WRITE_TOKEN not set - storing decision in memory only",
        );
        this.decisionsCache.set(mockDecision.id, mockDecision);
        return mockDecision;
      }

      const blobPath = `decisions/${mockDecision.id}.json`;
      const { url } = await put(blobPath, JSON.stringify(mockDecision), {
        access: "private",
      });

      console.log(`✅ Decision saved to Vercel Blob: ${url}`);
      this.decisionsCache.set(mockDecision.id, mockDecision);
      return mockDecision;
    } catch (error) {
      console.error("Error saving decision to Blob:", error);
      // Fall back to memory cache
      this.decisionsCache.set(mockDecision.id, mockDecision);
      return mockDecision;
    }
  }

  async getDecision(id: string): Promise<Decision | null> {
    const numId = Number(id);

    // Try database first
    if (db) {
      try {
        const result = await db
          .select()
          .from(decisions)
          .where(eq(decisions.id, numId));
        return result.length > 0 ? result[0] : null;
      } catch (error) {
        console.warn("Error fetching from database:", error);
      }
    }

    // Check memory cache
    const cached = this.decisionsCache.get(numId);
    return cached || null;
  }

  async deleteDecision(id: string): Promise<void> {
    const numId = Number(id);

    // Try database first
    if (db) {
      try {
        await db.delete(decisions).where(eq(decisions.id, numId));
        this.decisionsCache.delete(numId);
        return;
      } catch (error) {
        console.warn("Error deleting from database:", error);
      }
    }

    // Delete from memory cache
    this.decisionsCache.delete(numId);
  }
}

export const storage = new HybridStorage();
