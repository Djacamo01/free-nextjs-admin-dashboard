"use client";

import { fetchPatientDetails, ClientHttpError } from "@/api";
import type { PatientDetails } from "@/api/patients";
import RelatedAppointmentsList from "@/components/appointments/RelatedAppointmentsList";
import { ContactRelationshipsPanel } from "@/components/contacts/ContactRelationshipsPanel";
import SpinnerOne from "@/components/ui/spinner/SpinnerOne";
import {
  labelChannelFromApiCode,
  labelChannelType,
} from "@/constants/publicEnums";
import { formatShortDateTime } from "@/lib/formatDate";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

/* ─── helpers ──────────────────────────────────────────────── */

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function maybeDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return formatShortDateTime(iso);
}

/* ─── sub-components ────────────────────────────────────────── */

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.03] sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
      {children}
    </p>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 border-b border-gray-100 py-3 text-sm last:border-0 dark:border-white/[0.06]">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white">{children}</span>
    </div>
  );
}

function ContactBadge({
  value,
  href,
  primary,
}: {
  value: string;
  href: string;
  primary?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 dark:border-white/[0.07] dark:bg-white/[0.03]">
      <a
        href={href}
        className="min-w-0 truncate text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
      >
        {value}
      </a>
      {primary && (
        <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          Principal
        </span>
      )}
    </div>
  );
}

function ChannelIcon({ channel }: { channel: string }) {
  const c = channel.toLowerCase();
  if (c === "whatsapp")
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.528 5.859L.054 23.514a.5.5 0 0 0 .614.612l5.807-1.459A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.695-.502-5.243-1.381l-.374-.217-3.882.976.995-3.77-.235-.386A9.945 9.945 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
      </svg>
    );
  if (c === "email")
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    );
  if (c === "sms")
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    );
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.228 2.707-2.828V8.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 5.25c-2.392 0-4.744.175-7.043.513C3.373 5.746 2.25 7.14 2.25 8.741v4.01z" />
    </svg>
  );
}

const TABS = ["Resumen", "Contacto", "Canales", "Historial", "Notas"] as const;
type Tab = (typeof TABS)[number];

/* ─── main component ────────────────────────────────────────── */

export default function PatientDetailsView() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [detail, setDetail] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Resumen");

  useEffect(() => {
    if (!id) { setLoading(false); setError("Identificador no válido."); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPatientDetails(id)
      .then((data) => { if (!cancelled) setDetail(data); })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ClientHttpError ? err.message : "No se pudo cargar el perfil.");
          setDetail(null);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const primaryEmail = useMemo(
    () => detail?.emailAddresses?.find((e) => e.isPrimary)?.email ?? detail?.emailAddresses?.[0]?.email,
    [detail]
  );
  const primaryPhone = useMemo(
    () => detail?.phoneNumbers?.find((p) => p.isPrimary)?.phone ?? detail?.phoneNumbers?.[0]?.phone,
    [detail]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <SpinnerOne />
        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando ficha…</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-4 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error ?? "Cliente no encontrado."}
        </div>
        <Link href="/clientes" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
          ← Volver a clientes
        </Link>
      </div>
    );
  }

  const emails   = detail.emailAddresses  ?? [];
  const phones   = detail.phoneNumbers    ?? [];
  const channels = detail.channelIdentities ?? [];
  const avatar   = initials(detail.displayName);

  return (
    <div className="w-full min-w-0 space-y-6">

      {/* ── back link ───────────────────────────────────────── */}
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Clientes
      </Link>

      {/* ── hero header ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.03]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

          {/* avatar + identity */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-xl font-bold text-white shadow-sm">
              {avatar}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                {detail.displayName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                  Cliente
                </span>
                {primaryEmail && (
                  <a
                    href={`mailto:${primaryEmail}`}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" d="M2 4.5l6 4 6-4M2 4h12a1 1 0 011 1v7a1 1 0 01-1 1H2a1 1 0 01-1-1V5a1 1 0 011-1z"/>
                    </svg>
                    {primaryEmail}
                  </a>
                )}
                {primaryPhone && (
                  <a
                    href={`tel:${primaryPhone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" d="M3 2h2.5L7 5.5 5.5 7a9 9 0 004.5 4.5L11.5 10 15 11.5V14a1 1 0 01-1 1A12 12 0 012 3a1 1 0 011-1z"/>
                    </svg>
                    {primaryPhone}
                  </a>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                Cliente desde {maybeDate(detail.createdAt)}
              </p>
            </div>
          </div>

          {/* actions */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/calendar/create`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M8 3v10M3 8h10"/>
              </svg>
              Nueva cita
            </Link>
          </div>
        </div>

        {/* ── quick stats strip ─── */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 dark:border-white/[0.07] sm:grid-cols-4">
          {[
            { label: "Correos",    value: emails.length   || "—" },
            { label: "Teléfonos",  value: phones.length   || "—" },
            { label: "Canales",    value: channels.length || "—" },
            { label: "Canal pref.", value: detail.profile.preferredChannel ? labelChannelType(detail.profile.preferredChannel) : "—" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── tabs ────────────────────────────────────────────── */}
      <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max border-b border-gray-200 dark:border-white/[0.08]">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 pb-3 pt-1 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/80"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── tab content ─────────────────────────────────────── */}

      {activeTab === "Resumen" && (
        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          <SectionCard>
            <SectionTitle>Información del perfil</SectionTitle>
            <InfoRow label="Canal preferido">
              {detail.profile.preferredChannel ? labelChannelType(detail.profile.preferredChannel) : "—"}
            </InfoRow>
            <InfoRow label="Miembro desde">{maybeDate(detail.createdAt)}</InfoRow>
            <InfoRow label="Última actualización">{maybeDate(detail.updatedAt ?? detail.profile.updatedAt)}</InfoRow>
          </SectionCard>
          <SectionCard>
            <SectionTitle>Contactos relacionados</SectionTitle>
            <ContactRelationshipsPanel contactId={detail.id} />
          </SectionCard>
        </div>
      )}

      {activeTab === "Contacto" && (
        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          <SectionCard>
            <SectionTitle>Correos electrónicos</SectionTitle>
            {emails.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Sin correos registrados.</p>
            ) : (
              <div className="space-y-2">
                {emails.map((e) => (
                  <ContactBadge key={e.id} value={e.email} href={`mailto:${e.email}`} primary={e.isPrimary} />
                ))}
              </div>
            )}
          </SectionCard>
          <SectionCard>
            <SectionTitle>Teléfonos</SectionTitle>
            {phones.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Sin teléfonos registrados.</p>
            ) : (
              <div className="space-y-2">
                {phones.map((p) => (
                  <ContactBadge key={p.id} value={p.phone} href={`tel:${p.phone.replace(/\s/g, "")}`} primary={p.isPrimary} />
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {activeTab === "Canales" && (
        <SectionCard>
          <SectionTitle>Canales de comunicación</SectionTitle>
          {channels.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12 text-center dark:border-white/[0.08]">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Sin canales vinculados</p>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">WhatsApp, SMS y otros canales aparecerán aquí.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {channels.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-white/[0.07] dark:bg-white/[0.02]"
                >
                  <span className="mt-0.5 shrink-0 text-teal-600 dark:text-teal-400">
                    <ChannelIcon channel={c.channel} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {labelChannelFromApiCode(c.channel)}
                    </p>
                    <p className="mt-0.5 break-all font-mono text-xs text-gray-500 dark:text-gray-400">
                      {c.externalUserId}
                    </p>
                    <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                      Desde {formatShortDateTime(c.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === "Historial" && (
        <SectionCard>
          <SectionTitle>Citas del cliente</SectionTitle>
          <RelatedAppointmentsList variant="patient" patientId={detail.id} />
        </SectionCard>
      )}

      {activeTab === "Notas" && (
        <SectionCard>
          <SectionTitle>Nota del perfil</SectionTitle>
          {detail.profile.notes ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-white/90">
              {detail.profile.notes}
            </p>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">No hay notas en el perfil.</p>
          )}
        </SectionCard>
      )}

    </div>
  );
}
