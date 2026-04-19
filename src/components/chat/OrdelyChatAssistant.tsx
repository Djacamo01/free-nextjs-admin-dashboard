"use client";

import Button from "@/components/ui/button/Button";
import AssistantMarkdown from "@/components/chat/AssistantMarkdown";
import ChatResponseContextPanel from "@/components/chat/ChatResponseContextPanel";
import ChatTypingIndicator from "@/components/chat/ChatTypingIndicator";
import {
  ChatWebhookError,
  chatWebhookHasUsableContent,
  postChatMessage,
  type ChatWebhookResponse,
} from "@/api/chat-webhook";
import {
  ASK_ORDELY_LABEL,
  ASK_ORDELY_SUBTITLE,
} from "@/constants/askOrdely";
import {
  appointmentDetailHref,
  hasAppointmentDetailId,
} from "@/lib/appointmentDetailHref";
import {
  clearChatSessionCache,
  createChatSessionId,
  loadChatSessionCache,
  saveChatSessionCache,
  type CachedAssistantExtras,
  type CachedChatTurn,
  type ChatSessionCache,
} from "@/lib/chat-session-cache";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type OrdelyChatAssistantVariant = "floating" | "page";

export type OrdelyChatAssistantProps = {
  variant?: OrdelyChatAssistantVariant;
};

function turnId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildAssistantExtras(
  res: ChatWebhookResponse
): CachedAssistantExtras | undefined {
  const preview = res.data?.appointmentsPreview;
  const disclaimers = res.data?.disclaimers;
  const disclaimerLines = (disclaimers ?? []).filter(
    (x): x is string => typeof x === "string" && x.trim().length > 0
  );
  const hasPreview = (preview?.length ?? 0) > 0;
  if (!hasPreview && disclaimerLines.length === 0) return undefined;
  return {
    appointmentsPreview: hasPreview ? preview : undefined,
    disclaimers: disclaimerLines.length ? disclaimerLines : undefined,
  };
}

function appendAssistantFromResponse(
  prev: ChatSessionCache,
  res: ChatWebhookResponse
): ChatSessionCache {
  const trimmed = (res.reply?.text ?? "").trim();
  const hasPreview =
    (res.data?.appointmentsPreview?.length ?? 0) > 0;
  const hasChips =
    (res.suggestions?.length ?? 0) > 0 ||
    (res.attachments?.length ?? 0) > 0;
  const text =
    trimmed ||
    (hasChips || hasPreview ? "" : res.ok ? "" : "Sin respuesta del asistente.");
  const assistantTurn: CachedChatTurn = {
    id: turnId(),
    role: "assistant",
    text,
    createdAt: Date.now(),
    format: res.reply?.format,
    suggestions: res.suggestions,
    attachments: res.attachments,
    extras: buildAssistantExtras(res),
  };
  const nextConversation =
    res.conversationId ?? prev.conversationId;
  return {
    ...prev,
    conversationId: nextConversation,
    messages: [...prev.messages, assistantTurn],
    updatedAt: Date.now(),
  };
}

export default function OrdelyChatAssistant({
  variant = "floating",
}: OrdelyChatAssistantProps) {
  const [open, setOpen] = useState(variant === "page");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<ChatSessionCache | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cached = loadChatSessionCache();
    if (cached) {
      setSession(cached);
      return;
    }
    const fresh: ChatSessionCache = {
      sessionId: createChatSessionId(),
      messages: [],
      updatedAt: Date.now(),
    };
    saveChatSessionCache(fresh);
    setSession(fresh);
  }, []);

  useEffect(() => {
    if (variant === "floating" && !open) return;
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [variant, open, session?.messages.length, loading]);

  const persist = useCallback((next: ChatSessionCache) => {
    saveChatSessionCache(next);
    setSession(next);
  }, []);

  const sendPayload = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || !session || loading) return;

      setError(null);
      const userTurn: CachedChatTurn = {
        id: turnId(),
        role: "user",
        text: trimmed,
        createdAt: Date.now(),
      };
      const afterUser: ChatSessionCache = {
        ...session,
        messages: [...session.messages, userTurn],
        updatedAt: Date.now(),
      };
      persist(afterUser);
      setLoading(true);

      try {
        const res = await postChatMessage({
          sessionId: afterUser.sessionId,
          message: trimmed,
          conversationId: afterUser.conversationId,
        });
        if (!chatWebhookHasUsableContent(res)) {
          setError(
            typeof res.error === "string"
              ? res.error
              : "El asistente no pudo completar la respuesta."
          );
          return;
        }
        persist(appendAssistantFromResponse(afterUser, res));
      } catch (e) {
        if (e instanceof ChatWebhookError) {
          setError(e.message);
        } else {
          setError("No se pudo contactar al asistente.");
        }
      } finally {
        setLoading(false);
      }
    },
    [session, loading, persist]
  );

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const m = input;
      setInput("");
      void sendPayload(m);
    },
    [input, sendPayload]
  );

  const newConversation = useCallback(() => {
    clearChatSessionCache();
    const fresh: ChatSessionCache = {
      sessionId: createChatSessionId(),
      messages: [],
      updatedAt: Date.now(),
    };
    saveChatSessionCache(fresh);
    setSession(fresh);
    setError(null);
  }, []);

  const lastAssistantExtras = useMemo(() => {
    const msgs = session?.messages ?? [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "assistant") return msgs[i].extras;
    }
    return undefined;
  }, [session?.messages]);

  const scrollConversationToTop = useCallback(() => {
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollConversationToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  const panel = useMemo(
    () => {
      const messages = session?.messages ?? [];
      const isPage = variant === "page";
      const shellClass = isPage
        ? "flex h-full min-h-0 w-full max-h-full flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-theme-sm ring-1 ring-black/[0.03] dark:border-white/10 dark:bg-gray-900 dark:ring-white/[0.06]"
        : "fixed bottom-24 right-4 z-50 flex h-[min(70vh,540px)] max-h-[calc(100dvh-6.5rem)] w-[min(100vw-2rem,400px)] flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-theme-lg ring-1 ring-black/[0.04] dark:border-white/10 dark:bg-gray-900 dark:ring-white/[0.06] md:right-6 md:bottom-6";
      const listClass =
        "min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3";
      return (
      <div
        className={shellClass}
        role={isPage ? undefined : "dialog"}
        aria-label={ASK_ORDELY_LABEL}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200/90 bg-gradient-to-r from-gray-50/80 to-white px-4 py-3.5 dark:border-white/[0.08] dark:from-gray-900 dark:to-gray-900/80">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {ASK_ORDELY_LABEL}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {ASK_ORDELY_SUBTITLE}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={newConversation}
              className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-white/5"
            >
              Nueva conversación
            </button>
            {!isPage && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
                aria-label="Cerrar"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <nav
          className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-200/80 bg-gray-50/60 px-3 py-2 dark:border-white/[0.06] dark:bg-white/[0.03]"
          aria-label="Navegación de la conversación"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Conversación
            </p>
            <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">
              {messages.length === 0
                ? "Aún no hay mensajes"
                : `${messages.length} mensaje${messages.length === 1 ? "" : "s"} en el hilo`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={scrollConversationToTop}
              disabled={messages.length === 0}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-200/80 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-white/10"
            >
              ↑ Inicio
            </button>
            <button
              type="button"
              onClick={scrollConversationToBottom}
              disabled={messages.length === 0 && !loading}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-200/80 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-white/10"
            >
              ↓ Final
            </button>
          </div>
        </nav>

        <div
          ref={listRef}
          className={listClass}
        >
          {messages.length === 0 && !loading && (
            <div className="rounded-xl border border-dashed border-gray-200/90 bg-gray-50/50 px-4 py-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Escribe abajo para consultar citas, disponibilidad o resúmenes.
                En pantalla completa verás también el detalle de la última
                respuesta al lado.
              </p>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "flex w-full justify-end pl-8 pr-0 sm:pl-14"
                  : "flex w-full justify-start pr-6 sm:pr-10"
              }
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[min(85%,22rem)] rounded-2xl rounded-tr-md bg-brand-500 px-3.5 py-2.5 text-left text-sm text-white shadow-sm sm:max-w-[min(80%,26rem)]"
                    : "max-w-[min(100%,40rem)] rounded-2xl rounded-bl-md border border-gray-200/80 bg-gray-50/90 px-3.5 py-2.5 text-sm text-gray-800 shadow-theme-xs dark:border-white/10 dark:bg-white/[0.06] dark:text-gray-100"
                }
              >
              {m.role === "user" ? (
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
              ) : (
                <>
                  <AssistantMarkdown content={m.text} format={m.format} />
                  {m.extras?.appointmentsPreview &&
                    m.extras.appointmentsPreview.length > 0 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {m.extras.appointmentsPreview.slice(0, 8).map((a, idx) => {
                          const chip =
                            "min-w-[148px] shrink-0 rounded-xl border border-gray-200/90 bg-white px-2.5 py-2 text-xs dark:border-white/10 dark:bg-black/25";
                          const chipInteractive =
                            `${chip} block transition hover:border-brand-400/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:border-brand-500/50`;
                          const inner = (
                            <>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {a.title || "Cita"}
                              </p>
                              {a.patientDisplayName ? (
                                <p className="mt-0.5 text-[11px] text-gray-600 dark:text-gray-400">
                                  {a.patientDisplayName}
                                </p>
                              ) : null}
                              {a.providerDisplayName ? (
                                <p className="text-[11px] text-brand-600 dark:text-brand-400">
                                  {a.providerDisplayName}
                                </p>
                              ) : null}
                              {a.startUtc ? (
                                <p className="mt-1 text-[10px] text-gray-500">
                                  {new Date(a.startUtc).toLocaleString("es", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              ) : null}
                            </>
                          );
                          return hasAppointmentDetailId(a.id) ? (
                            <Link
                              key={a.id}
                              href={appointmentDetailHref(a.id)}
                              className={chipInteractive}
                            >
                              {inner}
                            </Link>
                          ) : (
                            <div
                              key={a.id || `${m.id}-appt-${idx}`}
                              className={chip}
                            >
                              {inner}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  {m.attachments && m.attachments.length > 0 && (
                    <ul className="mt-2 space-y-1 border-t border-gray-200/80 pt-2 dark:border-white/10">
                      {m.attachments.map((a, i) =>
                        a.url ? (
                          <li key={`${m.id}-a-${i}`}>
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-brand-600 underline dark:text-brand-400"
                            >
                              {a.title || a.url}
                            </a>
                          </li>
                        ) : null
                      )}
                    </ul>
                  )}
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-200/70 pt-3 dark:border-white/10">
                      {m.suggestions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          disabled={loading}
                          onClick={() => void sendPayload(s.payload)}
                          className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs ring-1 ring-gray-200/90 transition hover:bg-gray-50 disabled:opacity-50 dark:bg-white/10 dark:text-gray-200 dark:ring-white/15 dark:hover:bg-white/[0.14]"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              </div>
            </div>
          ))}
          {loading ? (
            <div className="flex w-full justify-start pr-6 sm:pr-10">
              <ChatTypingIndicator />
            </div>
          ) : null}
        </div>

        {error && (
          <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="shrink-0 border-t border-gray-200/90 bg-gray-50/50 p-3 dark:border-white/[0.08] dark:bg-black/20"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta por citas, pacientes o la agenda…"
              className="focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
              disabled={loading || !session}
              autoComplete="off"
            />
            <Button type="submit" size="sm" disabled={loading || !session}>
              Enviar
            </Button>
          </div>
        </form>
      </div>
      );
    },
    [
      variant,
      loading,
      error,
      input,
      session,
      onSubmit,
      newConversation,
      sendPayload,
      scrollConversationToTop,
      scrollConversationToBottom,
    ]
  );

  if (variant === "page") {
    return (
      <div className="grid h-full min-h-0 w-full flex-1 grid-cols-1 items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_min(100%,320px)] xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-8">
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          {panel}
        </div>
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden lg:overflow-visible">
          <div className="lg:sticky lg:top-28 lg:z-[5] lg:max-h-full lg:self-start lg:overflow-y-auto lg:pr-1">
            <ChatResponseContextPanel extras={lastAssistantExtras} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {open && panel}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-xl text-white shadow-theme-lg ring-2 ring-brand-400/30 hover:bg-brand-600 md:right-6"
        aria-label={
          open ? "Cerrar asistente" : `Abrir ${ASK_ORDELY_LABEL}`
        }
        aria-expanded={open}
      >
        {open ? "✕" : "✨"}
      </button>
    </>
  );
}
