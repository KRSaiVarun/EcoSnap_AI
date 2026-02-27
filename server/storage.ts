import { decisions, type Decision, type InsertDecision } from "@shared/schema";
import { db } from "./db";

export interface IStorage {
  getDecisions(): Promise<Decision[]>;
  createDecision(decision: InsertDecision): Promise<Decision>;
}

export class DatabaseStorage implements IStorage {
  async getDecisions(): Promise<Decision[]> {
    if (!db) {
      // Return empty array if database is not available
      return [];
    }
    return await db.select().from(decisions);
  }

  async createDecision(decision: InsertDecision): Promise<Decision> {
    if (!db) {
      // Return mock decision if database is not available
      return {
        ...decision,
        id: Math.random(),
      } as unknown as Decision;
    }
    const [created] = await db.insert(decisions).values(decision).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
