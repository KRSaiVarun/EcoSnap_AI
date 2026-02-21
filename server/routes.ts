import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { insertDecisionSchema } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post(api.decisions.analyze.path, async (req, res) => {
    try {
      const { decision } = api.decisions.analyze.input.parse(req.body);

      const prompt = `
        You are GreenPulse, an AI-powered sustainability micro-decision assistant.

        Help users make better daily lifestyle choices by suggesting eco-friendly alternatives and estimating carbon impact differences.

        You analyze small daily decisions related to: food, transport, shopping, or other.

        Rules:
        - Be concise and practical.
        - Use realistic but simple carbon estimates (in kg).
        - Never explain your reasoning.
        - Never return text outside JSON.
        - Never return null values.
        - All numbers must be positive.
        - Round all numbers to 1 decimal place.
        - If information is unclear, make reasonable assumptions.
        - Keep encouragement messages short and positive.

        Analysis steps:
        1. Identify the user's original action.
        2. Classify it into one category: food, transport, shopping, or other.
        3. Estimate the original action's CO2 impact (kg).
        4. Suggest ONE eco-friendly alternative.
        5. Estimate eco alternative CO2 (kg).
        6. Calculate: co2_saved_kg = original_co2_kg - eco_co2_kg, percentage_reduction
        7. Assign sustainability_score: 10 (80%+ reduction), 7 (50-79%), 5 (30-49%), 3 (<30%)

        User decision: "${decision}"
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const responseContent = response.choices[0]?.message?.content || "{}";
      const parsedResponse = JSON.parse(responseContent);

      const mappedData = {
        category: parsedResponse.category || "other",
        originalAction: parsedResponse.original_action || decision,
        originalCo2Kg: String(parsedResponse.original_co2_kg || 0),
        ecoAlternative: parsedResponse.eco_alternative || "None",
        ecoCo2Kg: String(parsedResponse.eco_co2_kg || 0),
        co2SavedKg: String(parsedResponse.co2_saved_kg || 0),
        percentageReduction: String(parsedResponse.percentage_reduction || 0),
        sustainabilityScore: parsedResponse.sustainability_score || 3,
        encouragementMessage: parsedResponse.encouragement_message || "Every little bit helps!",
      };
      
      const validatedData = insertDecisionSchema.parse(mappedData);

      const savedDecision = await storage.createDecision(validatedData);
      
      res.status(200).json(savedDecision);
    } catch (err) {
      console.error(err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message || "Validation Error",
          field: err.errors[0]?.path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.decisions.list.path, async (req, res) => {
    try {
      const decisions = await storage.getDecisions();
      res.status(200).json(decisions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  try {
    const existingDecisions = await storage.getDecisions();
    if (existingDecisions.length === 0) {
      await storage.createDecision({
        category: "food",
        originalAction: "Chicken burger",
        originalCo2Kg: "3.0",
        ecoAlternative: "Vegetarian burger",
        ecoCo2Kg: "1.2",
        co2SavedKg: "1.8",
        percentageReduction: "60.0",
        sustainabilityScore: 7,
        encouragementMessage: "Switching to a vegetarian option significantly lowers your carbon footprint!"
      });
      await storage.createDecision({
        category: "transport",
        originalAction: "Driving to work alone (10 miles)",
        originalCo2Kg: "4.5",
        ecoAlternative: "Taking the train",
        ecoCo2Kg: "1.1",
        co2SavedKg: "3.4",
        percentageReduction: "75.5",
        sustainabilityScore: 7,
        encouragementMessage: "Great job! Public transport is a huge win for the environment."
      });
    }
  } catch (e) {
    console.error("Seeding failed", e);
  }
}
