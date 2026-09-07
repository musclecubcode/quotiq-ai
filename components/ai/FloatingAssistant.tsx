"use client";

import { useEffect, useState } from "react";
import { AssistantChat } from "./AssistantChat";
import { IconSparkles, IconX } from "@/components/icons";

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {open ? (
        <section aria-label="Quotiq AI assistant" className="mb-3 w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white"><IconSparkles className="h-4 w-4" /></span>
              Quotiq AI
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close Quotiq AI" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900">
              <IconX className="h-4 w-4" />
            </button>
          </div>
          <AssistantChat compact />
        </section>
      ) : null}
      <button type="button" onClick={() => setOpen(true)} aria-label="Talk to Quotiq AI" aria-expanded={open} className="ml-auto flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
        <IconSparkles className="h-5 w-5" />
        Ask Quotiq AI
      </button>
    </div>
  );
}
