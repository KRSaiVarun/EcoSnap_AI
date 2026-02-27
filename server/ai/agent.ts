import NodeCache from "node-cache";
import OpenAI from "openai";
import PQueue from "p-queue";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export interface CarbonImpact {
  choice: string;
  co2_kg: number;
  alternative: string;
  alt_co2_kg: number;
  co2_saved: number;
  category: "transport" | "food" | "shopping" | "energy" | "waste";
}

export interface AIResponse {
  reply: string;
  carbon_impact?: CarbonImpact;
  suggestions?: string[];
  confidence: number;
}

export interface UserPreferences {
  location?: string;
  lifestyle?: "urban" | "suburban" | "rural";
  budget?: "tight" | "moderate" | "flexible";
  diet?: "omnivore" | "vegetarian" | "vegan" | "pescatarian";
  transportation?: "car" | "public" | "bike" | "walk";
}

export class AdvancedEcoAgent {
  private openai: OpenAI;
  private cache: NodeCache;
  private queue: PQueue;
  private conversationHistory: Map<string, Message[]> = new Map();
  private userPreferences: Map<string, UserPreferences> = new Map();

  private readonly emissionFactors = {
    transport: {
      car: 0.21,
      suv: 0.28,
      electric_car: 0.05,
      bus: 0.08,
      train: 0.04,
      plane: 0.25,
      bike: 0,
      walk: 0,
    },
    food: {
      beef: 27,
      lamb: 24,
      cheese: 13.5,
      pork: 7.5,
      chicken: 6.5,
      fish: 5,
      eggs: 4.5,
      rice: 2.5,
      tofu: 2,
      beans: 1.5,
      vegetables: 0.5,
      fruits: 0.5,
    },
    shopping: {
      tshirt: 5,
      jeans: 15,
      shoes: 12,
      smartphone: 70,
      laptop: 200,
      book: 2,
    },
    energy: {
      electricity: 0.5,
      gas: 2.5,
      water: 0.3,
    },
    waste: {
      plastic: 3.5,
      paper: 1.2,
      glass: 0.8,
      aluminum: 6,
    },
  };

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.cache = new NodeCache({ stdTTL: 3600 });

    this.queue = new PQueue({
      concurrency: 5,
      interval: 1000,
      intervalCap: 10,
    });
  }

  private getSystemPrompt(userPrefs?: UserPreferences): string {
    const basePrompt = `You are an advanced eco sustainability expert with real-time carbon footprint calculation capabilities.

Core Functions:
1. Analyze user actions and calculate precise carbon impact
2. Suggest eco-friendly alternatives with quantifiable CO2 savings
3. Provide personalized recommendations based on user context
4. Track cumulative environmental impact
5. Educate users about environmental impact in an engaging way

For EVERY user query, attempt to:
- Identify the main activity/product/service
- Calculate its carbon footprint using real data
- Suggest a viable alternative with lower impact
- Quantify the potential CO2 savings
- Consider user's location, lifestyle, and budget

Be encouraging and practical - suggest realistic alternatives that fit modern life.`;

    if (userPrefs) {
      return `${basePrompt}\n\nUser Context:
- Location: ${userPrefs.location || "Not specified"}
- Lifestyle: ${userPrefs.lifestyle || "Not specified"}
- Budget: ${userPrefs.budget || "Not specified"}
- Diet: ${userPrefs.diet || "Not specified"}`;
    }

    return basePrompt;
  }

  private getUserHistory(userId: string): Message[] {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
    return this.conversationHistory.get(userId)!;
  }

  async processMessage(
    userMessage: string,
    userId: string = "anonymous",
    preferences?: UserPreferences,
  ): Promise<AIResponse> {
    try {
      // Store preferences if provided
      if (preferences) {
        this.userPreferences.set(userId, preferences);
      }

      // Check cache
      const cacheKey = `${userId}:${userMessage.substring(0, 50)}`;
      const cachedResponse = this.cache.get<AIResponse>(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Get user history and preferences
      const history = this.getUserHistory(userId);
      const userPrefs = this.userPreferences.get(userId);

      // Add user message to history
      history.push({
        role: "user",
        content: userMessage,
        timestamp: new Date(),
      });

      // Detect and calculate carbon impact
      const carbonImpact = await this.detectAndCalculateImpact(userMessage);

      // Generate AI response
      const aiResponse = await this.generateAIResponse(
        userMessage,
        carbonImpact,
        userPrefs,
        history,
      );

      const finalResponse: AIResponse = {
        reply: aiResponse,
        carbon_impact: carbonImpact,
        suggestions: await this.generateSuggestions(userMessage, userPrefs),
        confidence: carbonImpact ? 0.95 : 0.85,
      };

      // Add assistant response to history
      history.push({
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      });

      // Trim history
      this.trimHistory(userId);

      // Cache response
      this.cache.set(cacheKey, finalResponse);

      return finalResponse;
    } catch (error) {
      console.error("AI Agent Error:", error);
      return this.getFallbackResponse(userMessage);
    }
  }

  private async detectAndCalculateImpact(
    userMessage: string,
  ): Promise<CarbonImpact | undefined> {
    try {
      const detectionPrompt = `
        Analyze this message and extract sustainability-related information:
        "${userMessage}"

        Return a JSON object with:
        - activity: what the person is doing/using
        - category: one of [transport, food, shopping, energy, waste]
        - quantity: estimated amount (number, default 1)
        - unit: unit of measurement

        Format: JSON only, no other text
      `;

      const detection = await this.queue.add(() =>
        this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a carbon impact detection AI. Return only JSON.",
            },
            { role: "user", content: detectionPrompt },
          ],
          temperature: 0.3,
          max_tokens: 150,
        }),
      );

      const detectionText =
        (detection as any)?.choices?.[0]?.message?.content || "{}";
      const detectionData = JSON.parse(detectionText);

      if (!detectionData.activity || !detectionData.category) {
        return undefined;
      }

      return this.calculateCarbonImpact(
        detectionData.activity,
        detectionData.category,
        detectionData.quantity || 1,
      );
    } catch (error) {
      return undefined;
    }
  }

  private calculateCarbonImpact(
    activity: string,
    category: string,
    quantity: number,
  ): CarbonImpact | undefined {
    const factors =
      this.emissionFactors[category as keyof typeof this.emissionFactors];
    const factorsAny = factors as any;
    if (!factors) return undefined;

    const activityLower = activity.toLowerCase();
    let emissionFactor = 0;
    let alternative = "";
    let altEmissionFactor = 0;

    switch (category) {
      case "transport":
        if (activityLower.includes("car") || activityLower.includes("drive")) {
          emissionFactor = factorsAny.car;
          alternative = "electric car or public transport";
          altEmissionFactor = factorsAny.electric_car;
        } else if (
          activityLower.includes("plane") ||
          activityLower.includes("fly")
        ) {
          emissionFactor = factorsAny.plane;
          alternative = "train travel";
          altEmissionFactor = factorsAny.train;
        } else {
          emissionFactor = factorsAny.car;
          alternative = "bicycle or walking";
          altEmissionFactor = 0;
        }
        break;

      case "food":
        if (
          activityLower.includes("beef") ||
          activityLower.includes("burger")
        ) {
          emissionFactor = factorsAny.beef;
          alternative = "plant-based burger or chicken";
          altEmissionFactor = factorsAny.chicken;
        } else if (activityLower.includes("cheese")) {
          emissionFactor = factorsAny.cheese;
          alternative = "plant-based cheese alternative";
          altEmissionFactor = factorsAny.tofu;
        } else {
          emissionFactor = factorsAny.chicken;
          alternative = "tofu or beans";
          altEmissionFactor = factorsAny.beans;
        }
        break;

      case "shopping":
        if (
          activityLower.includes("shirt") ||
          activityLower.includes("tshirt")
        ) {
          emissionFactor = factorsAny.tshirt;
          alternative = "buy second-hand or sustainable brand";
          altEmissionFactor = factorsAny.tshirt * 0.3;
        } else if (activityLower.includes("phone")) {
          emissionFactor = factorsAny.smartphone;
          alternative = "repair current phone or buy refurbished";
          altEmissionFactor = factorsAny.smartphone * 0.4;
        } else {
          emissionFactor = factorsAny.jeans;
          alternative = "buy second-hand or sustainable denim";
          altEmissionFactor = factorsAny.jeans * 0.3;
        }
        break;

      default:
        emissionFactor = 1;
        alternative = "more sustainable alternative";
        altEmissionFactor = 0.5;
    }

    const co2_kg = Number((emissionFactor * quantity).toFixed(2));
    const alt_co2_kg = Number((altEmissionFactor * quantity).toFixed(2));
    const co2_saved = Number((co2_kg - alt_co2_kg).toFixed(2));

    return {
      choice: activity,
      co2_kg,
      alternative,
      alt_co2_kg,
      co2_saved,
      category: category as any,
    };
  }

  private async generateAIResponse(
    userMessage: string,
    carbonImpact?: CarbonImpact,
    preferences?: UserPreferences,
    history: Message[] = [],
  ): Promise<string> {
    const messages = [
      { role: "system", content: this.getSystemPrompt(preferences) },
      ...history.slice(-5).map(({ role, content }) => ({ role, content })), // Last 5 messages for context
    ];

    const impactContext = carbonImpact
      ? `
      Carbon Impact Analysis:
      - Activity: ${carbonImpact.choice}
      - Current CO2: ${carbonImpact.co2_kg} kg
      - Alternative: ${carbonImpact.alternative}
      - Alternative CO2: ${carbonImpact.alt_co2_kg} kg
      - Potential Savings: ${carbonImpact.co2_saved} kg CO2
    `
      : "";

    const enhancedMessage = `
      User: "${userMessage}"

      ${impactContext}

      Provide a helpful, encouraging response that:
      1. Acknowledges their query
      2. Shares the carbon impact data (if available) in an engaging way
      3. Suggests practical, budget-conscious alternatives
      4. Includes specific numbers and comparisons
      5. Ends with an encouraging note or question

      Keep the response conversational and under 150 words.
    `;

    messages.push({ role: "user", content: enhancedMessage });

    const response = await this.queue.add(() =>
      this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 300,
      }),
    );

    const text = (response as any)?.choices?.[0]?.message?.content;
    return (
      text || "I'm analyzing your request. Could you provide more details?"
    );
  }

  private async generateSuggestions(
    userMessage: string,
    preferences?: UserPreferences,
  ): Promise<string[]> {
    const prompt = `
      Based on: "${userMessage}"
      Generate 3 practical eco-friendly suggestions.
      Consider budget: ${preferences?.budget || "moderate"}
      Return as JSON array of strings.
    `;

    try {
      const response = await this.queue.add(() =>
        this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Return only a JSON array of strings." },
            { role: "user", content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 150,
        }),
      );

      const suggestionsText =
        (response as any)?.choices?.[0]?.message?.content || "[]";
      return JSON.parse(suggestionsText);
    } catch {
      return [
        "Consider buying second-hand items",
        "Try meatless meals a few days a week",
        "Use public transportation when possible",
      ];
    }
  }

  private trimHistory(userId: string) {
    const history = this.conversationHistory.get(userId);
    if (history && history.length > 50) {
      this.conversationHistory.set(userId, history.slice(-50));
    }
  }

  private getFallbackResponse(userMessage: string): AIResponse {
    return {
      reply:
        "I'm here to help with eco-friendly suggestions! Could you tell me more about what you're looking for? For example, you could ask about transportation, food choices, or shopping habits.",
      confidence: 0.7,
      suggestions: [
        "Try asking: 'What's the carbon impact of driving vs public transport?'",
        "Or: 'Suggest eco-friendly alternatives for lunch'",
        "You can also: 'Compare beef burger vs plant-based burger'",
      ],
    };
  }

  async clearHistory(userId: string) {
    this.conversationHistory.delete(userId);
  }

  getStats() {
    return {
      activeUsers: this.conversationHistory.size,
      cacheSize: this.cache.getStats().keys,
      queueSize: this.queue.size,
    };
  }
}

// Export singleton instance
export const ecoAgent = new AdvancedEcoAgent();
