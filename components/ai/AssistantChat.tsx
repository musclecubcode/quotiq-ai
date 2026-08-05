"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { generateAssistantReply, suggestedPrompts } from "@/lib/assistant";
import { IconSend, IconSparkles } from "@/components/icons";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
}

const initialMessages: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Welcome to Quotiq AI. Your estimating assistant is in beta and will become more useful as you add clients and work orders.",
  },
];

export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  function createId(suffix: string) {
    nextId.current += 1;
    return `${nextId.current}-${suffix}`;
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: createId("user"),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);
    scrollToBottom();

    window.setTimeout(() => {
      const reply: Message = {
        id: createId("assistant"),
        role: "assistant",
        content: generateAssistantReply(trimmed),
      };
      setMessages((prev) => [...prev, reply]);
      setIsThinking(false);
      scrollToBottom();
    }, 500);
  }

  return (
    <div className="flex h-[calc(100vh-11rem)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                <IconSparkles className="h-4 w-4" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm sm:max-w-[70%]",
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-800"
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
              <IconSparkles className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl bg-slate-100 px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3 sm:px-6">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(input);
        }}
        className="flex items-end gap-2 border-t border-slate-100 p-3 sm:p-4"
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              sendMessage(input);
            }
          }}
          rows={1}
          placeholder="Ask about estimates, work orders, or invoices…"
          className="max-h-32 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          <IconSend className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
