"use client";

import {
  createAppointment,
  type CreateAppointmentRequest,
} from "@/api/appointments";
import { fetchPatients, type Patient } from "@/api/patients";
import { fetchProviders, type Provider } from "@/api/providers";
import { fetchServices, type Service } from "@/api/services";
import { ApiHttpError } from "@/api/client";
import SpinnerOne from "@/components/ui/spinner/SpinnerOne";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ─── constants ─────────────────────────────────────────────── */

const STATUS_OPTIONS = [
  { value: "Scheduled",   label: "Programada"   },
  { value: "Confirmed",   label: "Confirmada"   },
  { value: "Completed",   label: "Completada"   },
  { value: "Cancelled",   label: "Cancelada"    },
  { value: "NoShow",      label: "No asistió"   },
  { value: "Rescheduled", label: "Reprogramada" },
];

const CHANNEL_OPTIONS = [
  { value: "App",      label: "Aplicación" },
  { value: "Web",      label: "Web"        },
  { value: "WhatsApp", label: "WhatsApp"   },
  { value: "Phone",    label: "Teléfono"   },
  { value: "Other",    label: "Otro"       },
];

const CONFIRMATION_OPTIONS = [
  { value: "Pending",   label: "Pendiente de confirmar" },
  { value: "Confirmed", label: "Confirmada"             },
  { value: "Cancelled", label: "Cancelada / Rechazada"  },
];

/* ─── helpers ───────────────────────────────────────────────── */

function toLocalInputValue(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function formatPrice(val: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency", currency: "CRC", minimumFractionDigits: 0,
  }).format(val);
}

function formatDateTimeShort(local: string) {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("es", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  }).format(d);
}

function initials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

/* ─── ComboSelect (search + pick) ───────────────────────────── */

interface ComboOption { id: string; label: string; sublabel?: string; }

function ComboSelect({
  options, value, onChange, placeholder, showAvatar = false,
}: {
  options: ComboOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  showAvatar?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open,  setOpen]  = useState(false);
  const containerRef      = useRef<HTMLDivElement>(null);
  const inputRef          = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 40);
    return options.filter((o) =>
      o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q)
    ).slice(0, 40);
  }, [options, query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (opt: ComboOption) => {
    onChange(opt.id);
    setQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div ref={containerRef} className="relative">
      {selected ? (
        <div className="flex h-11 items-center gap-2.5 rounded-xl border border-brand-300 bg-brand-50/60 px-3.5 shadow-sm dark:border-brand-500/40 dark:bg-brand-500/[0.08]">
          {showAvatar && (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
              {initials(selected.label)}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">
            {selected.label}
          </span>
          {selected.sublabel && (
            <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">{selected.sublabel}</span>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 rounded-full p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 14 14">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      ) : (
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16">
              <path d="M7 13A6 6 0 107 1a6 6 0 000 12zM13.5 13.5l-2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-white dark:placeholder:text-gray-500"
          />
        </div>
      )}

      {open && !selected && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl dark:border-white/[0.10] dark:bg-gray-900">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">
              {query.trim() ? `Sin resultados para «${query.trim()}»` : "No hay opciones disponibles."}
            </p>
          ) : (
            <ul className="max-h-56 overflow-y-auto py-1">
              {filtered.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    onMouseDown={() => handleSelect(opt)}
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.05]"
                  >
                    {showAvatar && (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                        {initials(opt.label)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="block text-xs text-gray-400 dark:text-gray-500">{opt.sublabel}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── CustomSelect (fixed options, no search) ───────────────── */

function CustomSelect({
  options, value, onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 shadow-sm transition hover:border-gray-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-white dark:hover:border-white/[0.18]"
      >
        <span>{selected?.label}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 16 16"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl dark:border-white/[0.10] dark:bg-gray-900">
          <ul className="py-1">
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onMouseDown={() => { onChange(opt.value); setOpen(false); }}
                  className={`flex w-full items-center justify-between px-3.5 py-2.5 text-sm transition ${
                    opt.value === value
                      ? "bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                      : "text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/[0.05]"
                  }`}
                >
                  {opt.label}
                  {opt.value === value && (
                    <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 16 16">
                      <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── step components ───────────────────────────────────────── */

function StepHeader({ number, title, subtitle }: { number: number; title: string; subtitle?: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white shadow-sm">
        {number}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
      {children}
      {required && <span className="text-error-500">*</span>}
    </label>
  );
}

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.03] sm:p-6">
      {children}
    </div>
  );
}

/* ─── live summary bar ──────────────────────────────────────── */

function SummaryBar({
  patient, provider, service, startLocal, endLocal,
}: {
  patient: Patient | undefined;
  provider: Provider | undefined;
  service: Service | undefined;
  startLocal: string;
  endLocal: string;
}) {
  const hasAny = patient || provider || service || startLocal;
  if (!hasAny) return null;

  const startStr = startLocal ? formatDateTimeShort(startLocal) : null;
  const endTime  = endLocal
    ? new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" }).format(new Date(endLocal))
    : null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3 dark:border-brand-500/20 dark:bg-brand-500/[0.06]">
      <svg className="h-4 w-4 shrink-0 text-brand-500" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 2v1.5M12 2v1.5M1.5 6.5h13M2 3h12a1 1 0 011 1v9a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z"/>
      </svg>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-700 dark:text-brand-300">
        {patient && (
          <span className="flex items-center gap-1">
            <span className="text-brand-400 dark:text-brand-500">Cliente:</span>
            <span className="font-semibold">{patient.name}</span>
          </span>
        )}
        {provider && (
          <span className="flex items-center gap-1">
            <span className="text-brand-400 dark:text-brand-500">Colaborador:</span>
            <span className="font-semibold">{provider.name}</span>
          </span>
        )}
        {service && (
          <span className="flex items-center gap-1">
            <span className="text-brand-400 dark:text-brand-500">Servicio:</span>
            <span className="font-semibold">{service.name}</span>
          </span>
        )}
        {startStr && (
          <span className="flex items-center gap-1">
            <span className="text-brand-400 dark:text-brand-500">Inicio:</span>
            <span className="font-semibold capitalize">{startStr}</span>
            {endTime && <span className="font-semibold">– {endTime}</span>}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── main form ─────────────────────────────────────────────── */

type Props = { onCreated?: () => void };

export default function AppointmentCreateForm({ onCreated }: Props) {
  const [patients,    setPatients]    = useState<Patient[]>([]);
  const [providers,   setProviders]   = useState<Provider[]>([]);
  const [services,    setServices]    = useState<Service[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [success,     setSuccess]     = useState(false);

  const [patientId,          setPatientId]         = useState("");
  const [providerId,         setProviderId]         = useState("");
  const [serviceId,          setServiceId]          = useState("");
  const [startLocal,         setStartLocal]         = useState("");
  const [endLocal,           setEndLocal]           = useState("");
  const [status,             setStatus]             = useState("Scheduled");
  const [sourceChannel,      setSourceChannel]      = useState("App");
  const [confirmationStatus, setConfirmationStatus] = useState("Pending");
  const [notes,              setNotes]              = useState("");

  const selectedPatient  = useMemo(() => patients.find((p) => p.id === patientId),   [patients, patientId]);
  const selectedProvider = useMemo(() => providers.find((p) => p.id === providerId), [providers, providerId]);
  const selectedService  = useMemo(() => services.find((s) => s.id === serviceId),   [services, serviceId]);

  const patientOptions  = useMemo<ComboOption[]>(() => patients.map((p)  => ({ id: p.id, label: p.name, sublabel: p.email || undefined })), [patients]);
  const providerOptions = useMemo<ComboOption[]>(() => providers.map((p) => ({ id: p.id, label: p.name, sublabel: p.specialty || undefined })), [providers]);
  const serviceOptions  = useMemo<ComboOption[]>(() => services.map((s)  => ({ id: s.id, label: s.name, sublabel: `${s.durationMinutes} min` })), [services]);

  const loadMeta = useCallback(async () => {
    setLoadingMeta(true);
    setError(null);
    try {
      const [p, r, s] = await Promise.all([fetchPatients(), fetchProviders(), fetchServices()]);
      setPatients(p);
      setProviders(r.filter((x) => x.active !== false));
      setServices(s.filter((x) => x.active !== false));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar catálogos.");
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => { void loadMeta(); }, [loadMeta]);

  const applyDurationFromService = useCallback(() => {
    if (!startLocal || !selectedService) return;
    const start = new Date(fromLocalInputValue(startLocal));
    if (Number.isNaN(start.getTime())) return;
    const mins = selectedService.durationMinutes + selectedService.bufferMinutes;
    setEndLocal(toLocalInputValue(new Date(start.getTime() + mins * 60_000).toISOString()));
  }, [startLocal, selectedService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const startTime = fromLocalInputValue(startLocal);
    const endTime   = fromLocalInputValue(endLocal);
    if (!patientId || !providerId || !serviceId) {
      setError("Elige cliente, colaborador y servicio.");
      return;
    }
    if (!startTime || !endTime) {
      setError("Indica la fecha y hora de inicio y fin.");
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      setError("La hora de fin debe ser posterior a la de inicio.");
      return;
    }

    const body: CreateAppointmentRequest = {
      patientId, providerId, serviceId,
      startTime, endTime, status,
      sourceChannel: sourceChannel.trim() || "App",
      confirmationStatus: confirmationStatus.trim() || "Pending",
      notes: notes.trim(),
    };

    setSubmitting(true);
    try {
      await createAppointment(body);
      setSuccess(true);
      setTimeout(() => { onCreated?.(); }, 800);
    } catch (err) {
      if (err instanceof ApiHttpError) {
        if (err.status === 409) {
          setError("Ese horario se solapa con otra cita del mismo colaborador. Elige otro intervalo.");
        } else {
          try {
            const j = JSON.parse(err.bodyText ?? "{}") as { message?: string; Message?: string };
            setError(j.message ?? j.Message ?? err.message);
          } catch { setError(err.message); }
        }
      } else {
        setError(err instanceof Error ? err.message : "Error al crear la cita.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMeta) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-100 bg-white p-16 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.03]">
        <SpinnerOne />
        <p className="text-sm text-gray-400 dark:text-gray-500">Cargando catálogos…</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-success-200 bg-success-50 p-16 text-center dark:border-success-500/30 dark:bg-success-500/[0.06]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/20">
          <svg className="h-7 w-7 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <p className="text-base font-semibold text-success-800 dark:text-success-300">¡Cita creada exitosamente!</p>
        <p className="text-sm text-success-600 dark:text-success-400">Redirigiendo al calendario…</p>
      </div>
    );
  }

  const inpCls = "h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-white";

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">

      {/* live summary */}
      <SummaryBar
        patient={selectedPatient}
        provider={selectedProvider}
        service={selectedService}
        startLocal={startLocal}
        endLocal={endLocal}
      />

      {/* error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-3 dark:border-error-500/30 dark:bg-error-500/10">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-error-500" fill="none" viewBox="0 0 16 16">
            <path d="M8 1.333A6.667 6.667 0 108 14.667 6.667 6.667 0 008 1.333zM8 5.333v3.334M8 10h.007" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
        </div>
      )}

      {/* ── Step 1: Personas ────────────────────────────────── */}
      <StepCard>
        <StepHeader number={1} title="Personas" subtitle="¿Quién atiende a quién?" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required>Cliente</FieldLabel>
            <ComboSelect
              options={patientOptions}
              value={patientId}
              onChange={setPatientId}
              placeholder="Buscar cliente por nombre…"
              showAvatar
            />
          </div>
          <div>
            <FieldLabel required>Colaborador</FieldLabel>
            <ComboSelect
              options={providerOptions}
              value={providerId}
              onChange={setProviderId}
              placeholder="Buscar colaborador por nombre…"
              showAvatar
            />
          </div>
        </div>
      </StepCard>

      {/* ── Step 2: Servicio y horario ───────────────────────── */}
      <StepCard>
        <StepHeader number={2} title="Servicio y horario" subtitle="¿Qué se hace y cuándo?" />
        <div className="space-y-4">
          <div>
            <FieldLabel required>Servicio</FieldLabel>
            <ComboSelect
              options={serviceOptions}
              value={serviceId}
              onChange={setServiceId}
              placeholder="Buscar servicio…"
            />
            {selectedService && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 12 12">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M6 3.5v3l1.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  {selectedService.durationMinutes} min
                  {selectedService.bufferMinutes > 0 && ` + ${selectedService.bufferMinutes} min margen`}
                </span>
                {selectedService.priceReference != null && (
                  <span className="inline-flex items-center rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-300">
                    {formatPrice(Number(selectedService.priceReference))}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel required>Inicio</FieldLabel>
              <input
                type="datetime-local"
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
                required
                className={inpCls}
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <FieldLabel required>Fin</FieldLabel>
                <button
                  type="button"
                  onClick={applyDurationFromService}
                  disabled={!selectedService || !startLocal}
                  className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-semibold text-brand-600 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
                >
                  Aplicar duración
                </button>
              </div>
              <input
                type="datetime-local"
                value={endLocal}
                onChange={(e) => setEndLocal(e.target.value)}
                required
                className={inpCls}
              />
            </div>
          </div>
        </div>
      </StepCard>

      {/* ── Step 3: Detalles adicionales ────────────────────── */}
      <StepCard>
        <StepHeader number={3} title="Detalles adicionales" subtitle="Estado, canal y notas." />
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel>Estado</FieldLabel>
              <CustomSelect options={STATUS_OPTIONS} value={status} onChange={setStatus} />
            </div>
            <div>
              <FieldLabel>Canal de origen</FieldLabel>
              <CustomSelect options={CHANNEL_OPTIONS} value={sourceChannel} onChange={setSourceChannel} />
            </div>
            <div>
              <FieldLabel>Confirmación</FieldLabel>
              <CustomSelect options={CONFIRMATION_OPTIONS} value={confirmationStatus} onChange={setConfirmationStatus} />
            </div>
          </div>
          <div>
            <FieldLabel>Notas internas</FieldLabel>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Indicaciones especiales, observaciones del cliente…"
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-white dark:placeholder:text-gray-500"
            />
          </div>
        </div>
      </StepCard>

      {/* ── submit ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.03]">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Los campos marcados con <span className="text-error-500">*</span> son obligatorios.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 16 16">
                <circle className="opacity-25" cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2"/>
                <path className="opacity-75" d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Guardando…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M2 8h12M9 3l5 5-5 5"/>
              </svg>
              Crear cita
            </>
          )}
        </button>
      </div>

    </form>
  );
}
