"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const initialMessages: Message[] = [
  {
    role: "assistant",
    content: "Hi! I'm your Creative Strategy AI, powered by Gemini. I can help you analyze ad performance, generate scripts, identify winning patterns, and apply the 3A Framework to your creatives. What would you like to work on?",
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsLoading(true);
    // TODO: integrate Gemini API
    await new Promise((r) => setTimeout(r, 1200));
    setMessages((m) => [
      ...m,
      { role: "assistant", content: "This feature is coming soon. I'll be connected to Gemini to help with creative strategy analysis." },
    ]);
    setIsLoading(false);
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
                className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#FCD202] text-black"
                    : "bg-[#161B24] border border-[#1E2530] text-[#E2E8F0]"
                }`}
              >
                {msg.content}
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
        </div>

        <div className="border-t border-[#1E2530] bg-[#090B0F] p-4">
          <div className="flex gap-3 max-w-3xl mx-auto">
            <Input
              placeholder="Ask about creative strategy, hooks, frameworks..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              className="border-[#1E2530] bg-[#161B24] text-white placeholder:text-[#5A6478] focus-visible:ring-[#FCD202]/30"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-[#FCD202] text-black hover:bg-[#FCD202]/90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
