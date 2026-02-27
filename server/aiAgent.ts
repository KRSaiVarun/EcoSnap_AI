import OpenAI from "openai";
import { supabase } from "./supabase";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: string;
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
  private userPreferences: Map<string, any> = new Map();
  private readonly maxHistoryLength = 30;
  private systemMessage: Message | null = null;

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
    try {
      // Fetch or create conversation in Supabase
      let history: Message[] = [];

      if (supabase) {
        const { data: conversation, error } = await supabase
          .from("conversations")
          .select("messages")
          .eq("user_id", userId)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = no rows found (expected for new users)
          console.warn("Supabase fetch error:", error.message);
        }

        if (conversation?.messages) {
          history = conversation.messages as Message[];
        } else {
          // New conversation - initialize with system prompt
          history = [
            {
              role: "system",
              content: this.getSystemPrompt(),
              timestamp: new Date().toISOString(),
            },
          ];
        }
      } else {
        // Fallback: in-memory (Supabase not configured)
        if (!this.systemMessage) {
          this.systemMessage = {
            role: "system",
            content: this.getSystemPrompt(),
            timestamp: new Date().toISOString(),
          };
        }
        history = [this.systemMessage];
      }

      // Enhance message with user preferences if available
      let enhancedMessage = userMessage;
      if (this.userPreferences.has(userId)) {
        const prefs = this.userPreferences.get(userId);
        enhancedMessage = this.enhanceMessageWithPreferences(
          userMessage,
          prefs,
        );
      }

      // Add user message to history
      history.push({
        role: "user",
        content: enhancedMessage,
        timestamp: new Date().toISOString(),
      });

      // Trim history if needed
      if (history.length > this.maxHistoryLength) {
        history = [
          history[0], // Keep system prompt
          ...history.slice(-this.maxHistoryLength + 1),
        ];
      }

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
          timestamp: new Date().toISOString(),
        });

        // Save conversation to Supabase
        if (supabase) {
          const { error } = await supabase.from("conversations").upsert(
            {
              user_id: userId,
              messages: history,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );

          if (error) {
            console.warn("Failed to save conversation:", error.message);
          }
        }

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
    } catch (error) {
      console.error("ProcessMessage Error:", error);
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

  async getConversationHistory(userId: string): Promise<Message[]> {
    if (supabase) {
      try {
        const { data: conversation, error } = await supabase
          .from("conversations")
          .select("messages")
          .eq("user_id", userId)
          .single();

        if (error && error.code !== "PGRST116") {
          console.warn("Supabase fetch error:", error.message);
        }

        if (conversation?.messages) {
          // Filter out system messages
          return (conversation.messages as Message[]).filter(
            (msg) => msg.role !== "system",
          );
        }
      } catch (err) {
        console.warn("Failed to fetch conversation history:", err);
      }
    }

    return [];
  }

  async clearHistory(userId: string) {
    if (supabase) {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("user_id", userId);

      if (error) {
        console.warn("Failed to clear history:", error.message);
      }
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
