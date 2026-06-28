import "server-only";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

/**
 * Server-side OpenRouter client.
 * Reads the API key from the OPENROUTER_API_KEY environment variable.
 *
 * Usage (server only):
 *   import { openrouter } from "@/lib/openrouter";
 *   const model = openrouter("openai/gpt-4o-mini");
 */
export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});
