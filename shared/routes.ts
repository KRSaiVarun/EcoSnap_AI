import { z } from "zod";
import { decisions, insertDecisionSchema } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: "POST" as const,
      path: "/api/auth/register" as const,
      input: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
      }),
      responses: {
        201: z.object({
          id: z.string(),
          email: z.string(),
          name: z.string(),
          token: z.string(),
          sustainabilityScore: z.number(),
        }),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    login: {
      method: "POST" as const,
      path: "/api/auth/login" as const,
      input: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      responses: {
        200: z.object({
          id: z.string(),
          email: z.string(),
          name: z.string(),
          token: z.string(),
          sustainabilityScore: z.number(),
        }),
        401: z.object({ message: z.string() }),
        500: errorSchemas.internal,
      },
    },
    profile: {
      method: "GET" as const,
      path: "/api/auth/profile" as const,
      responses: {
        200: z.object({
          id: z.string(),
          email: z.string(),
          name: z.string(),
          sustainabilityScore: z.number(),
          totalDecisions: z.number(),
          createdAt: z.string(),
        }),
        401: z.object({ message: z.string() }),
        500: errorSchemas.internal,
      },
    },
  },
  decisions: {
    analyze: {
      method: "POST" as const,
      path: "/api/decisions/analyze" as const,
      input: z.object({
        decision: z.string(),
      }),
      responses: {
        200: insertDecisionSchema,
        400: errorSchemas.validation,
        401: z.object({ message: z.string() }),
        500: errorSchemas.internal,
      },
    },
    list: {
      method: "GET" as const,
      path: "/api/decisions" as const,
      responses: {
        200: z.array(z.custom<typeof decisions.$inferSelect>()),
        401: z.object({ message: z.string() }),
        500: errorSchemas.internal,
      },
    },
  },
  chat: {
    message: {
      method: "POST" as const,
      path: "/api/chat" as const,
      input: z.object({
        message: z.string(),
        preferences: z
          .object({
            location: z.string().optional(),
            lifestyle: z.string().optional(),
            budget: z.string().optional(),
          })
          .optional(),
      }),
      responses: {
        200: z.object({
          reply: z.string(),
          model: z.string(),
          carbon_impact: z
            .object({
              choice: z.string(),
              co2_kg: z.number(),
              alternative: z.string(),
              alt_co2_kg: z.number(),
              co2_saved: z.number(),
            })
            .optional(),
        }),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    history: {
      method: "GET" as const,
      path: "/api/chat/history" as const,
      responses: {
        200: z.object({
          messages: z.array(
            z.object({
              role: z.string(),
              content: z.string(),
              timestamp: z.string(),
            }),
          ),
        }),
        500: errorSchemas.internal,
      },
    },
    clear: {
      method: "POST" as const,
      path: "/api/chat/clear" as const,
      responses: {
        200: z.object({
          message: z.string(),
        }),
        500: errorSchemas.internal,
      },
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type AnalyzeDecisionRequest = z.infer<
  typeof api.decisions.analyze.input
>;
export type AnalyzeDecisionResponse = z.infer<
  (typeof api.decisions.analyze.responses)[200]
>;
export type DecisionsListResponse = z.infer<
  (typeof api.decisions.list.responses)[200]
>;
