import {
  boolean,
  date,
  decimal,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  city: varchar("city", { length: 100 }),
  sustainabilityScore: integer("sustainability_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily Habits Table
export const dailyHabits = pgTable("daily_habits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  transportType: varchar("transport_type", {
    length: 50,
    enum: ["car", "bike", "bus", "walk", "train"],
  }),
  electricityHours: decimal("electricity_hours", { precision: 5, scale: 2 }),
  meatMeals: integer("meat_meals"),
  plasticItems: integer("plastic_items"),
  waterUsageLiters: decimal("water_usage_liters", { precision: 8, scale: 2 }),
  habitDate: date("habit_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Carbon Emission Log
export const carbonEmissionLog = pgTable("carbon_emission_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  totalEmission: decimal("total_emission", {
    precision: 10,
    scale: 3,
  }).notNull(),
  emissionLevel: varchar("emission_level", {
    length: 20,
    enum: ["low", "medium", "high"],
  }),
  calculatedAt: timestamp("calculated_at").defaultNow(),
});

// Eco Suggestions
export const ecoSuggestions = pgTable("eco_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  suggestion: text("suggestion").notNull(),
  impactReduction: decimal("impact_reduction", { precision: 8, scale: 3 }),
  category: varchar("category", { length: 50 }),
  accepted: boolean("accepted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Rewards & Gamification
export const rewards = pgTable("rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  badgeName: varchar("badge_name", { length: 100 }).notNull(),
  points: integer("points").default(0),
  earnedAt: timestamp("earned_at").defaultNow(),
});

// Green Action Blockchain Proof
export const greenActionsProof = pgTable("green_actions_proof", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  actionType: varchar("action_type", { length: 100 }),
  carbonSaved: decimal("carbon_saved", { precision: 8, scale: 3 }),
  blockchainTxHash: text("blockchain_tx_hash").unique(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Legacy decisions table (keeping for compatibility)
export const decisions = pgTable("decisions", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  originalAction: text("original_action").notNull(),
  originalCo2Kg: numeric("original_co2_kg").notNull(),
  ecoAlternative: text("eco_alternative").notNull(),
  ecoCo2Kg: numeric("eco_co2_kg").notNull(),
  co2SavedKg: numeric("co2_saved_kg").notNull(),
  percentageReduction: numeric("percentage_reduction").notNull(),
  sustainabilityScore: integer("sustainability_score").notNull(),
  encouragementMessage: text("encouragement_message").notNull(),
});

// Schemas
export const insertUsersSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertDailyHabitsSchema = createInsertSchema(dailyHabits).omit({
  id: true,
  createdAt: true,
});
export const insertCarbonEmissionSchema = createInsertSchema(
  carbonEmissionLog,
).omit({ id: true, calculatedAt: true });
export const insertEcoSuggestionsSchema = createInsertSchema(
  ecoSuggestions,
).omit({ id: true, createdAt: true });
export const insertRewardsSchema = createInsertSchema(rewards).omit({
  id: true,
  earnedAt: true,
});
export const insertGreenActionsProofSchema = createInsertSchema(
  greenActionsProof,
).omit({ id: true, createdAt: true });
export const insertDecisionSchema = createInsertSchema(decisions).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUsersSchema>;

export type DailyHabit = typeof dailyHabits.$inferSelect;
export type InsertDailyHabit = z.infer<typeof insertDailyHabitsSchema>;

export type CarbonEmission = typeof carbonEmissionLog.$inferSelect;
export type InsertCarbonEmission = z.infer<typeof insertCarbonEmissionSchema>;

export type EcoSuggestion = typeof ecoSuggestions.$inferSelect;
export type InsertEcoSuggestion = z.infer<typeof insertEcoSuggestionsSchema>;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardsSchema>;

export type GreenActionProof = typeof greenActionsProof.$inferSelect;
export type InsertGreenActionProof = z.infer<
  typeof insertGreenActionsProofSchema
>;

export type Decision = typeof decisions.$inferSelect;
export type InsertDecision = z.infer<typeof insertDecisionSchema>;
