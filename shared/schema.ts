import { pgTable, text, serial, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

export const insertDecisionSchema = createInsertSchema(decisions).omit({ id: true });

export type InsertDecision = z.infer<typeof insertDecisionSchema>;
export type Decision = typeof decisions.$inferSelect;

export type AnalyzeDecisionRequest = {
  decision: string;
};

export type AnalyzeDecisionResponse = InsertDecision;
