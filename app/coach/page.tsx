"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Trash2, Sparkles, MessageSquareText } from "lucide-react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = state.chat;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    addChat({ role: "user", content });
    // Local coach engine. INTEGRATION POINT: replace with API call for real AI.
    const reply = askCoach(content, ctx);
    setInput("");
    // small delay so the user message renders first
    setTimeout(() => addChat({ role: "coach", content: reply }), 250);
  };

  return (
    <Card className="flex h-[calc(100vh-220px)] min-h-[440px] flex-col p-0">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
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
      </div>

      {/* Suggestions */}
      <div className="flex gap-2 overflow-x-auto border-t border-line px-4 py-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
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
        />
        <button onClick={() => send()} className="btn-accent shrink-0" aria-label="Send">
          <Send size={16} />
        </button>
      </div>
    </Card>
  );
}
