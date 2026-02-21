import { z } from "zod";
import { insertDecisionSchema, decisions } from "./schema";

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
        500: errorSchemas.internal,
      },
    },
    list: {
      method: "GET" as const,
      path: "/api/decisions" as const,
      responses: {
        200: z.array(z.custom<typeof decisions.$inferSelect>()),
        500: errorSchemas.internal,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
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

export type AnalyzeDecisionRequest = z.infer<typeof api.decisions.analyze.input>;
export type AnalyzeDecisionResponse = z.infer<typeof api.decisions.analyze.responses[200]>;
export type DecisionsListResponse = z.infer<typeof api.decisions.list.responses[200]>;
