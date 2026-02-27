import { api } from "@shared/routes";
import { insertDecisionSchema } from "@shared/schema";
import type { Express, Request } from "express";
import type { Server } from "http";
import OpenAI from "openai";
import { z } from "zod";
import { ecoAgent } from "./aiAgent";
import { generateToken } from "./auth";
import { storage } from "./blob-storage";
import { userStore } from "./user-store";

const openai = new OpenAI({
  apiKey:
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "sk-test-key-for-development",
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Analyze a decision using AI (protected route)
  app.post(api.decisions.analyze.path, async (req: Request, res) => {
    try {
      // Validate input
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
        - Round to 1 decimal place.
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

      // Call OpenAI
      let response;
      try {
        response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo", // Fixed model name
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 500,
        });
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError);
        return res.status(503).json({
          message: "AI service temporarily unavailable",
          error:
            process.env.NODE_ENV === "development"
              ? (openaiError as Error).message
              : undefined,
        });
      }

      // Parse OpenAI response
      const responseContent = response.choices[0]?.message?.content;
      if (!responseContent) {
        return res
          .status(500)
          .json({ message: "Empty response from AI service" });
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseContent);
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        return res.status(500).json({
          message: "Invalid response format from AI service",
          rawResponse:
            process.env.NODE_ENV === "development"
              ? responseContent
              : undefined,
        });
      }

      // Validate required fields from AI
      const requiredFields = [
        "category",
        "original_action",
        "original_co2_kg",
        "eco_alternative",
        "eco_co2_kg",
      ];
      const missingFields = requiredFields.filter(
        (field) => parsedResponse[field] === undefined,
      );

      if (missingFields.length > 0) {
        return res.status(500).json({
          message: `AI response missing required fields: ${missingFields.join(", ")}`,
        });
      }

      // Map AI response to database schema
      const mappedData = {
        category: parsedResponse.category || "other",
        originalAction: parsedResponse.original_action || decision,
        originalCo2Kg: String(parsedResponse.original_co2_kg ?? 0),
        ecoAlternative: parsedResponse.eco_alternative || "None",
        ecoCo2Kg: String(parsedResponse.eco_co2_kg ?? 0),
        co2SavedKg: String(parsedResponse.co2_saved_kg ?? 0),
        percentageReduction: String(parsedResponse.percentage_reduction ?? 0),
        sustainabilityScore: Number(parsedResponse.sustainability_score ?? 3),
        encouragementMessage:
          parsedResponse.encouragement_message || "Every little bit helps!",
      };

      // Validate with Zod schema
      let validatedData;
      try {
        validatedData = insertDecisionSchema.parse(mappedData);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({
            message: "Data validation failed",
            errors: validationError.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          });
        }
        throw validationError;
      }

      // Save to database
      const savedDecision = await storage.createDecision(
        validatedData,
        req.user?.userId, // Pass userId if user is authenticated
      );

      // Update user stats if authenticated
      if (req.user) {
        await userStore.incrementUserStats(
          req.user.userId,
          mappedData.sustainabilityScore,
        );
      }

      // Return success response
      res.status(200).json({
        ...savedDecision,
        analysis: {
          original_co2_kg: parsedResponse.original_co2_kg,
          eco_co2_kg: parsedResponse.eco_co2_kg,
          co2_saved_kg: parsedResponse.co2_saved_kg,
          percentage_reduction: parsedResponse.percentage_reduction,
        },
      });
    } catch (err) {
      console.error("Unexpected error:", err);

      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation Error",
          field: err.errors[0]?.path.join("."),
          details: err.errors[0]?.message,
        });
      }

      res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development"
            ? (err as Error).message
            : undefined,
      });
    }
  });

  // List all decisions (or user's decisions if authenticated)
  app.get(api.decisions.list.path, async (req: Request, res) => {
    try {
      // Add pagination support
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Get decisions (filtered by userId if authenticated)
      const decisions = await storage.getDecisions(req.user?.userId);

      // Sort by most recent first (assuming there's an id field for ordering)
      const sortedDecisions = decisions.sort((a, b) => {
        return (b.id || 0) - (a.id || 0);
      });

      // Apply pagination
      const paginatedDecisions = sortedDecisions.slice(skip, skip + limit);

      res.status(200).json({
        decisions: paginatedDecisions,
        pagination: {
          page,
          limit,
          total: decisions.length,
          pages: Math.ceil(decisions.length / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching decisions:", error);
      res.status(500).json({
        message: "Failed to fetch decisions",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  });

  // Get a single decision by ID
  // NOTE: This endpoint is currently disabled as api.decisions.detail is not defined
  // Uncomment and implement if needed in shared/routes.ts
  /*
  app.get(api.decisions.detail.path, async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Decision ID is required" });
      }

      const decision = await storage.getDecision(id);

      if (!decision) {
        return res.status(404).json({ message: "Decision not found" });
      }

      res.status(200).json(decision);
    } catch (error) {
      console.error("Error fetching decision:", error);
      res.status(500).json({
        message: "Failed to fetch decision",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  });
  */

  // Delete a decision
  // NOTE: This endpoint is currently disabled as api.decisions.delete is not defined
  // Uncomment and implement if needed in shared/routes.ts
  /*
  app.delete(api.decisions.delete.path, async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Decision ID is required" });
      }

      const existing = await storage.getDecision(id);

      if (!existing) {
        return res.status(404).json({ message: "Decision not found" });
      }

      await storage.deleteDecision(id);

      res.status(200).json({
        message: "Decision deleted successfully",
        id,
      });
    } catch (error) {
      console.error("Error deleting decision:", error);
      res.status(500).json({
        message: "Failed to delete decision",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  });
  */

  // Auth routes
  // Register endpoint
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const { email, password, name } = api.auth.register.input.parse(req.body);

      // Create user in store
      const user = await userStore.createUser(email, password, name);

      // Generate JWT token
      const token = generateToken(user.id, user.email);

      res.status(201).json({
        id: user.id,
        email: user.email,
        name: user.name,
        token,
        sustainabilityScore: user.sustainabilityScore,
      });
    } catch (error) {
      if ((error as Error).message.includes("already registered")) {
        return res.status(400).json({
          message: "Email already registered",
        });
      }

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      console.error("Registration error:", error);
      res.status(500).json({
        message: "Registration failed",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  });

  // Login endpoint
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { email, password } = api.auth.login.input.parse(req.body);

      // Verify user credentials
      const isValid = await userStore.verifyPassword(email, password);
      if (!isValid) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      // Get user
      const user = await userStore.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      // Generate JWT token
      const token = generateToken(user.id, user.email);

      res.status(200).json({
        id: user.id,
        email: user.email,
        name: user.name,
        token,
        sustainabilityScore: user.sustainabilityScore,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      console.error("Login error:", error);
      res.status(500).json({
        message: "Login failed",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  });

  // Get profile endpoint (protected)
  app.get(api.auth.profile.path, async (req: Request, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const user = await userStore.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      res.status(200).json({
        id: user.id,
        email: user.email,
        name: user.name,
        sustainabilityScore: user.sustainabilityScore,
        totalDecisions: user.totalDecisions,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({
        message: "Failed to fetch profile",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  });

  // Chat routes
  // Chat message endpoint
  app.post(api.chat.message.path, async (req: Request, res) => {
    try {
      const { message, preferences } = api.chat.message.input.parse(req.body);
      const userId = req.user?.userId || "anonymous";

      // Set user preferences if provided
      if (preferences) {
        await ecoAgent.setUserPreferences(userId, preferences);
      }

      // Process message with AI agent
      const response = await ecoAgent.processMessage(message, userId);

      res.status(200).json({
        reply: response.reply,
        model: response.model,
        carbon_impact: response.carbon_impact,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      console.error("Chat error:", error);
      res.status(500).json({
        message: "Failed to process message",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  });

  // Get conversation history
  app.get(api.chat.history.path, async (req: Request, res) => {
    try {
      const userId = req.user?.userId || "anonymous";
      const history = ecoAgent.getConversationHistory(userId);

      res.status(200).json({
        messages: history.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp?.toISOString() || new Date().toISOString(),
        })),
      });
    } catch (error) {
      console.error("History fetch error:", error);
      res.status(500).json({
        message: "Failed to fetch history",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  });

  // Clear conversation history
  app.post(api.chat.clear.path, async (req: Request, res) => {
    try {
      const userId = req.user?.userId || "anonymous";
      ecoAgent.clearHistory(userId);

      res.status(200).json({
        message: "Conversation history cleared",
      });
    } catch (error) {
      console.error("Clear history error:", error);
      res.status(500).json({
        message: "Failed to clear history",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        ai: !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY
          ? "configured"
          : "using_default_key",
        database: !!process.env.DATABASE_URL ? "configured" : "not_configured",
      },
    });
  });

  // Seed database with initial data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  // Skip seeding if DATABASE_URL is not set (development without local database)
  if (!process.env.DATABASE_URL) {
    console.log("⚠️  Skipping database seeding - DATABASE_URL not set");
    return;
  }

  try {
    const existingDecisions = await storage.getDecisions();

    if (existingDecisions.length === 0) {
      console.log("🌱 Seeding database with initial data...");

      // Seed food example
      await storage.createDecision({
        category: "food",
        originalAction: "Chicken burger",
        originalCo2Kg: "3.0",
        ecoAlternative: "Vegetarian burger",
        ecoCo2Kg: "1.2",
        co2SavedKg: "1.8",
        percentageReduction: "60.0",
        sustainabilityScore: 7,
        encouragementMessage:
          "Switching to a vegetarian option significantly lowers your carbon footprint!",
      });

      // Seed transport example
      await storage.createDecision({
        category: "transport",
        originalAction: "Driving to work alone (10 miles)",
        originalCo2Kg: "4.5",
        ecoAlternative: "Taking the train",
        ecoCo2Kg: "1.1",
        co2SavedKg: "3.4",
        percentageReduction: "75.5",
        sustainabilityScore: 7,
        encouragementMessage:
          "Great job! Public transport is a huge win for the environment.",
      });

      // Seed shopping example
      await storage.createDecision({
        category: "shopping",
        originalAction: "Buying a new fast fashion t-shirt",
        originalCo2Kg: "7.0",
        ecoAlternative: "Buying a thrifted t-shirt",
        ecoCo2Kg: "2.0",
        co2SavedKg: "5.0",
        percentageReduction: "71.4",
        sustainabilityScore: 7,
        encouragementMessage:
          "Second-hand shopping is a great way to reduce fashion's environmental impact!",
      });

      console.log("✅ Database seeded successfully with 3 entries");
    } else {
      console.log(
        `📊 Database already contains ${existingDecisions.length} entries, skipping seed`,
      );
    }
  } catch (e) {
    console.warn("⚠️  Database seeding failed:", (e as Error).message);
    // Don't crash the server if seeding fails
    if (process.env.NODE_ENV === "development") {
      console.debug("Seeding error details:", e);
    }
  }
}

// Add type definitions for the storage interface if not already defined
declare module "./blob-storage" {
  interface IStorage {
    getDecision(id: string): Promise<any>;
    deleteDecision(id: string): Promise<void>;
  }
}
