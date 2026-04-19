"use client";

import type { CachedAssistantExtras } from "@/lib/chat-session-cache";
import type { ChatWebhookAppointmentPreview } from "@/api/chat-webhook";
import {
  appointmentDetailHref,
  hasAppointmentDetailId,
} from "@/lib/appointmentDetailHref";
import Link from "next/link";
import React from "react";

function AppointmentMiniCard({ a }: { a: ChatWebhookAppointmentPreview }) {
  const start =
    a.startUtc &&
    new Date(a.startUtc).toLocaleString("es", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  const body = (
    <>
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        {a.title || "Cita"}
      </p>
      {a.patientDisplayName ? (
        <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
          {a.patientDisplayName}
        </p>
      ) : null}
      {a.providerDisplayName ? (
        <p className="text-xs text-brand-600 dark:text-brand-400">
          {a.providerDisplayName}
        </p>
      ) : null}
      {start ? (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-500">{start}</p>
      ) : null}
      {a.status ? (
        <span className="mt-2 inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600 dark:bg-white/10 dark:text-gray-400">
          {a.status}
        </span>
      ) : null}
    </>
  );

  const base =
    "rounded-xl border border-gray-200/90 bg-white/80 p-3 text-left shadow-theme-xs dark:border-white/10 dark:bg-white/[0.04]";
  const interactive =
    "block transition hover:border-brand-400/60 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:border-brand-500/40";

  if (hasAppointmentDetailId(a.id)) {
    return (
      <Link
        href={appointmentDetailHref(a.id)}
        className={`${base} ${interactive}`}
      >
        {body}
      </Link>
    );
  }

  return <div className={base}>{body}</div>;
}

type ChatResponseContextPanelProps = {
  extras: CachedAssistantExtras | undefined;
  className?: string;
};

export default function ChatResponseContextPanel({
  extras,
  className = "",
}: ChatResponseContextPanelProps) {
  const hasAppointments =
    (extras?.appointmentsPreview?.length ?? 0) > 0;
  const hasDisclaimers = (extras?.disclaimers?.length ?? 0) > 0;
  const hasContent = hasAppointments || hasDisclaimers;

  return (
    <aside
      className={`flex flex-col gap-4 ${className}`}
      aria-label="Citas y avisos de la última respuesta"
    >
      {!hasContent ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center dark:border-white/15">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Si la respuesta incluye citas o avisos importantes, aparecerán aquí.
          </p>
        </div>
      ) : null}

      {extras?.appointmentsPreview && extras.appointmentsPreview.length > 0 ? (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white dark:border-white/10 dark:bg-white/[0.03]">
          <p className="shrink-0 border-b border-gray-100/90 bg-white px-4 py-3 text-xs font-semibold text-gray-500 dark:border-white/[0.06] dark:bg-white/[0.06] dark:text-gray-400">
            Citas en esta respuesta ({extras.appointmentsPreview.length})
          </p>
          <div className="flex max-h-[min(52vh,420px)] flex-col gap-2 overflow-y-auto px-4 pb-4 pt-3 pr-1">
            {extras.appointmentsPreview.map((a) => (
              <AppointmentMiniCard key={a.id} a={a} />
            ))}
          </div>
        </div>
      ) : null}

      {extras?.disclaimers && extras.disclaimers.length > 0 ? (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <p className="text-xs font-semibold text-amber-900/80 dark:text-amber-200/90">
            Avisos
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1.5 text-xs leading-relaxed text-amber-950/90 dark:text-amber-100/80">
            {extras.disclaimers.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
