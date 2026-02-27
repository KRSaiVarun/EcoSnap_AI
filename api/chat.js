import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { ecoAgent } from "../server/aiAgent.js";

// Initialize Redis for rate limiting
const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "60 s"),
  analytics: true,
});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, preferences } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Rate limiting
    const identifier =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous";

    const { success, limit, reset, remaining } =
      await ratelimit.limit(identifier);

    if (!success) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        limit,
        reset,
        remaining,
      });
    }

    // Process message with eco agent
    const result = await ecoAgent.processMessage(
      message,
      identifier,
      preferences,
    );

    // Log analytics (optional)
    if (process.env.ANALYTICS_ENABLED === "true") {
      await logAnalytics(identifier, message, result);
    }

    return res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
      rate_limit: {
        limit,
        remaining,
        reset,
      },
    });
  } catch (error) {
    console.error("API Error:", error);

    // Fallback response
    return res.status(500).json({
      success: false,
      reply:
        "I'm having trouble connecting. Here's a quick tip: Try reducing single-use plastics in your daily routine!",
      suggestions: [
        "Use a reusable water bottle",
        "Bring your own shopping bags",
        "Choose products with minimal packaging",
      ],
      confidence: 0.6,
    });
  }
}

// Clear history endpoint
export async function clearHandler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await ecoAgent.clearHistory();
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to clear history" });
  }
}

// Analytics helper
async function logAnalytics(userId, query, result) {
  // Implement your analytics logging here
  // Could use Vercel Analytics, Mixpanel, etc.
}
