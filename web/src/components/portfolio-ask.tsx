"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const PROMPTS = [
  "Which vendors are overdue for reassessment?",
  "List Critical-tier vendors rated Unsatisfactory.",
  "Which vendors have no regulator mapped?",
];

// Floating "ask a question across the whole portfolio" widget for Root,
// Assessor and Customer — same visual language as the vendor-facing Vera chat,
// but backed by /api/ask (portfolio-wide, read-only, grounded-only answers).
export function PortfolioAsk() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(preset?: string) {
    const msg = (preset ?? input).trim();
    if (!msg || loading) return;
    const priorHistory = messages;
    setMessages((cur) => [...cur, { role: "user", content: msg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: priorHistory }),
      });
      const d = await res.json().catch(() => ({}));
      setMessages((cur) => [...cur, { role: "assistant", content: d.reply || "Sorry, I couldn't get an answer just now." }]);
    } catch {
      setMessages((cur) => [...cur, { role: "assistant", content: "Sorry, I couldn't reach the server just now." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close portfolio assistant" : "Ask the portfolio assistant"}
        className="fixed bottom-6 right-6 z-40 grid h-[52px] w-[52px] place-items-center rounded-full bg-brand text-white shadow-glow transition hover:brightness-110"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-6 z-40 flex w-[min(95vw,400px)] flex-col glass overflow-hidden rounded-2xl border border-border shadow-glow"
            style={{ maxHeight: "70vh" }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border bg-brand/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-brand" />
                <span className="text-sm font-semibold text-brand">Ask the portfolio</span>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="grid h-7 w-7 place-items-center rounded-lg border border-border text-muted hover:text-fg">
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-3" style={{ minHeight: 180 }}>
              {messages.length === 0 && (
                <div className="py-4 text-xs text-muted">
                  <div className="text-center">
                    <Sparkles size={24} className="mx-auto mb-2 text-brand/40" />
                    <p className="font-medium text-fg">Ask anything across your vendor portfolio.</p>
                    <p className="mt-1">Answers are grounded only in your live data — nothing is invented.</p>
                  </div>
                  <div className="mt-3 flex flex-col gap-1.5">
                    {PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => send(p)}
                        disabled={loading}
                        className="rounded-xl border border-border bg-surface/60 px-3 py-2 text-left text-[11px] text-fg transition hover:border-brand hover:text-brand disabled:opacity-60"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs leading-relaxed",
                      m.role === "user" ? "rounded-br-md bg-brand text-white" : "rounded-bl-md border border-border bg-surface-2 text-fg"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
                    <Loader2 size={13} className="animate-spin" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="border-t border-border p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Ask about the portfolio…"
                  rows={2}
                  disabled={loading}
                  className="flex-1 resize-none rounded-xl border border-border bg-surface/60 px-3 py-2 text-xs outline-none focus:border-brand disabled:opacity-60"
                />
                <button
                  onClick={() => send()}
                  disabled={loading || !input.trim()}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-glow-sm transition hover:brightness-110 disabled:opacity-60"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
