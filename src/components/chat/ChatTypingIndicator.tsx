"use client";

import React from "react";

/**
 * Indica que el asistente está generando respuesta (efecto “escribiendo…”).
 */
export default function ChatTypingIndicator() {
  return (
    <div
      className="flex max-w-[min(100%,20rem)] flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Ordely está escribiendo…</span>
      <div className="inline-flex w-fit items-center gap-3 rounded-2xl rounded-bl-md border border-gray-200/80 bg-gray-50/90 px-4 py-3 shadow-theme-xs dark:border-white/10 dark:bg-white/[0.06]">
        <div className="flex items-center gap-1 pt-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="ordely-chat-typing-dot h-2 w-2 rounded-full bg-gray-500 dark:bg-gray-400"
              style={{ animationDelay: `${i * 0.16}s` }}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Escribiendo…
        </span>
      </div>
    </div>
  );
}
