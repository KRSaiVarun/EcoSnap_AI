import {
    api,
    type AnalyzeDecisionRequest
} from "@shared/routes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

// Helper to handle API errors
async function handleResponse<T>(
  res: Response,
  schema: z.ZodType<T>,
): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "An error occurred");
  }
  const data = await res.json();
  return schema.parse(data);
}

// POST /api/decisions/analyze
export function useAnalyzeDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AnalyzeDecisionRequest) => {
      const res = await fetch(api.decisions.analyze.path, {
        method: api.decisions.analyze.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(res, api.decisions.analyze.responses[200]);
    },
    onSuccess: () => {
      // Invalidate the list so the new decision appears in history immediately
      queryClient.invalidateQueries({ queryKey: [api.decisions.list.path] });
    },
  });
}

// GET /api/decisions
export function useDecisions() {
  return useQuery({
    queryKey: [api.decisions.list.path],
    queryFn: async () => {
      const res = await fetch(api.decisions.list.path);
      return handleResponse(res, api.decisions.list.responses[200]);
    },
  });
}

// POST /api/chat
export function useChat() {
  return useMutation({
    mutationFn: async (data: { message: string; preferences?: any }) => {
      const res = await fetch(api.chat.message.path, {
        method: api.chat.message.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(res, api.chat.message.responses[200]);
    },
  });
}

// GET /api/chat/history
export function useChatHistory() {
  return useQuery({
    queryKey: [api.chat.history.path],
    queryFn: async () => {
      const res = await fetch(api.chat.history.path);
      return handleResponse(res, z.object({ messages: z.array(z.any()) }));
    },
  });
}
