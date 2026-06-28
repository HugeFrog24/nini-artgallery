import { promises as fs } from "fs";
import { streamText, convertToModelMessages } from "ai";
import { openrouter } from "@/lib/openrouter";
import { getArtistData } from "@/lib/artist-data";
import { mergeArtworksWithTranslations } from "@/lib/artworks";
import { supportedLocaleCodes, localeToLanguageName, LOCALE_KEYS } from "@/lib/locales";
import { clientToolDefs } from "@/lib/chat-tools";
import { getTenantIdFromRequest, tenantMessagePath } from "@/lib/tenant";
import {
  ACCENT_COLOR_KEYS,
  COLOR_SCHEME_KEYS,
  parseClientTheme,
} from "@/types/theme";

/**
 * The model believes the chat UI can only display this many characters.
 * Lower = punchier replies. This is a soft hint, not a hard truncation.
 */
const CHAT_MAX_CHARS = 256;

export async function POST(req: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("[chat] OPENROUTER_API_KEY is not set — chat disabled");
    return new Response(
      JSON.stringify({ error: "Chat is not configured yet." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  // Resolve tenant from Host header
  const tenantId = await getTenantIdFromRequest(req);
  if (!tenantId) {
    return new Response(JSON.stringify({ error: "Unknown tenant." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { messages, locale: rawLocale = "en", currentTheme: rawTheme } = await req.json();

    // Validate locale — fall back to English if unrecognised
    const locale = supportedLocaleCodes.has(rawLocale) ? rawLocale : "en";

    // Validate client-supplied theme — enum whitelist, safe defaults
    const currentTheme = parseClientTheme(rawTheme);

    // Load locale-specific artwork translations from tenant directory
    const translationsRaw = await fs.readFile(
      tenantMessagePath("artworks", tenantId, `${locale}.json`),
      "utf-8",
    );
    const translationsData = JSON.parse(translationsRaw);

    const t = (key: string): string => {
      const parts = key.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let value: any = translationsData;
      for (const part of parts) {
        value = value?.[part];
      }
      return typeof value === "string" ? value : key;
    };

    // Load artist data in the user's locale
    const artist = await getArtistData(tenantId, locale);

    // Build a compact catalog string for the system prompt
    const sections = await mergeArtworksWithTranslations(tenantId, t);
    const catalog = sections
      .map(
        (s) =>
          `${s.title}: ` +
          s.artworks
            .map((a) => `"${a.title}" (${a.medium}, ${a.dimensions}, ${a.year})`)
            .join("; "),
      )
      .join("\n");

    const languageName = localeToLanguageName[locale] ?? "English";

    const result = streamText({
      model: openrouter("openai/gpt-4o-mini"),
      system:
        `You ARE ${artist.name}, the artist whose gallery the visitor is browsing. ` +
        `Always speak in first person. When greeting a visitor or starting a conversation, ` +
        `introduce yourself by name (${artist.name}) so they know who they're talking to.\n\n` +
        `About you: ${artist.description}\n\n` +
        `Your gallery catalog:\n${catalog}\n\n` +
        "Use this catalog when visitors ask about your artworks. " +
        "Share your passion for art, your creative process, techniques, " +
        "and the stories behind your pieces. Keep responses concise and warm. " +
        "If asked about something unrelated to art, gently steer the " +
        "conversation back to your art.\n\n" +
        `The gallery currently uses the "${currentTheme.accent}" accent color ` +
        `and "${currentTheme.resolvedColorScheme}" appearance ` +
        `(user preference: "${currentTheme.colorScheme}").\n\n` +
        "You have a `setTheme` tool that can change the gallery's accent color " +
        `(${ACCENT_COLOR_KEYS.join(", ")}) and color scheme (${COLOR_SCHEME_KEYS.join(", ")}). ` +
        "Use it when the visitor asks to change the appearance. " +
        "After calling the tool, confirm the change briefly. " +
        "You also have a `getTheme` tool that returns the current theme state — " +
        "call it to verify the theme after making changes.\n\n" +
        "You have a `setLanguage` tool that can switch the gallery's display language " +
        `(${LOCALE_KEYS.join(", ")}). ` +
        "Use it when the visitor asks to change language. " +
        "After calling the tool, confirm the change briefly. " +
        "You also have a `getLanguage` tool that returns the current locale — " +
        "call it to check before suggesting or confirming changes.\n\n" +
        `The chat interface is very small and can only display ${CHAT_MAX_CHARS} characters per message. ` +
        "Keep every reply within that limit — be concise and conversational.\n\n" +
        `Always respond in the user's language (${languageName}).`,
      messages: await convertToModelMessages(messages),
      tools: clientToolDefs,
      onError({ error }) {
        console.error("[chat] Stream error:", error);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    console.error("[chat] API error:", error);

    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    // Strip internal details — only surface safe, generic info
    const safeMessage = message.includes("authenticate")
      ? "Unable to reach the AI service. Please try again later."
      : "Something went wrong. Please try again.";

    return new Response(JSON.stringify({ error: safeMessage }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
