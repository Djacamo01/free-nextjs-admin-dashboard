"use client";

import { getTenantSettings, updateTenantSettings, type TenantSettingsDto } from "@/api/tenantSettings";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import SpinnerOne from "@/components/ui/spinner/SpinnerOne";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

/* ─── helpers ───────────────────────────────────────────────── */

const inpCls =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-white dark:placeholder:text-gray-500";

/* ─── CustomSelect ──────────────────────────────────────────── */

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
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 shadow-sm transition hover:border-gray-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-white"
      >
        <span>{selected?.label}</span>
        <svg className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 16 16">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl dark:border-white/[0.10] dark:bg-gray-900">
          <ul className="py-1 max-h-56 overflow-y-auto">
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

/* ─── SectionCard ───────────────────────────────────────────── */

function SectionCard({ icon, title, subtitle, children }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/[0.07] dark:bg-white/[0.03]">
      <div className="flex items-start gap-4 border-b border-gray-100 p-5 dark:border-white/[0.07] sm:p-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
      {children}
    </label>
  );
}

/* ─── constants ─────────────────────────────────────────────── */

const CURRENCY_OPTIONS = [
  { value: "CRC", label: "CRC — Colón costarricense (₡)" },
  { value: "USD", label: "USD — Dólar estadounidense ($)" },
  { value: "EUR", label: "EUR — Euro (€)" },
  { value: "MXN", label: "MXN — Peso mexicano ($)" },
  { value: "COP", label: "COP — Peso colombiano ($)" },
  { value: "ARS", label: "ARS — Peso argentino ($)" },
  { value: "PEN", label: "PEN — Sol peruano (S/)" },
  { value: "CLP", label: "CLP — Peso chileno ($)" },
];

const DATE_FORMAT_OPTIONS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY  (31/12/2025)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY  (12/31/2025)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD  (2025-12-31)" },
];

/* ─── page ──────────────────────────────────────────────────── */

export default function ConfiguracionPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const router = useRouter();
  const [settings, setSettings] = useState<TenantSettingsDto | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const isAdmin = user?.role?.toLowerCase() === "admin";

  useEffect(() => {
    if (!userLoading && user && !isAdmin) {
      router.replace("/");
    }
  }, [userLoading, user, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    getTenantSettings().then(setSettings).catch(() => setError("No se pudo cargar la configuración."));
  }, [isAdmin]);

  const update = (key: keyof TenantSettingsDto, value: string) =>
    setSettings((s) => (s ? { ...s, [key]: value } : s));

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true); setError(null);
    try {
      const updated = await updateTenantSettings(settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("No se pudieron guardar los cambios. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || !user || !settings) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32">
        <SpinnerOne />
        <p className="text-sm text-gray-400 dark:text-gray-500">Cargando configuración…</p>
      </div>
    );
  }

  const labelPreview = `Tu ${settings.clientLabel || "cliente"} tiene una ${settings.appointmentLabel || "cita"} con el ${settings.providerLabel || "colaborador"}.`;

  return (
    <div className="w-full min-w-0 space-y-6">

      {/* page header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 shadow-sm">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
            Configuración
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Personaliza Ordely para tu negocio.
          </p>
        </div>
      </div>

      {/* error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-3 dark:border-error-500/30 dark:bg-error-500/10">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-error-500" fill="none" viewBox="0 0 16 16">
            <path d="M8 1.333A6.667 6.667 0 108 14.667 6.667 6.667 0 008 1.333zM8 5.333v3.334M8 10h.007" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
        </div>
      )}

      {/* ── Terminología ────────────────────────────────────── */}
      <SectionCard
        title="Terminología"
        subtitle="Adapta el lenguaje de la interfaz a tu vertical (clínica, salón, estudio, etc.)."
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        }
      >
        <div className="space-y-5">
          {/* preview */}
          <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 dark:border-brand-500/20 dark:bg-brand-500/[0.06]">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-brand-400 dark:text-brand-500">Vista previa</p>
            <p className="text-sm text-brand-800 dark:text-brand-200">{labelPreview}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Clientes */}
            <div className="space-y-3 rounded-xl border border-gray-100 p-4 dark:border-white/[0.06]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Clientes</p>
              <div>
                <FieldLabel>Singular</FieldLabel>
                <input
                  type="text"
                  value={settings.clientLabel}
                  onChange={(e) => update("clientLabel", e.target.value)}
                  placeholder="cliente"
                  className={inpCls}
                />
              </div>
              <div>
                <FieldLabel>Plural</FieldLabel>
                <input
                  type="text"
                  value={settings.clientPluralLabel}
                  onChange={(e) => update("clientPluralLabel", e.target.value)}
                  placeholder="clientes"
                  className={inpCls}
                />
              </div>
            </div>

            {/* Colaboradores */}
            <div className="space-y-3 rounded-xl border border-gray-100 p-4 dark:border-white/[0.06]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Colaboradores</p>
              <div>
                <FieldLabel>Singular</FieldLabel>
                <input
                  type="text"
                  value={settings.providerLabel}
                  onChange={(e) => update("providerLabel", e.target.value)}
                  placeholder="colaborador"
                  className={inpCls}
                />
              </div>
              <div>
                <FieldLabel>Plural</FieldLabel>
                <input
                  type="text"
                  value={settings.providerPluralLabel}
                  onChange={(e) => update("providerPluralLabel", e.target.value)}
                  placeholder="colaboradores"
                  className={inpCls}
                />
              </div>
            </div>

            {/* Citas */}
            <div className="space-y-3 rounded-xl border border-gray-100 p-4 dark:border-white/[0.06]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Citas</p>
              <div>
                <FieldLabel>Singular</FieldLabel>
                <input
                  type="text"
                  value={settings.appointmentLabel}
                  onChange={(e) => update("appointmentLabel", e.target.value)}
                  placeholder="cita"
                  className={inpCls}
                />
              </div>
              <div>
                <FieldLabel>Plural</FieldLabel>
                <input
                  type="text"
                  value={settings.appointmentPluralLabel}
                  onChange={(e) => update("appointmentPluralLabel", e.target.value)}
                  placeholder="citas"
                  className={inpCls}
                />
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Región y formato ─────────────────────────────────── */}
      <SectionCard
        title="Región y formato"
        subtitle="Moneda y formato de fechas que se mostrarán en la interfaz."
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Moneda</FieldLabel>
            <CustomSelect
              options={CURRENCY_OPTIONS}
              value={settings.currencyCode}
              onChange={(v) => update("currencyCode", v)}
            />
          </div>
          <div>
            <FieldLabel>Formato de fecha</FieldLabel>
            <CustomSelect
              options={DATE_FORMAT_OPTIONS}
              value={settings.dateFormat}
              onChange={(v) => update("dateFormat", v)}
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Apariencia ──────────────────────────────────────── */}
      <SectionCard
        title="Apariencia"
        subtitle="Color de marca y URL del logo de tu negocio."
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
          </svg>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Color principal</FieldLabel>
            <div className="flex items-center gap-3">
              <label className="relative cursor-pointer">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => update("primaryColor", e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 shadow-sm dark:border-white/[0.12]"
                  style={{ background: settings.primaryColor }}
                />
              </label>
              <input
                type="text"
                value={settings.primaryColor}
                onChange={(e) => update("primaryColor", e.target.value)}
                placeholder="#7c3aed"
                className={`${inpCls} font-mono`}
              />
            </div>
            {/* swatch row */}
            <div className="mt-2.5 flex items-center gap-1.5">
              {["#7c3aed","#2563eb","#0d9488","#dc2626","#d97706","#16a34a","#db2777"].map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => update("primaryColor", c)}
                  className={`h-6 w-6 rounded-full border-2 transition hover:scale-110 ${settings.primaryColor === c ? "border-gray-900 dark:border-white" : "border-transparent"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <FieldLabel>URL del logo</FieldLabel>
            <input
              type="url"
              value={settings.logoUrl ?? ""}
              onChange={(e) => update("logoUrl", e.target.value)}
              placeholder="https://tu-negocio.com/logo.png"
              className={inpCls}
            />
            {settings.logoUrl && (
              <div className="mt-2.5 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-white/[0.07] dark:bg-white/[0.03]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={settings.logoUrl} alt="Logo preview" className="h-full w-full object-contain" />
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── save bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.03]">
        <div>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success-600 dark:text-success-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16">
                <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Cambios guardados
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? (
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
              Guardar cambios
            </>
          )}
        </button>
      </div>

    </div>
  );
}
