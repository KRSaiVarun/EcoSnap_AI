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
        You are EcoSnap_AI, a sustainability impact analyzer.

        Your job:
        1. Identify the user's decision category: Food, Transport, or Shopping.
        2. Extract quantities (distance, number of items, frequency).
        3. Estimate carbon emissions using realistic global average emission factors.
        4. Compare with a greener alternative.
        5. Calculate:
           - Estimated CO2 of user's choice (kg)
           - Estimated CO2 of better alternative (kg)
           - CO2 saved
        6. Classify impact:
           - Low (<1kg)
           - Medium (1–5kg)
           - High (>5kg)

        Use these average emission factors:
        FOOD (kg CO2 per kg food):
        - Beef: 27, Chicken: 6.9, Rice: 4, Vegetables: 2, Lentils: 0.9, Milk (1 liter): 3
        TRANSPORT (kg CO2 per km):
        - Car (petrol): 0.2, Bus: 0.1, Train/Metro: 0.05, Bike: 0, Walk: 0, Flight: 0.15
        SHOPPING (approx per item):
        - Fast fashion t-shirt: 7, Jeans: 20, Smartphone: 70, Plastic bottle: 0.1, Reusable bottle: 2, Thrift clothing: 2

        Rules:
        - Respond in structured JSON format only.
        - All numeric CO2 values must be returned as NUMBERS in the JSON (they will be converted to strings for storage).
        - Rounds to 1 decimal place.
        - sustainability_score: 10 (80%+ reduction), 7 (50-79%), 5 (30-49%), 3 (<30%)

        Expected JSON keys:
        {
          "category": "food" | "transport" | "shopping" | "other",
          "original_action": string,
          "original_co2_kg": number,
          "eco_alternative": string,
          "eco_co2_kg": number,
          "co2_saved_kg": number,
          "percentage_reduction": number,
          "sustainability_score": number,
          "encouragement_message": string
        }

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
        originalCo2Kg: String(parsedResponse.original_co2_kg ?? 0),
        ecoAlternative: parsedResponse.eco_alternative || "None",
        ecoCo2Kg: String(parsedResponse.eco_co2_kg ?? 0),
        co2SavedKg: String(parsedResponse.co2_saved_kg ?? 0),
        percentageReduction: String(parsedResponse.percentage_reduction ?? 0),
        sustainabilityScore: Number(parsedResponse.sustainability_score ?? 3),
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
