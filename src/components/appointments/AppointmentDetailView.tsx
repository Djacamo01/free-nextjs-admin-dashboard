"use client";

import {
  fetchAppointmentDetails,
  type AppointmentDetails,
  type AppointmentEventItem,
} from "@/api/appointments";
import { ApiHttpError } from "@/api/client";
import AppointmentEditPanel from "@/components/appointments/AppointmentEditPanel";
import AppointmentQuickActionBar from "@/components/appointments/AppointmentQuickActionBar";
import { Modal } from "@/components/ui/modal";
import SpinnerOne from "@/components/ui/spinner/SpinnerOne";
import { labelAppointmentStatus } from "@/constants/publicEnums";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

/* ─── formatters ────────────────────────────────────────────── */

function formatDateLong(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("es", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch { return iso; }
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" }).format(d);
  } catch { return ""; }
}

function formatDateTimeLong(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("es", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(d);
  } catch { return iso; }
}

function formatPriceCrc(value: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency", currency: "CRC",
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(value);
}

function labelSourceChannel(raw: string) {
  const s = raw.trim().toLowerCase();
  if (s === "app" || s === "application") return "Aplicación";
  if (s === "web") return "Web";
  if (s === "whatsapp") return "WhatsApp";
  if (s === "phone" || s === "tel") return "Teléfono";
  return raw || "—";
}

function labelConfirmation(raw: string) {
  const map: Record<string, string> = {
    pending: "Pendiente de confirmar", confirmed: "Confirmada",
    cancelled: "Rechazada o cancelada", declined: "Rechazada",
  };
  return map[raw.trim().toLowerCase()] ?? raw;
}

function eventTypeTitle(type: string | null) {
  const t = (type ?? "").trim().toLowerCase();
  const map: Record<string, string> = {
    created: "Cita registrada", updated: "Cambios guardados",
    cancelled: "Cita cancelada", confirmed: "Cita confirmada",
    rescheduled: "Cita reprogramada", completed: "Cita completada",
    statuschanged: "Estado actualizado", noteadded: "Nota añadida",
  };
  return map[t] ?? (type ? type.charAt(0).toUpperCase() + type.slice(1) : "Actividad");
}

function eventDataAsSentences(data: string | null): string | null {
  if (!data) return null;
  try {
    const o = JSON.parse(data) as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof o.notes === "string" && o.notes.trim()) parts.push(`«${o.notes.trim()}»`);
    if (typeof o.status === "string" && o.status.trim()) parts.push(`Estado: ${labelAppointmentStatus(o.status)}`);
    if (typeof o.startTime === "string") parts.push(`Inicio: ${formatDateTimeLong(o.startTime)}`);
    if (typeof o.endTime === "string") parts.push(`Fin: ${formatDateTimeLong(o.endTime)}`);
    return parts.length > 0 ? parts.join(" · ") : null;
  } catch { return null; }
}

/* ─── status helpers ────────────────────────────────────────── */

function statusColors(status: string): string {
  const s = status.trim().toLowerCase();
  if (s === "confirmed") return "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400";
  if (s === "completed") return "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400";
  if (s.includes("cancel")) return "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400";
  if (s.includes("noshow") || s.includes("no_show")) return "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400";
  return "bg-gray-100 text-gray-700 dark:bg-white/[0.07] dark:text-gray-300";
}

function statusDot(status: string): string {
  const s = status.trim().toLowerCase();
  if (s === "confirmed") return "bg-teal-500";
  if (s === "completed") return "bg-brand-500";
  if (s.includes("cancel")) return "bg-error-500";
  if (s.includes("noshow") || s.includes("no_show")) return "bg-warning-500";
  return "bg-gray-400";
}

/* ─── sub-components ────────────────────────────────────────── */

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.03] sm:p-6 ${className}`}>
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

function PersonCard({
  title,
  name,
  email,
  phone,
  href,
  color = "brand",
}: {
  title: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  href?: string;
  color?: "brand" | "teal";
}) {
  const avatarCls = color === "teal"
    ? "bg-teal-600 dark:bg-teal-500"
    : "bg-brand-500";
  const ini = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  return (
    <div className="flex items-start gap-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ${avatarCls}`}>
        {ini || "?"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{title}</p>
        {href ? (
          <Link href={href} className="block text-base font-semibold text-gray-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400 transition-colors">
            {name}
          </Link>
        ) : (
          <p className="text-base font-semibold text-gray-900 dark:text-white">{name}</p>
        )}
        {email?.trim() && (
          <a href={`mailto:${email}`} className="mt-1 block text-sm text-brand-600 hover:underline dark:text-brand-400 truncate">{email}</a>
        )}
        {phone?.trim() && (
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="block text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400">{phone}</a>
        )}
        {!email?.trim() && !phone?.trim() && (
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Sin contacto registrado.</p>
        )}
      </div>
    </div>
  );
}

const TABS = ["Resumen", "Personas", "Historial"] as const;
type Tab = (typeof TABS)[number];

/* ─── main component ────────────────────────────────────────── */

export default function AppointmentDetailView() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const [data, setData] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Resumen");

  const refreshDetails = useCallback(async (appointmentId: string) => {
    try {
      const full = await fetchAppointmentDetails(appointmentId);
      setData(full);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!id) { setLoading(false); setError("No se encontró la cita en el enlace."); return; }
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const d = await fetchAppointmentDetails(id);
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiHttpError && e.status === 404)
            setError("No encontramos esta cita. Puede haber sido eliminada.");
          else
            setError(e instanceof Error ? e.message : "No se pudo cargar la información.");
          setData(null);
        }
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <SpinnerOne />
        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando cita…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-4 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error ?? "Sin información disponible."}
        </div>
        <Link href="/calendar" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
          ← Volver al calendario
        </Link>
      </div>
    );
  }

  const serviceTitle  = data.service?.name?.trim() || "Cita sin servicio";
  const patientName   = data.patient?.displayName?.trim() || "Sin cliente";
  const providerName  = data.provider?.displayName?.trim() || "Sin colaborador";
  const startDate     = formatDateLong(data.startTime);
  const startTime     = formatTime(data.startTime);
  const endTime       = formatTime(data.endTime);
  const statusLabel   = labelAppointmentStatus(data.status);

  return (
    <div className="w-full min-w-0 space-y-6">

      {/* ── back link ───────────────────────────────────────── */}
      <Link
        href="/calendar"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Citas
      </Link>

      {/* ── hero header ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.03]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

          {/* icon + identity */}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-500 shadow-sm">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors(data.status)}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDot(data.status)}`} />
                  {statusLabel}
                </span>
                {data.confirmationStatus && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/[0.07] dark:text-gray-300">
                    {labelConfirmation(data.confirmationStatus)}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                {serviceTitle}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" d="M8 1.5A6.5 6.5 0 118 14.5 6.5 6.5 0 018 1.5zm0 3v3.5l2.5 1.5"/>
                  </svg>
                  <span className="capitalize">{startDate}</span>
                </span>
                {startTime && endTime && (
                  <span className="text-gray-400">·</span>
                )}
                {startTime && endTime && (
                  <span>{startTime} – {endTime}</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-800 dark:text-gray-200">{patientName}</span>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span>{providerName}</span>
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.333 2.667a1.333 1.333 0 011.887 1.886L4.5 13.273l-2.167.56.56-2.167 8.44-8.999z"/>
              </svg>
              Editar cita
            </button>
          </div>
        </div>

        {/* ── quick stats strip ─── */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 dark:border-white/[0.07] sm:grid-cols-4">
          {[
            { label: "Servicio",  value: data.service?.name || "—" },
            { label: "Duración",  value: data.service ? `${data.service.durationMinutes} min` : "—" },
            { label: "Canal",     value: labelSourceChannel(data.sourceChannel) },
            { label: "Precio ref.", value: data.service?.priceReference != null ? formatPriceCrc(Number(data.service.priceReference)) : "—" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="truncate text-base font-bold text-gray-900 dark:text-white">{s.value}</p>
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
          {/* Detalles de la cita */}
          <SectionCard>
            <SectionTitle>Detalles</SectionTitle>
            {data.service && (
              <>
                <InfoRow label="Servicio">{data.service.name}</InfoRow>
                <InfoRow label="Duración">
                  {data.service.durationMinutes} min
                  {data.service.bufferMinutes > 0 && (
                    <span className="ml-1 text-gray-400 dark:text-gray-500 font-normal">+ {data.service.bufferMinutes} min margen</span>
                  )}
                </InfoRow>
                {data.service.priceReference != null && (
                  <InfoRow label="Precio referencia">
                    <span className="text-brand-600 dark:text-brand-400">{formatPriceCrc(Number(data.service.priceReference))}</span>
                  </InfoRow>
                )}
              </>
            )}
            <InfoRow label="Canal">{labelSourceChannel(data.sourceChannel)}</InfoRow>
            <InfoRow label="Confirmación">{data.confirmationStatus ? labelConfirmation(data.confirmationStatus) : "—"}</InfoRow>
            <InfoRow label="Notas">
              {data.notes?.trim()
                ? <span className="whitespace-pre-wrap">{data.notes.trim()}</span>
                : <span className="text-gray-400 dark:text-gray-500 font-normal">Sin notas.</span>
              }
            </InfoRow>
          </SectionCard>

          {/* Acciones rápidas */}
          <SectionCard>
            <SectionTitle>Acciones rápidas</SectionTitle>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-white/[0.07] dark:bg-white/[0.02]">
              <AppointmentQuickActionBar
                appointment={data}
                onAppointmentUpdated={(a) => void refreshDetails(a.id)}
                blockedHint="Edita la cita para asignar colaborador y servicio antes de usar las acciones rápidas."
                showHeading={false}
              />
            </div>
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              Para cambiar horario, colaborador, servicio o notas usa el botón{" "}
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Editar cita
              </button>.
            </p>
          </SectionCard>
        </div>
      )}

      {activeTab === "Personas" && (
        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          <SectionCard>
            {data.patient ? (
              <PersonCard
                title="Cliente"
                name={data.patient.displayName}
                email={data.patient.primaryEmail}
                phone={data.patient.primaryPhone}
                href={data.patient.id ? `/clientes/${data.patient.id}` : undefined}
                color="brand"
              />
            ) : (
              <div>
                <SectionTitle>Cliente</SectionTitle>
                <p className="text-sm text-gray-400 dark:text-gray-500">Sin cliente asignado.</p>
              </div>
            )}
          </SectionCard>
          <SectionCard>
            {data.provider ? (
              <PersonCard
                title="Colaborador"
                name={data.provider.displayName}
                email={data.provider.primaryEmail}
                phone={data.provider.primaryPhone}
                href={data.provider.id ? `/colaboradores/${data.provider.id}` : undefined}
                color="teal"
              />
            ) : (
              <div>
                <SectionTitle>Colaborador</SectionTitle>
                <p className="text-sm text-gray-400 dark:text-gray-500">Sin colaborador asignado.</p>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {activeTab === "Historial" && (
        <SectionCard>
          <SectionTitle>Actividad de la cita</SectionTitle>
          {data.events.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12 text-center dark:border-white/[0.08]">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Sin movimientos aún</p>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Los cambios de estado y notas aparecerán aquí.</p>
            </div>
          ) : (
            <ul className="space-y-5">
              {data.events.map((ev: AppointmentEventItem) => {
                const sentence = eventDataAsSentences(ev.data);
                return (
                  <li key={ev.id} className="relative border-l-2 border-brand-200 pl-5 dark:border-brand-500/40">
                    <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-brand-400 dark:bg-brand-500" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {eventTypeTitle(ev.eventType)}
                    </p>
                    <time className="mt-0.5 block text-xs text-gray-400 dark:text-gray-500 capitalize">
                      {formatDateTimeLong(ev.createdAt)}
                    </time>
                    {sentence && (
                      <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{sentence}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      )}

      {/* ── edit modal ──────────────────────────────────────── */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        className="max-h-[min(90vh,880px)] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto p-5 sm:p-6 lg:p-8"
      >
        <h3 className="mb-1 pr-10 text-lg font-semibold text-gray-900 dark:text-white">Editar cita</h3>
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          Cambia horario, colaborador, servicio, estado, confirmación y notas.
        </p>
        <AppointmentEditPanel
          appointmentId={data.id}
          data={data}
          onSaved={(next) => { setData(next); setEditOpen(false); }}
        />
      </Modal>

    </div>
  );
}
