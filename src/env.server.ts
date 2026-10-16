import "server-only";

import { z } from "zod";

// Server configuration. `server-only` makes any import from a client
// component a build error, so nothing here can leak into the bundle.
// An empty string counts as unset; construction names every bad variable.
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Optional: without a key the app runs fully, minus AI tailoring.
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  // Comma-separated OpenRouter models, tried in order. Free model ids churn;
  // check https://openrouter.ai/api/v1/models before changing them.
  OPENROUTER_MODELS: z
    .string()
    .default("google/gemma-4-26b-a4b-it:free,nvidia/nemotron-3.5-lightning:free")
    .transform((v) =>
      v
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
    ),
  SERVICE_VERSION: z.string().min(1).default("dev"),
});

export type ServerEnv = z.infer<typeof serverSchema>;

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const present = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== ""),
  );
  const parsed = serverSchema.safeParse(present);
  if (!parsed.success) {
    throw new Error(`invalid environment:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

export const serverEnv: ServerEnv = parseServerEnv(process.env);
