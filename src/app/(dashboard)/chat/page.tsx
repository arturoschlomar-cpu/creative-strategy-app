"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, User, RefreshCw } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Hi! I'm your Creative Strategy AI, powered by Gemini. I can help you:\n\n• Analyze ad performance using the **3A Framework** (Attract, Absorb, Act)\n• Generate high-converting scripts and creative concepts\n• Identify winning patterns and building blocks\n• Apply psychology principles to your ad creative\n• Build creative portfolios with the 20/60/20 split\n\nWhat would you like to work on today?",
};

const SUGGESTIONS = [
  "How do I write a strong hook for a weight loss ad?",
  "Explain the 3A Framework and how to apply it",
  "What psychology principles drive direct response ads?",
  "How do I build a 20/60/20 creative portfolio?",
];

function formatMessage(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("• ") || line.startsWith("- ")) {
      return (
        <li key={i} className="ml-4 list-disc">
          <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        </li>
      );
    }
    if (line.trim() === "") return <br key={i} />;
    return (
      <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
    );
  });
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsLoading(true);
    setError("");

    try {
      // Build history for API (exclude initial greeting from context to save tokens)
      const history = messages.slice(1).map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, sessionId: sessionId || undefined }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");

      if (data.sessionId && !sessionId) setSessionId(data.sessionId);

      setMessages((m) => [...m, { role: "assistant", content: data.message }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      setMessages((m) => m.slice(0, -1)); // remove user message on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
    setSessionId("");
    setError("");
    setInput("");
  };

  return (
    <>
      <Header title="AI Chat" subtitle="Creative strategy assistant powered by Gemini" />
      <div className="flex flex-col h-[calc(100vh-64px)]">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FCD202]/10 flex-shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4 text-[#FCD202]" />
                </div>
              )}
              <div
                className={`max-w-[72%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#FCD202] text-black"
                    : "bg-[#161B24] border border-[#1E2530] text-[#E2E8F0]"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="space-y-1">{formatMessage(msg.content)}</div>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E2530] flex-shrink-0 mt-0.5">
                  <User className="h-4 w-4 text-[#8693A8]" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FCD202]/10">
                <Sparkles className="h-4 w-4 text-[#FCD202]" />
              </div>
              <div className="rounded-2xl bg-[#161B24] border border-[#1E2530] px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-[#5A6478] animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Suggestions — only shown at start */}
          {messages.length === 1 && !isLoading && (
            <div className="space-y-2 mt-4">
              <p className="text-xs text-[#5A6478] px-1">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="rounded-full border border-[#1E2530] bg-[#161B24] px-3 py-1.5 text-xs text-[#8693A8] hover:border-[#FCD202]/40 hover:text-white transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-[#1E2530] bg-[#090B0F] p-4">
          <div className="flex gap-3 max-w-3xl mx-auto">
            <button
              onClick={handleReset}
              title="New conversation"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-[#1E2530] text-[#5A6478] hover:bg-[#1E2530] hover:text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <Input
              placeholder="Ask about creative strategy, hooks, frameworks..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              className="border-[#1E2530] bg-[#161B24] text-white placeholder:text-[#5A6478] focus-visible:ring-[#FCD202]/30"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="bg-[#FCD202] text-black hover:bg-[#FCD202]/90 disabled:opacity-40 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {sessionId && (
            <p className="text-[10px] text-[#2A3140] text-center mt-2">
              Session: {sessionId.slice(0, 20)}...
            </p>
          )}
        </div>
      </div>
    </>
  );
}
