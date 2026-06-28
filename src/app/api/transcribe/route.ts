import { generateText } from "ai";
import { openrouter } from "@/lib/openrouter";
import { supportedLocaleCodes, localeToLanguageName } from "@/lib/locales";

/**
 * Dedicated audio-to-text transcription endpoint.
 *
 * Uses `openai/gpt-audio` on OpenRouter — a model purpose-built for audio.
 * The chat route keeps using `openai/gpt-4o-mini` for text, so neither
 * model's quality is compromised.
 */

const TRANSCRIPTION_MODEL = "openai/gpt-audio";

const ALLOWED_MIME_TYPES = new Set([
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/webm",
  "audio/ogg",
]);

export async function POST(req: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json(
      { error: "Transcription is not configured." },
      { status: 503 },
    );
  }

  try {
    const body = await req.json();
    const { audio, mimeType, locale: rawLocale } = body as {
      audio?: string;
      mimeType?: string;
      locale?: string;
    };

    // ── Validation ────────────────────────────────────────────────
    if (!audio || typeof audio !== "string" || audio.length === 0) {
      return Response.json(
        { error: "Missing or empty audio data." },
        { status: 400 },
      );
    }

    if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
      return Response.json(
        { error: `Unsupported audio format: ${mimeType}` },
        { status: 400 },
      );
    }

    const locale =
      typeof rawLocale === "string" && supportedLocaleCodes.has(rawLocale)
        ? rawLocale
        : "en";

    const languageName = localeToLanguageName[locale] ?? "English";

    // ── Transcribe via OpenRouter audio model ─────────────────────
    const result = await generateText({
      model: openrouter(TRANSCRIPTION_MODEL),
      messages: [
        {
          role: "system",
          content:
            `Transcribe the following audio exactly in ${languageName}. ` +
            "Return ONLY the transcription text — no preamble, no explanation, no formatting. " +
            "If the audio contains only silence, background noise, or no discernible speech, " +
            "return exactly the string [SILENCE] and nothing else.",
        },
        {
          role: "user",
          content: [
            {
              type: "file",
              data: audio,        // raw base64
              mediaType: mimeType,
            },
            {
              type: "text",
              text: "Transcribe this audio.",
            },
          ],
        },
      ],
    });

    const raw = result.text?.trim() ?? "";

    // The prompt asks the model to return "[SILENCE]" for empty audio.
    // Treat it (and common close variants) as no speech detected.
    const text = /^\[?\s*SILENCE\s*\]?$/i.test(raw) ? "" : raw;

    return Response.json({ text });
  } catch (error: unknown) {
    console.error("[transcribe] Error:", error);

    const message =
      error instanceof Error ? error.message : "Transcription failed.";

    return Response.json(
      { error: message.includes("authenticate")
          ? "Unable to reach the transcription service."
          : "Transcription failed. Please try again." },
      { status: 502 },
    );
  }
}
