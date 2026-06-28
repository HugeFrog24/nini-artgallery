/**
 * Web Speech API type shims and helpers.
 *
 * The Web Speech API isn't in lib.dom.d.ts yet.  We define a minimal
 * interface so TypeScript is happy without pulling in a package.
 */

// ── Type shims ────────────────────────────────────────────────────

export interface SpeechRecognitionEvent extends Event {
  // eslint-disable-next-line no-undef
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

// ── Helpers ───────────────────────────────────────────────────────

/** Get the SpeechRecognition constructor if the browser supports it. */
export function getSpeechRecognition():
  | (new () => SpeechRecognitionInstance)
  | null {
  if (typeof window === "undefined") return null;
   
  const SR =
    (window as any).SpeechRecognition ?? // eslint-disable-line @typescript-eslint/no-explicit-any
    (window as any).webkitSpeechRecognition; // eslint-disable-line @typescript-eslint/no-explicit-any
  return SR ?? null;
}
