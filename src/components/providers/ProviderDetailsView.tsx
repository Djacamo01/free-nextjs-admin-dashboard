"use client";

import { fetchProviderDetails, ClientHttpError } from "@/api";
import type { ProviderDetails } from "@/api/providers";
import RelatedAppointmentsList from "@/components/appointments/RelatedAppointmentsList";
import { ContactRelationshipsPanel } from "@/components/contacts/ContactRelationshipsPanel";
import SpinnerOne from "@/components/ui/spinner/SpinnerOne";
import { formatShortDateTime } from "@/lib/formatDate";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

/* ─── helpers ───────────────────────────────────────────────── */

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

const TABS = ["Resumen", "Contacto", "Historial", "Servicios"] as const;
type Tab = (typeof TABS)[number];

/* ─── main component ────────────────────────────────────────── */

export default function ProviderDetailsView() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [detail, setDetail] = useState<ProviderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Resumen");

  useEffect(() => {
    if (!id) { setLoading(false); setError("Identificador no válido."); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchProviderDetails(id)
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
          {error ?? "Colaborador no encontrado."}
        </div>
        <Link href="/colaboradores" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
          ← Volver a colaboradores
        </Link>
      </div>
    );
  }

  const emails = detail.emailAddresses ?? [];
  const phones = detail.phoneNumbers ?? [];
  const avatar = initials(detail.displayName);

  return (
    <div className="w-full min-w-0 space-y-6">

      {/* ── back link ───────────────────────────────────────── */}
      <Link
        href="/colaboradores"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Colaboradores
      </Link>

      {/* ── hero header ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.03]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

          {/* avatar + identity */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-xl font-bold text-white shadow-sm dark:bg-teal-500">
              {avatar}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                {detail.displayName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2.5">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  detail.profile.active
                    ? "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400"
                    : "bg-gray-100 text-gray-600 dark:bg-white/[0.07] dark:text-gray-400"
                }`}>
                  {detail.profile.active ? "Activo" : "Inactivo"}
                </span>
                <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                  Colaborador
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
                Colaborador desde {maybeDate(detail.createdAt)}
              </p>
            </div>
          </div>

          {/* actions */}
          <div className="flex flex-wrap gap-2">
            <Link
              href="/calendar/create"
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
            { label: "Correos",    value: emails.length || "—" },
            { label: "Teléfonos",  value: phones.length || "—" },
            { label: "Especialidad", value: detail.profile.specialty || "—" },
            { label: "Estado",     value: detail.profile.active ? "Activo" : "Inactivo" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="truncate text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
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
            <SectionTitle>Perfil profesional</SectionTitle>
            <InfoRow label="Especialidad">{detail.profile.specialty || "—"}</InfoRow>
            <InfoRow label="Estado">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                detail.profile.active
                  ? "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400"
                  : "bg-gray-100 text-gray-600 dark:bg-white/[0.07] dark:text-gray-400"
              }`}>
                {detail.profile.active ? "Activo" : "Inactivo"}
              </span>
            </InfoRow>
            <InfoRow label="Colaborador desde">{maybeDate(detail.createdAt)}</InfoRow>
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

      {activeTab === "Historial" && (
        <SectionCard>
          <SectionTitle>Citas del colaborador</SectionTitle>
          <RelatedAppointmentsList variant="provider" providerId={detail.id} />
        </SectionCard>
      )}

      {activeTab === "Servicios" && (
        <SectionCard>
          <SectionTitle>Servicios vinculados</SectionTitle>
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12 text-center dark:border-white/[0.08]">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Próximamente</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Los servicios asignados a este colaborador aparecerán aquí.</p>
          </div>
        </SectionCard>
      )}

    </div>
  );
}
