import OpenAI from "openai";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface AgentResponse {
  reply: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  carbon_impact?: {
    choice: string;
    co2_kg: number;
    alternative: string;
    alt_co2_kg: number;
    co2_saved: number;
  };
}

export class AdvancedEcoAgent {
  private openai: OpenAI;
  private conversationHistory: Map<string, Message[]> = new Map();
  private userPreferences: Map<string, any> = new Map();
  private readonly maxHistoryLength = 30;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "sk-test-key",
    });
  }

  private getSystemPrompt(): string {
    return `You are an advanced eco sustainability expert with deep expertise in:
- Carbon footprint calculation and environmental impact analysis
- Sustainable product alternatives and eco-friendly choices
- Diet sustainability (food carbon footprint)
- Transportation emissions and alternatives
- Fashion sustainability and fast fashion impact
- Zero-waste lifestyle tips
- Renewable energy solutions
- Environmental impact assessment

When users describe an eco-decision (like "I'm ordering a beef burger for lunch"), you should:
1. Identify the activity and its carbon impact
2. Provide the estimated CO2 emissions in kg
3. Suggest 2-3 sustainable alternatives with their carbon footprint
4. Calculate CO2 saved by choosing the alternative
5. Provide specific, actionable tips
6. Be encouraging but realistic
7. Include relevant environmental facts or statistics

Format your response as JSON with this structure:
{
  "activity": "description of the activity",
  "carbon_impact": {
    "choice": "brief description",
    "co2_kg": number,
    "alternative": "recommended eco-friendly alternative",
    "alt_co2_kg": number,
    "co2_saved": number,
    "percentage_reduction": number
  },
  "impact_level": "low|medium|high",
  "recommendations": [
    "specific recommendation 1",
    "specific recommendation 2",
    "specific recommendation 3"
  ],
  "fun_fact": "an interesting environmental statistic or fact",
  "encouragement": "positive message about making eco-friendly choices",
  "conversation_response": "conversational response to the user"
}

Be conversational, engaging, and focus on practical solutions.`;
  }

  async processMessage(
    userMessage: string,
    userId: string = "anonymous",
  ): Promise<AgentResponse> {
    // Initialize user history if not exists
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, [
        {
          role: "system",
          content: this.getSystemPrompt(),
          timestamp: new Date(),
        },
      ]);
    }

    const history = this.conversationHistory.get(userId)!;

    // Enhance message with user preferences if available
    let enhancedMessage = userMessage;
    if (this.userPreferences.has(userId)) {
      const prefs = this.userPreferences.get(userId);
      enhancedMessage = this.enhanceMessageWithPreferences(userMessage, prefs);
    }

    // Add user message to history
    history.push({
      role: "user",
      content: enhancedMessage,
      timestamp: new Date(),
    });

    // Trim history if needed
    this.trimHistory(userId);

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: history.map(({ role, content }) => ({
          role: role as "system" | "user" | "assistant",
          content,
        })),
        temperature: 0.7,
        max_tokens: 800,
      });

      const reply = response.choices[0]?.message?.content || "";

      // Add assistant response to history
      history.push({
        role: "assistant",
        content: reply,
        timestamp: new Date(),
      });

      // Parse JSON response if present
      let carbonImpact: any = undefined;
      try {
        const jsonMatch = reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          carbonImpact = parsed.carbon_impact;
        }
      } catch (e) {
        // If JSON parsing fails, just use the text response
      }

      return {
        reply,
        usage: response.usage,
        model: "gpt-3.5-turbo",
        carbon_impact: carbonImpact,
      };
    } catch (error) {
      console.error("AI Agent Error:", error);
      return this.getFallbackResponse(userMessage);
    }
  }

  private enhanceMessageWithPreferences(
    message: string,
    preferences: any,
  ): string {
    const context = `[User Context: Location: ${preferences.location || "unknown"}, Lifestyle: ${preferences.lifestyle || "standard"}, Budget: ${preferences.budget || "moderate"}]\n\n${message}`;
    return context;
  }

  async setUserPreferences(userId: string, preferences: any) {
    this.userPreferences.set(userId, preferences);
  }

  getConversationHistory(userId: string): Message[] {
    const history = this.conversationHistory.get(userId) || [];
    return history.filter((msg) => msg.role !== "system");
  }

  clearHistory(userId: string) {
    const systemMsg = this.conversationHistory.get(userId)?.[0];
    if (systemMsg) {
      this.conversationHistory.set(userId, [systemMsg]);
    } else {
      this.conversationHistory.delete(userId);
    }
  }

  private trimHistory(userId: string) {
    const history = this.conversationHistory.get(userId);
    if (history && history.length > this.maxHistoryLength) {
      // Keep system prompt and recent messages
      const trimmed = [
        history[0],
        ...history.slice(-this.maxHistoryLength + 1),
      ];
      this.conversationHistory.set(userId, trimmed);
    }
  }

  private getFallbackResponse(userMessage: string): AgentResponse {
    const fallbacks = [
      {
        reply:
          "I'm experiencing high demand. Here's an eco tip: Switching from beef to chicken can reduce your meal's carbon footprint by 70%! What eco-decision would you like to analyze?",
        activity:
          "Reducing meat consumption - especially beef to poultry substitution",
      },
      {
        reply:
          "While processing your request, remember: One meatless meal per week can save the equivalent of driving a car 1,600 miles! Tell me about your next decision.",
        activity: "Adopting plant-based eating",
      },
      {
        reply:
          "Thanks for your patience! Quick fact: Using public transit instead of driving can reduce your carbon emissions by up to 45%. What decision can I help you analyze?",
        activity: "Using public transportation",
      },
    ];

    const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

    return {
      reply: fallback.reply,
      model: "fallback",
    };
  }
}

// Export singleton instance
export const ecoAgent = new AdvancedEcoAgent();
