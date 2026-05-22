"use client";

import { useEffect, useRef, useState } from "react";
import {
  Send,
  Trash2,
  Sparkles,
  MessageSquareText,
  Loader2,
  Zap,
  ImagePlus,
  X,
} from "lucide-react";
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

interface AttachedImage {
  dataUrl: string; // for preview
  data: string; // base64 without prefix
  mediaType: string;
}

// Downscale a photo client-side (max edge ~1024px, JPEG) to keep the upload
// small and fast while staying clear enough for the model to read.
function fileToResized(file: File, maxDim = 1024): Promise<AttachedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (Math.max(width, height) > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const cx = canvas.getContext("2d");
      if (!cx) return reject(new Error("no canvas"));
      cx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      resolve({ dataUrl, data: dataUrl.split(",")[1] ?? "", mediaType: "image/jpeg" });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load error"));
    };
    img.src = url;
  });
}

export default function CoachPage() {
  return (
    <HydrationGate>
      <PageHeader
        title="AI Coach"
        subtitle="Strict but supportive. Ask anything, or snap a photo of your meal."
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
  const [image, setImage] = useState<AttachedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
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

  const pickPhoto = async (file?: File) => {
    if (!file) return;
    try {
      setImage(await fileToResized(file));
    } catch {
      /* ignore unreadable files */
    }
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if ((!content && !image) || loading) return;

    const history = messages.slice(-12).map((m) => ({ role: m.role, content: m.content }));
    const sentImage = image;
    const display = content || "📷 Photo of my meal";
    addChat({ role: "user", content: display });
    setInput("");
    setImage(null);
    setLoading(true);
    setStreaming("");

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          context: ctx,
          history,
          ...(sentImage
            ? { image: { data: sentImage.data, mediaType: sentImage.mediaType } }
            : {}),
        }),
      });
      if (!res.body) throw new Error("no stream");

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
      const fallbackReply = sentImage
        ? "I couldn't read that photo just now — try again, or tell me what's in the meal."
        : askCoach(content, ctx);
      addChat({ role: "coach", content: acc.trim() || fallbackReply });
    } catch {
      addChat({
        role: "coach",
        content: sentImage
          ? "I couldn't analyze that photo just now — try again, or describe the meal."
          : askCoach(content, ctx),
      });
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
          <span className="text-xs text-faint">
            {aiAvailable ? "Photo meal analysis on" : "Add an ANTHROPIC_API_KEY for full AI + photos"}
          </span>
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
              I&apos;m your personal coach. Ask me anything, or tap the photo
              button to show me what you&apos;re eating and I&apos;ll judge it.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}
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

      {/* Attached photo preview */}
      {image && (
        <div className="flex items-center gap-3 border-t border-line px-3 pt-3">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.dataUrl}
              alt="Meal to analyze"
              className="h-16 w-16 rounded-lg border border-line object-cover"
            />
            <button
              onClick={() => setImage(null)}
              className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-white"
              aria-label="Remove photo"
            >
              <X size={12} />
            </button>
          </div>
          <span className="text-xs text-muted">
            Photo attached — add a note (optional), then send.
          </span>
        </div>
      )}

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
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            pickPhoto(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="rounded-lg p-2 text-faint transition hover:bg-panel hover:text-accent"
          aria-label="Add meal photo"
        >
          <ImagePlus size={18} />
        </button>
        <input
          className="input"
          placeholder={image ? "Add a note (optional)…" : "Ask your coach… or attach a meal photo"}
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
