import { z } from "zod";
import { ACCENT_COLOR_KEYS, COLOR_SCHEME_KEYS } from "@/types/theme";
import { LOCALE_KEYS } from "@/lib/locales";

/**
 * Client-side chat tool definitions.
 *
 * These are registered on the server (without `execute`) so the LLM can
 * invoke them, and handled on the client via the `onToolCall` callback
 * in `useChat`.
 *
 * To add a new client-side tool:
 *   1. Add its schema + description here.
 *   2. Spread `clientToolDefs` into `streamText({ tools })` in the API route.
 *   3. Provide a matching handler via the `clientTools` prop on `<ChatWidget>`.
 */

export const setThemeInputSchema = z.object({
  accent: z
    .enum(ACCENT_COLOR_KEYS)
    .optional()
    .describe("Gallery accent color"),
  colorScheme: z
    .enum(COLOR_SCHEME_KEYS)
    .optional()
    .describe("Color scheme / appearance preference"),
});

export const getThemeInputSchema = z.object({});

export const setLanguageInputSchema = z.object({
  locale: z
    .enum(LOCALE_KEYS)
    .describe("Target locale code (e.g. \"en\", \"de\", \"es\")"),
});

export const getLanguageInputSchema = z.object({});

/** Tool definitions passed to `streamText`. No `execute` → client-side. */
export const clientToolDefs = {
  setTheme: {
    description:
      "Change the gallery's visual theme (accent color and/or color scheme). " +
      "Call when the visitor asks to change colors, switch to dark mode, etc.",
    inputSchema: setThemeInputSchema,
  },
  getTheme: {
    description:
      "Return the gallery's current visual theme (accent color and resolved color scheme). " +
      "Call to check the current theme before suggesting or confirming changes.",
    inputSchema: getThemeInputSchema,
  },
  setLanguage: {
    description:
      "Switch the gallery's display language. The page will navigate to the " +
      "new locale and the chat conversation will be preserved. " +
      "Call when the visitor asks to change language.",
    inputSchema: setLanguageInputSchema,
  },
  getLanguage: {
    description:
      "Return the gallery's current display language (locale code and name). " +
      "Call to check the current language before suggesting or confirming changes.",
    inputSchema: getLanguageInputSchema,
  },
} as const;

/**
 * Handler for a single client-side tool.
 * Receives the tool input and returns a short result message for the model.
 */
export type ChatToolHandler = (
  input: Record<string, unknown>,
) => string | Promise<string>;
