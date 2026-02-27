import { Router } from "express";
import { ecoAgent } from "../ai/agent";
import { log } from "../index";

const router = Router();

// Rate limiting store
const rateLimit = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const limit = rateLimit.get(userId);

  if (!limit || now > limit.resetTime) {
    rateLimit.set(userId, { count: 1, resetTime: now + 60 * 1000 });
    return true;
  }

  if (limit.count >= 50) {
    return false;
  }

  limit.count++;
  return true;
};

// Chat endpoint
router.post("/chat", async (req, res) => {
  try {
    const { message, preferences } = req.body;
    const userId = req.user?.userId || req.ip || "anonymous";

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please try again later.",
      });
    }

    log(`AI Chat request from user: ${userId}`, "ai");

    const result = await ecoAgent.processMessage(message, userId, preferences);

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({
      error: "Failed to process message",
      reply: "I'm having trouble right now. Please try again in a moment.",
    });
  }
});

// Clear history endpoint
router.post("/chat/clear", async (req, res) => {
  try {
    const userId = req.user?.userId || req.ip || "anonymous";
    await ecoAgent.clearHistory(userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear history" });
  }
});

// Get stats endpoint (admin only)
router.get("/stats", async (req, res) => {
  // Check if user is admin (you can implement proper admin check)
  if (!req.user?.email?.includes("admin")) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const stats = ecoAgent.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to get stats" });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    openai: !!process.env.OPENAI_API_KEY,
  });
});

export default router;
