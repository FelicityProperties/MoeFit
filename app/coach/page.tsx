"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Trash2, Sparkles, MessageSquareText, Loader2, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import { useCoachContext } from "@/lib/hooks";
import { askCoach } from "@/lib/coach";
import { Card, PageHeader, clsx } from "@/components/ui";
import { HydrationGate } from "@/components/Gates";

const SUGGESTIONS = [
  "Can I eat this burger?",
  "Is it okay if I drink Coke Zero?",
  "Should I workout now or later?",
  "I ordered sushi, is that fine?",
  "I feel lazy, what should I do?",
  "How many calories should I eat today?",
];

export default function CoachPage() {
  return (
    <HydrationGate>
      <PageHeader
        title="AI Coach"
        subtitle="Strict but supportive. Ask anything about food, training, or discipline."
        icon={<MessageSquareText size={22} />}
      />
      <Chat />
    </HydrationGate>
  );
}

function Chat() {
  const { state, addChat, clearChat } = useStore();
  const ctx = useCoachContext();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = state.chat;

  // Check whether a real AI key is wired up on the server.
  useEffect(() => {
    fetch("/api/coach")
      .then((r) => r.json())
      .then((j) => setAiAvailable(Boolean(j.aiAvailable)))
      .catch(() => setAiAvailable(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, loading, streaming]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    // Snapshot history before adding the new message.
    const history = messages.slice(-12).map((m) => ({ role: m.role, content: m.content }));
    addChat({ role: "user", content });
    setInput("");
    setLoading(true);
    setStreaming("");

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, context: ctx, history }),
      });
      if (!res.body) throw new Error("no stream");

      // Read the streamed reply chunk-by-chunk so it types out live.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreaming(acc);
      }
      acc += decoder.decode();
      // Commit the finished reply once (avoids spamming storage during stream).
      addChat({ role: "coach", content: acc.trim() || askCoach(content, ctx) });
    } catch {
      // Network failure — fall back to the built-in coach so the chat still works.
      addChat({ role: "coach", content: askCoach(content, ctx) });
    } finally {
      setStreaming(null);
      setLoading(false);
    }
  };

  return (
    <Card className="flex h-[calc(100vh-220px)] min-h-[440px] flex-col p-0">
      {/* Status badge */}
      {aiAvailable !== null && (
        <div className="flex items-center gap-2 border-b border-line px-4 py-2">
          <span
            className={clsx(
              "pill",
              aiAvailable
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "bg-panel text-muted border border-line"
            )}
          >
            <Zap size={12} />
            {aiAvailable ? "Smart AI coach" : "Built-in coach"}
          </span>
          {!aiAvailable && (
            <span className="text-xs text-faint">
              Add an ANTHROPIC_API_KEY to enable the full AI.
            </span>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && !loading && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent">
              <Sparkles size={26} />
            </div>
            <p className="max-w-sm text-sm text-muted">
              I&apos;m your personal coach. I&apos;ll keep you honest, disciplined,
              and on track. Ask me something, or tap a prompt below.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={clsx(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={clsx(
                "max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "rounded-br-sm bg-accent text-white"
                  : "rounded-bl-sm border border-line bg-panel text-strong"
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {/* Live streaming reply */}
        {streaming && streaming.length > 0 && (
          <div className="flex justify-start">
            <div className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-sm border border-line bg-panel px-4 py-2.5 text-sm leading-relaxed text-strong">
              {streaming}
              <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-accent align-middle" />
            </div>
          </div>
        )}

        {/* Thinking indicator before the first token arrives */}
        {loading && (streaming === null || streaming.length === 0) && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-line bg-panel px-4 py-3 text-sm text-muted">
              <Loader2 size={14} className="animate-spin" />
              Coach is thinking…
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="flex gap-2 overflow-x-auto border-t border-line px-4 py-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            disabled={loading}
            className="btn-chip shrink-0 whitespace-nowrap"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-line p-3">
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="rounded-lg p-2 text-faint transition hover:bg-panel hover:text-rose-600"
            aria-label="Clear chat"
          >
            <Trash2 size={18} />
          </button>
        )}
        <input
          className="input"
          placeholder="Ask your coach…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={loading}
        />
        <button
          onClick={() => send()}
          disabled={loading}
          className="btn-accent shrink-0"
          aria-label="Send"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </Card>
  );
}
