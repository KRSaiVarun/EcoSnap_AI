import { db } from "./db";
import { decisions, type InsertDecision, type Decision } from "@shared/schema";

export interface IStorage {
  getDecisions(): Promise<Decision[]>;
  createDecision(decision: InsertDecision): Promise<Decision>;
}

export class DatabaseStorage implements IStorage {
  async getDecisions(): Promise<Decision[]> {
    return await db.select().from(decisions);
  }

  async createDecision(decision: InsertDecision): Promise<Decision> {
    const [created] = await db.insert(decisions).values(decision).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
