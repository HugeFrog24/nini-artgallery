"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import ChatWidget, { CHAT_STORAGE_KEY } from "./ChatWidget";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTheme } from "./theme/ThemeProvider";
import type { AccentColor, ColorScheme } from "@/types/theme";
import type { ChatToolHandler } from "@/lib/chat-tools";
import { supportedLocaleCodes, getLocaleConfig } from "@/lib/locales";

/**
 * Layout-level chat bubble button + panel.
 * Sits next to the ThemeSelector in the fixed bottom-right corner.
 * Owns the open/close state; delegates everything else to ChatWidget.
 *
 * Also bridges client-side chat tools (e.g. `setTheme`) to app state
 * so the AI can change the gallery's appearance on request.
 */
const CHAT_OPEN_KEY = "chat-open";

export default function ChatToggle() {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return sessionStorage.getItem(CHAT_OPEN_KEY) === "1"; } catch { return false; }
  });
  const [chatSessionKey, setChatSessionKey] = useState(0);

  // Persist open/closed state so the panel survives locale switches.
  useEffect(() => {
    try {
      if (isOpen) sessionStorage.setItem(CHAT_OPEN_KEY, "1");
      else sessionStorage.removeItem(CHAT_OPEN_KEY);
    } catch { /* private browsing / quota */ }
  }, [isOpen]);

  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setAccentColor, setColorScheme, resolvedColorScheme } =
    useTheme();

  // ── Deferred locale navigation ──────────────────────────────────
  // The setLanguage tool handler stashes the target here; the actual
  // router.replace fires only after the model finishes streaming its
  // confirmation (via the onReady callback from ChatWidget).
  const pendingLocaleRef = useRef<string | null>(null);

  const handleReady = useCallback(() => {
    const target = pendingLocaleRef.current;
    if (!target) return;
    pendingLocaleRef.current = null;
    router.replace(pathname, { locale: target });
  }, [router, pathname]);

  /** Current theme state sent to the server on every request. */
  const extraBody = useMemo(
    () => ({
      currentTheme: {
        accent: theme.accent,
        colorScheme: theme.colorScheme,
        resolvedColorScheme,
      },
    }),
    [theme.accent, theme.colorScheme, resolvedColorScheme],
  );

  /** Client-side tool handlers passed to ChatWidget. */
  const clientTools = useMemo<Record<string, ChatToolHandler>>(
    () => ({
      setTheme: (input) => {
        const { accent, colorScheme } = input as {
          accent?: AccentColor;
          colorScheme?: ColorScheme;
        };

        if (accent) setAccentColor(accent);
        if (colorScheme) setColorScheme(colorScheme);

        const changes: string[] = [];
        if (accent) changes.push(`accent → ${accent}`);
        if (colorScheme) changes.push(`color scheme → ${colorScheme}`);

        return changes.length > 0
          ? `Theme updated: ${changes.join(", ")}.`
          : "No changes — neither accent nor colorScheme was provided.";
      },
      getTheme: () => {
        return JSON.stringify({
          accent: theme.accent,
          colorScheme: theme.colorScheme,
          resolvedColorScheme,
        });
      },
      setLanguage: (input) => {
        const { locale: target } = input as { locale?: string };
        if (!target || !supportedLocaleCodes.has(target)) {
          const supported = [...supportedLocaleCodes].join(", ");
          return `Unsupported locale "${target}". Supported: ${supported}.`;
        }
        if (target === locale) {
          const config = getLocaleConfig(target);
          return `Already using ${config?.name ?? target} (${target}).`;
        }
        // Stash the target — actual navigation is deferred until the model
        // finishes streaming its confirmation (via onReady).
        pendingLocaleRef.current = target;
        const config = getLocaleConfig(target);
        return `Language switched to ${config?.name ?? target} (${target}).`;
      },
      getLanguage: () => {
        const config = getLocaleConfig(locale);
        return JSON.stringify({
          locale,
          name: config?.name ?? locale,
        });
      },
    }),
    [setAccentColor, setColorScheme, theme.accent, theme.colorScheme, resolvedColorScheme, locale],
  );

  return (
    <div className="fixed bottom-6 right-20 z-50">
      {/* Bubble button — visible when panel is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 bg-accent-500 shadow-lg rounded-full border border-accent-600 hover:bg-accent-600 hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 flex items-center justify-center"
          aria-label={t("Chat.openChat")}
        >
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Chat panel — keep mounted so close does not reset context */}
      <div
        className={`absolute bottom-0 right-0 w-80 sm:w-96 max-w-[calc(100vw-6rem)] ${
          isOpen ? "" : "pointer-events-none"
        }`}
        style={{ height: "min(32rem, calc(100vh - 6rem))" }}
      >
        <ChatWidget
          key={`chat-session-${chatSessionKey}`}
          open={isOpen}
          onClose={() => setIsOpen(false)}
          onReset={() => {
            try { sessionStorage.removeItem(CHAT_STORAGE_KEY); } catch { /* private browsing */ }
            setChatSessionKey((prev) => prev + 1);
          }}
          clientTools={clientTools}
          extraBody={extraBody}
          onReady={handleReady}
        />
      </div>
    </div>
  );
}
