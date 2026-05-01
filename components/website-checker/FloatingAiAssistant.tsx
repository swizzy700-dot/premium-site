"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LighthouseClientAudit, LighthouseScoreKey } from "@/lib/website-checker/lighthouse/types";
import { buildAssistantReply } from "./ai/aiAssistantEngine";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const LAST_AUDIT_KEY = "website-checker:last-audit";

function loadLastAudit(): LighthouseClientAudit | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_AUDIT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LighthouseClientAudit;
  } catch {
    return null;
  }
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function FloatingAiAssistant() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [audit, setAudit] = useState<LighthouseClientAudit | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setAudit(loadLastAudit());
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const quickAction = useCallback(
    (intent: "requestQuotation" | "talkToExpert" | "viewServices", opts?: { navigateTo?: string }) => {
      const text =
        intent === "requestQuotation"
          ? "Request Quotation"
          : intent === "talkToExpert"
            ? "Talk to Expert"
            : "View Services";

      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "user", content: text },
      ]);

      setDraft("");
      setIsTyping(true);
      const reply = buildAssistantReply({ message: text, audit });
      const assistantContent =
        reply.reply +
        "\n\n" +
        `Next step: ${
          intent === "requestQuotation"
            ? "Get a professional quote"
            : intent === "talkToExpert"
              ? "Speak with an expert"
              : "Explore services"
        }.`;

      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: "assistant", content: assistantContent },
        ]);
        if (opts?.navigateTo) router.push(opts.navigateTo);
      }, 650);
    },
    [audit, router],
  );

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent).detail as { focus?: "quotation" | "expert" | "services" } | undefined;
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);

      // If we have no conversation yet, seed a helpful first message.
      setMessages((prev) => {
        if (prev.length > 0) return prev;
        if (audit && audit.scores && typeof audit.scores === 'object') {
          const scoreKeys = Object.keys(audit.scores) as LighthouseScoreKey[];
          const worstKey = scoreKeys.slice().sort((a, b) => audit.scores[a].score - audit.scores[b].score)[0];
          const worst = audit.scores[worstKey];
          return [
            {
              id: uid(),
              role: "assistant",
              content:
                `Welcome. I’ve loaded your Lighthouse-powered Website Checker results.\n\n` +
                `Your biggest leverage point appears to be ${worstKey === "best-practices" ? "Best Practices" : worstKey.toUpperCase()} (${worst.label}). ` +
                "Ask me to prioritize fixes or request a quote.",
            },
          ];
        }
        return [
          {
            id: uid(),
            role: "assistant",
            content:
              "Welcome. Run a performance analysis and I'll explain your scores, recommend improvements, and guide you toward professional support.",
          },
        ];
      });

      if (detail?.focus === "quotation") {
        // Encourage conversion immediately.
        void quickAction("requestQuotation", { navigateTo: "/website-checker/quotation" });
      }
      if (detail?.focus === "expert") {
        void quickAction("talkToExpert", { navigateTo: "/website-checker/contact" });
      }
      if (detail?.focus === "services") {
        void quickAction("viewServices", { navigateTo: "/website-checker/services" });
      }
    };

    window.addEventListener("ai-assistant:open", onOpen as EventListener);
    return () => window.removeEventListener("ai-assistant:open", onOpen as EventListener);
  }, [audit, quickAction]);

  useEffect(() => {
    // Keep chat scrolled to newest message.
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isTyping]);

  const quickActions = useMemo(
    () => [
      { label: "Request Quotation", intent: "requestQuotation" as const, to: "/website-checker/quotation" },
      { label: "Talk to Expert", intent: "talkToExpert" as const, to: "/website-checker/contact" },
      { label: "View Services", intent: "viewServices" as const, to: "/website-checker/services" },
    ],
    [],
  );

  function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || isTyping) return;

    setMessages((prev) => [...prev, { id: uid(), role: "user", content: trimmed }]);
    setDraft("");
    setIsTyping(true);

    const reply = buildAssistantReply({ message: trimmed, audit });
    const assistantContent =
      reply.reply + "\n\n" + `Follow-up: ${reply.followUp}`;

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { id: uid(), role: "assistant", content: assistantContent }]);
    }, 700);
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[90]">
      {/* Toggle button */}
      <div className="pointer-events-auto fixed bottom-5 right-5">
        {!isOpen ? (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("ai-assistant:open", { detail: {} }))}
            className="group flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white/90 backdrop-blur-xl px-4 py-3 text-left shadow-[0_20px_60px_rgba(2,6,23,0.12)] transition-all duration-300 hover:border-neutral-300 hover:translate-y-[-2px]"
            aria-label="Open performance assistant"
          >
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-50 ring-1 ring-neutral-200">
              <span className="absolute inset-0 rounded-xl bg-gradient-to-b from-violet-400/20 to-cyan-400/10 blur-[10px]" />
              <svg className="relative h-5 w-5 text-neutral-900" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 2c4.97 0 9 4.03 9 9 0 4.97-4.03 9-9 9-1.33 0-2.6-.29-3.74-.81L3 20l.9-3.27A8.94 8.94 0 0 1 3 11c0-4.97 4.03-9 9-9Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.5 12h.01M12 12h.01M15.5 12h.01"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="hidden sm:block">
              <span className="block text-sm font-medium text-neutral-900">Performance Assistant</span>
              <span className="block text-xs text-neutral-500">Guidance and recommendations</span>
            </span>
          </button>
        ) : null}
      </div>

      {/* Chat drawer */}
      {isOpen ? (
        <div className="pointer-events-auto absolute inset-0">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute bottom-5 right-5 w-[92vw] max-w-[420px] rounded-3xl border border-neutral-200 bg-white shadow-[0_30px_120px_rgba(2,6,23,0.10)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-50 ring-1 ring-neutral-200">
                  <svg className="h-5 w-5 text-neutral-900" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 2c4.97 0 9 4.03 9 9 0 4.97-4.03 9-9 9-1.33 0-2.6-.29-3.74-.81L3 20l.9-3.27A8.94 8.94 0 0 1 3 11c0-4.97 4.03-9 9-9Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8.5 12h.01M12 12h.01M15.5 12h.01"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <div>
                  <div className="text-sm font-medium text-neutral-950">Performance Assistant</div>
                  <div className="text-xs text-neutral-500">Expert guidance for your next steps</div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-neutral-700 hover:bg-neutral-50 transition-colors"
                aria-label="Close assistant"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="px-4 py-3 flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {quickActions.map((a) => (
                  <button
                    key={a.intent}
                    onClick={() => void quickAction(a.intent, { navigateTo: a.to })}
                    className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-900 hover:bg-white hover:border-neutral-300 transition-colors"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div ref={listRef} className="px-4 pb-2 max-h-[45vh] overflow-y-auto">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                    Ask a question about your analysis, or pick a quick action above.
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
                      <div
                        className={
                          msg.role === "user"
                            ? "max-w-[85%] rounded-2xl bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-900"
                            : "max-w-[85%] rounded-2xl bg-white border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                        }
                      >
                        {msg.content.split("\n").map((line, idx) => (
                          <div key={idx}>{line}</div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
                {isTyping ? (
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="inline-flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse [animation-delay:120ms]" />
                    <span className="inline-flex h-2 w-2 rounded-full bg-neutral-300 animate-pulse [animation-delay:240ms]" />
                    <span>Thinking…</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t border-neutral-200 px-3 py-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(draft);
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Ask about scores, fixes, or next steps…"
                  className="flex-1 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/15"
                />
                <button
                  type="submit"
                  className="rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 px-3 py-2 text-sm font-medium text-neutral-950 hover:opacity-90 transition-opacity disabled:opacity-50"
                  disabled={!draft.trim() || isTyping}
                  aria-label="Send message"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M22 2 11 13"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M22 2 15 22 11 13 2 9 22 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </form>

              <div className="mt-2 text-[11px] text-neutral-500">
                Tip: Ask “What should I fix first?” or “Explain my scores.”
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

