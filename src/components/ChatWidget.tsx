"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useTranslations, useLocale } from "next-intl";
import {
  XMarkIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  TrashIcon,
  MicrophoneIcon,
  StopIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import type { ChatToolHandler } from "@/lib/chat-tools";
import { blobToWav, blobToBase64, isWavSilent } from "@/lib/wav-encoder";
import { toSpeechLang } from "@/lib/locales";
import type {
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
  SpeechRecognitionInstance,
} from "@/lib/speech-recognition";
import { getSpeechRecognition } from "@/lib/speech-recognition";

// ── Chat message persistence ──────────────────────────────────────
// Key is intentionally locale-independent so the conversation survives
// language switches (which re-mount the entire [locale] layout tree).
export const CHAT_STORAGE_KEY = "chat-messages";

/** Read previously stored messages from sessionStorage (runs once on mount). */
function loadStoredMessages(): UIMessage[] | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: UIMessage[] = JSON.parse(raw);
    return parsed.length > 0 ? parsed : undefined;
  } catch {
    return undefined;
  }
}

// ── Dictation mode types ──────────────────────────────────────────
type DictationMode = "browser" | "server";
const DICTATION_STORAGE_KEY = "chat-dictation-mode";

/** Format seconds as m:ss for the recording timer. */
function formatRecordingTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Reusable chat panel — "I am the window", not the button that opens me.
 *
 * The parent controls visibility (`open` / `onClose`).
 * The parent also controls positioning (e.g. fixed bottom-right, sidebar,
 * modal — whatever the layout needs).  This component just fills whatever
 * container it's placed in.
 *
 * Wrap it in a positioned container to get floating-window behaviour:
 *
 * ```tsx
 * {isOpen && (
 *   <div className="fixed bottom-6 right-6 z-50 w-96 h-[32rem]">
 *     <ChatWidget open={isOpen} onClose={() => setIsOpen(false)} />
 *   </div>
 * )}
 * ```
 */
interface ChatWidgetProps {
  /** Whether the panel is visible. */
  open: boolean;
  /** Called when the user clicks the close button inside the panel. */
  onClose: () => void;
  /** Override the API endpoint (defaults to "/api/chat") */
  apiEndpoint?: string;
  /**
   * Client-side tool handlers keyed by tool name.
   * Each handler receives the tool input and returns a short result string
   * that the model will see as the tool output.
   *
   * Tools are declared on the server (no `execute`), so the model can call
   * them; the handlers here run on the client when the call arrives.
   */
  clientTools?: Record<string, ChatToolHandler>;
  /** Extra key-value pairs merged into every request body (e.g. theme state). */
  extraBody?: Record<string, unknown>;
  /** Explicit user-initiated reset action from the header bin button. */
  onReset?: () => void;
  /**
   * Fires once when the chat stream finishes and status returns to "ready".
   * Useful for deferring side-effects (e.g. navigation) until the model's
   * response has been fully streamed and persisted.
   */
  onReady?: () => void;
}

export default function ChatWidget({
  open,
  onClose,
  apiEndpoint = "/api/chat",
  clientTools,
  extraBody,
  onReset,
  onReady,
}: ChatWidgetProps) {
  const t = useTranslations();
  const locale = useLocale();
  const speechLang = useMemo(() => toSpeechLang(locale), [locale]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Dictation mode (browser vs server) ──────────────────────────
  const [dictationMode, setDictationMode] = useState<DictationMode>(() => {
    if (typeof window === "undefined") return "server";
    try {
      const stored = localStorage.getItem(DICTATION_STORAGE_KEY);
      if (stored === "browser" || stored === "server") return stored;
    } catch { /* private browsing / quota */ }
    return "server";
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Persist dictation mode preference
  useEffect(() => {
    try { localStorage.setItem(DICTATION_STORAGE_KEY, dictationMode); } catch { /* private browsing / quota */ }
  }, [dictationMode]);

  // ── Speech-to-text dictation (browser mode) ─────────────────────
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  // Tracks whether we *want* to be listening.  Chrome's SpeechRecognition
  // can fire `onend` at any time (silence, network blip, etc.) even with
  // `continuous: true`.  When this ref is true, the `onend` handler will
  // automatically restart the engine.
  const shouldListenRef = useRef(false);
  // Check once whether the browser supports the Web Speech API.
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechTemporarilyUnavailable, setSpeechTemporarilyUnavailable] =
    useState(false);
  useEffect(() => {
    const supported = getSpeechRecognition() !== null;
    setSpeechSupported(supported);
    // If "browser" was stored but this browser doesn't support it, auto-correct
    if (!supported) {
      setDictationMode((prev) => (prev === "browser" ? "server" : prev));
    }
  }, []);

  // ── Server-side recording state ─────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const streamRef = useRef<MediaStream | null>(null);
  const transcribeAbortRef = useRef<AbortController | null>(null);

  // ── Sound effects ────────────────────────────────────────────────
  const sentSoundRef = useRef<HTMLAudioElement | null>(null);
  const receivedSoundRef = useRef<HTMLAudioElement | null>(null);

  // Preload audio files once on mount (safe in "use client" components).
  useEffect(() => {
    sentSoundRef.current = new Audio("/sounds/message_sent.mp3");
    receivedSoundRef.current = new Audio("/sounds/new_notification.mp3");
  }, []);

  const playSent = useCallback(() => {
    const s = sentSoundRef.current;
    if (!s) return;
    s.currentTime = 0;
    s.play().catch(() => {});
  }, []);

  const playReceived = useCallback(() => {
    const s = receivedSoundRef.current;
    if (!s) return;
    s.currentTime = 0;
    s.play().catch(() => {});
  }, []);

  // ── Restore persisted conversation (computed once on mount) ──────
  const [storedMessages] = useState(loadStoredMessages);

  // Keep a ref so the onToolCall closure always sees the latest handlers
  // without needing to re-create the useChat config on every render.
  const clientToolsRef = useRef(clientTools);
  clientToolsRef.current = clientTools;

  // Serialise extraBody so useMemo only re-creates the transport when the
  // values actually change (object identity would change every render).
  const extraBodyKey = JSON.stringify(extraBody ?? {});

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: apiEndpoint,
        body: { locale, ...extraBody },
      }),
    [apiEndpoint, locale, extraBodyKey], // extraBodyKey is the stable proxy for extraBody
  );

  const { messages, sendMessage, regenerate, addToolOutput, status, error, clearError } = useChat({
    messages: storedMessages,
    transport,

    // After all client-side tool results are available, automatically send
    // them back so the model can generate a follow-up text response.
    sendAutomaticallyWhen: clientTools
      ? lastAssistantMessageIsCompleteWithToolCalls
      : undefined,

    async onToolCall({ toolCall }) {
      const handler = clientToolsRef.current?.[toolCall.toolName];
      if (!handler) return;

      try {
        const output = await handler(
          toolCall.input as Record<string, unknown>,
        );
        addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          output,
        });
      } catch {
        addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          state: "output-error",
          errorText: "Tool execution failed.",
        });
      }
    },

    // Play the notification sound when the assistant finishes a text response.
    // Skip aborts, disconnects, errors, and intermediate tool-call turns
    // (those will be resubmitted automatically by sendAutomaticallyWhen).
    onFinish({ isAbort, isDisconnect, isError, finishReason }) {
      if (isAbort || isDisconnect || isError) return;
      if (finishReason === "tool-calls") return;
      playReceived();
    },

    onError() {
      // handled via the `error` return value — no need to rethrow
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  // ── Persist messages to sessionStorage on every change ──────────
  // Declared BEFORE the status watcher so messages are saved before
  // onReady can trigger navigation (React runs effects in order).
  useEffect(() => {
    try {
      if (messages.length > 0) {
        sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
      } else {
        sessionStorage.removeItem(CHAT_STORAGE_KEY);
      }
    } catch { /* private browsing / quota */ }
  }, [messages]);

  // ── Notify parent when a stream *truly* completes (active → ready) ─
  // Guard: skip the intermediate "ready" after a tool-call message —
  // sendAutomaticallyWhen is about to fire another round-trip.  Only
  // signal when the final text response is done.
  const prevStatusRef = useRef(status);
  useEffect(() => {
    const wasActive =
      prevStatusRef.current === "streaming" ||
      prevStatusRef.current === "submitted";
    prevStatusRef.current = status;
    if (!wasActive || status !== "ready") return;
    // If the last assistant message is a complete tool call, the auto-send
    // will resubmit momentarily — don't fire onReady yet.
    if (clientTools && lastAssistantMessageIsCompleteWithToolCalls({ messages })) return;
    onReady?.();
  }, [status, messages, clientTools, onReady]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage({ text: trimmed });
    playSent();
    setInput("");

    // Reset textarea height after sending
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  // Auto-resize textarea to fit content (up to max-h cap)
  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // Enter sends, Shift+Enter inserts a newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // ── Speech-to-text helpers ─────────────────────────────────────

  // Mutable ref that holds the latest "committed" (final) transcript
  // across recognition restarts so we don't lose words.
  const committedRef = useRef("");

  /** Stop the current recognition session intentionally. */
  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  /** Tear down any in-progress server recording / transcription. */
  const cleanupRecording = useCallback(() => {
    transcribeAbortRef.current?.abort();
    transcribeAbortRef.current = null;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      try { mediaRecorderRef.current.stop(); } catch { /* already stopped */ }
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsTranscribing(false);
    setRecordingSeconds(0);
  }, []);

  // Ensure all dictation is stopped when the widget closes or unmounts.
  useEffect(() => {
    if (!open) {
      stopListening();
      cleanupRecording();
    }
    return () => {
      stopListening();
      cleanupRecording();
    };
  }, [open, stopListening, cleanupRecording]);

  /**
   * Create, configure, and start a SpeechRecognition instance.
   * Extracted so both `startListening` and the auto-restart in
   * `onend` can share the same setup logic.
   */
  const bootRecognition = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = speechLang;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const trimmed = transcript.trim();
          if (trimmed) {
            committedRef.current +=
              (committedRef.current ? " " : "") + trimmed;
          }
        } else {
          interim += transcript;
        }
      }

      // Show committed + interim preview in the textarea
      const preview = interim
        ? committedRef.current +
          (committedRef.current ? " " : "") +
          interim
        : committedRef.current;

      setInput(preview);
      // Auto-grow the textarea to fit the dictated text
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      });
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Helpful during integration/testing: shows why no text is emitted.
      console.warn("[chat] SpeechRecognition error:", event.error);
      // Fatal errors that mean we should truly stop.
      const fatal = new Set([
        "not-allowed",
        "service-not-allowed",
        "language-not-supported",
        "network",
      ]);
      if (fatal.has(event.error)) {
        shouldListenRef.current = false;
        if (event.error === "network") {
          // Constructor exists but backend speech service is unreachable.
          // Disable dictation button for this page session to avoid a retry loop.
          setSpeechTemporarilyUnavailable(true);
        }
      }
      // Non-fatal errors (no-speech, aborted, audio-capture)
      // will trigger `onend`, which will auto-restart if shouldListenRef
      // is still true.
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      // Auto-restart if we haven't explicitly stopped.
      if (shouldListenRef.current) {
        try {
          bootRecognition();
        } catch {
          shouldListenRef.current = false;
          setIsListening(false);
        }
        return;
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [speechLang]);

  /** Start browser speech recognition and stream results into the textarea. */
  const startListening = useCallback(() => {
    if (!getSpeechRecognition() || speechTemporarilyUnavailable) return;

    // Seed the committed buffer with whatever text is already in the input
    committedRef.current = input;
    shouldListenRef.current = true;
    setIsListening(true);

    bootRecognition();
  }, [input, bootRecognition, speechTemporarilyUnavailable]);

  // ── Server-side recording helpers ──────────────────────────────

  /** Start capturing audio via MediaRecorder (server transcription mode). */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType,
        });
        audioChunksRef.current = [];

        // Release mic
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        if (blob.size === 0) return;

        setIsTranscribing(true);
        try {
          const wavBlob = await blobToWav(blob);

          // ── Silence / too-short guard ───────────────────────────
          // Whisper-family models hallucinate plausible text on silent
          // audio.  Catch it client-side to save an API round-trip.
          const silent = await isWavSilent(wavBlob);
          if (silent) {
            console.log("[chat] Recording was silent — skipping transcription");
            return; // finally block resets isTranscribing
          }

          const base64 = await blobToBase64(wavBlob);

          const controller = new AbortController();
          transcribeAbortRef.current = controller;

          const res = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audio: base64,
              mimeType: "audio/wav",
              locale,
            }),
            signal: controller.signal,
          });

          const data = await res.json();
          if (data.text) {
            setInput((prev) => {
              const separator = prev.trim() ? " " : "";
              return prev + separator + data.text;
            });
            // Auto-grow textarea
            requestAnimationFrame(() => {
              const el = inputRef.current;
              if (!el) return;
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            });
          } else if (data.error) {
            console.warn("[chat] Transcription failed:", data.error);
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
          console.warn("[chat] Transcription error:", err);
        } finally {
          transcribeAbortRef.current = null;
          setIsTranscribing(false);
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.warn("[chat] Microphone access denied:", err);
    }
  }, [locale]);

  /** Stop the MediaRecorder — triggers onstop → transcribe flow. */
  const stopRecording = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  if (!open) return null;

  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-xl border-b border-gray-200 bg-accent-600 px-4 py-3 dark:border-gray-700 dark:bg-accent-700">
        <h2 className="text-sm font-semibold text-white">{t("Chat.title")}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="text-white/80 hover:text-white transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("Chat.clearChat")}
            disabled={isLoading}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className={`transition-colors focus:outline-none ${
              settingsOpen
                ? "text-white"
                : "text-white/80 hover:text-white"
            }`}
            aria-label={t("Chat.settings")}
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors focus:outline-none"
            aria-label={t("Chat.closeChat")}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {settingsOpen && (
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-900/40">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {t("Chat.dictationMode")}
            </label>
            <select
              value={dictationMode}
              onChange={(e) => {
                const next = e.target.value as DictationMode;
                // Stop any active session before switching
                if (isListening) stopListening();
                if (isRecording) stopRecording();
                setDictationMode(next);
              }}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="server">{t("Chat.dictationServer")}</option>
              <option
                value="browser"
                disabled={!speechSupported || speechTemporarilyUnavailable}
              >
                {t("Chat.dictationBrowser")}
                {(!speechSupported || speechTemporarilyUnavailable)
                  ? ` — ${t("Chat.dictationBrowserUnavailable")}`
                  : ""}
              </option>
            </select>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-8">
            {t("Chat.emptyState")}
          </p>
        )}

        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <div
              key={message.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? "bg-accent-600 text-white dark:bg-accent-500"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                {message.parts.map((part, i) => {
                  if (part.type === "text") {
                    return <span key={i}>{part.text}</span>;
                  }
                  return null;
                })}
              </div>
            </div>
          );
        })}

        {isLoading &&
          messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">.</span>
                  <span
                    className="animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  >
                    .
                  </span>
                  <span
                    className="animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  >
                    .
                  </span>
                </span>
              </div>
            </div>
          )}

        {/* Error banner with retry */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/30">
            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
              <span className="flex-1">
                {t("Chat.errorMessage")}
              </span>
              <button
                onClick={() => {
                  clearError();
                  regenerate();
                }}
                className="inline-flex items-center gap-1 shrink-0 rounded-md px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
                aria-label={t("Chat.retry")}
              >
                <ArrowPathIcon className="h-3.5 w-3.5" />
                {t("Chat.retry")}
              </button>
              <button
                onClick={clearError}
                className="shrink-0 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300"
                aria-label={t("Chat.dismissError")}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-gray-200 px-3 py-2 dark:border-gray-700"
      >
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            autoResize();
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? t("Chat.listening")
              : isRecording
                ? t("Chat.recording", { time: formatRecordingTime(recordingSeconds) })
                : isTranscribing
                  ? t("Chat.transcribing")
                  : t("Chat.placeholder")
          }
          disabled={isLoading || isTranscribing}
          className={`min-w-0 flex-1 resize-none rounded-md border bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 disabled:opacity-60 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors max-h-32 overflow-y-auto ${
            isListening || isRecording
              ? "border-red-400 focus:border-red-500 focus:ring-red-400 dark:border-red-500"
              : "border-gray-300 focus:border-accent-500 focus:ring-accent-500 dark:border-gray-600"
          }`}
        />
        {/* Mic button — dispatches to browser or server dictation mode */}
        <button
          type="button"
          onClick={() => {
            if (dictationMode === "browser") {
              if (isListening) stopListening(); else startListening();
            } else {
              if (isRecording) stopRecording(); else startRecording();
            }
          }}
          disabled={
            isLoading ||
            isTranscribing ||
            (dictationMode === "browser" &&
              (!speechSupported || speechTemporarilyUnavailable))
          }
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
            isListening || isRecording
              ? "bg-red-600 text-white hover:bg-red-700"
              : isTranscribing
                ? "bg-amber-500 text-white animate-pulse"
                : "border border-gray-300 text-gray-500 hover:text-accent-600 hover:border-accent-400 dark:border-gray-600 dark:text-gray-400 dark:hover:text-accent-400 dark:hover:border-accent-500"
          }`}
          aria-label={
            isListening
              ? t("Chat.stopListening")
              : isRecording
                ? t("Chat.stopRecording")
                : isTranscribing
                  ? t("Chat.transcribing")
                  : dictationMode === "browser"
                    ? t("Chat.startListening")
                    : t("Chat.startRecording")
          }
        >
          {isListening || isRecording ? (
            <StopIcon className="h-4 w-4" />
          ) : (
            <MicrophoneIcon className="h-4 w-4" />
          )}
        </button>
        {/* Send button */}
        <button
          type="submit"
          disabled={isLoading || !input.trim() || isRecording || isTranscribing}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-accent-500 dark:hover:bg-accent-600 transition-colors focus:outline-none"
          aria-label={t("Chat.sendMessage")}
        >
          <PaperAirplaneIcon className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
