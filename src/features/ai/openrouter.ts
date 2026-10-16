import "server-only";

import { z } from "zod";

import { serverEnv } from "@/env.server";

const completionSchema = z.object({
  model: z.string().optional(),
  choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })).min(1),
});

export interface Completion {
  text: string;
  model: string;
}

/**
 * complete sends one chat turn to OpenRouter. `models` makes OpenRouter fall
 * back to the next model when the first is rate limited or down.
 */
export async function complete(system: string, user: string): Promise<Completion> {
  if (!serverEnv.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not set");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${serverEnv.OPENROUTER_API_KEY}`,
      "content-type": "application/json",
      "x-title": "SwaraMatch prototype",
    },
    body: JSON.stringify({
      models: serverEnv.OPENROUTER_MODELS,
      max_tokens: 1200,
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok)
    throw new Error(
      `OpenRouter answered ${String(res.status)}: ${(await res.text()).slice(0, 200)}`,
    );
  const body = completionSchema.parse(await res.json());
  const text = body.choices[0]?.message.content?.trim() ?? "";
  if (!text) throw new Error("OpenRouter returned an empty answer");
  return { text, model: body.model ?? "unknown" };
}
