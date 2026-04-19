"use client";

import { ClientHttpError, createPatient } from "@/api";
import {
  CHANNEL_CODE_BY_TYPE,
  CHANNEL_TYPE,
  CHANNEL_TYPE_LABELS,
  type ChannelType,
} from "@/constants/publicEnums";
import React, { useEffect, useRef, useState, useCallback } from "react";

/* ─── multi-entry types ─────────────────────────────────────── */

type EmailEntry = { id: string; value: string; isPrimary: boolean };
type PhoneEntry = { id: string; value: string; isPrimary: boolean };

let _uid = 0;
function uid() { return String(++_uid); }

/* ─── style constants ───────────────────────────────────────── */

const inpCls =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-white dark:placeholder:text-gray-500";

/* ─── CustomSelect ──────────────────────────────────────────── */

function CustomSelect({
  options, value, onChange, disabled = false,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
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
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 shadow-sm transition hover:border-gray-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-white dark:hover:border-white/[0.18]"
      >
        <span>{selected?.label}</span>
        <svg className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 16 16">
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

/* ─── Toggle ────────────────────────────────────────────────── */

function Toggle({ checked, onChange, label, disabled = false }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 disabled:opacity-50"
    >
      <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-brand-500" : "bg-gray-200 dark:bg-white/[0.12]"}`}>
        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </span>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</span>
    </button>
  );
}

/* ─── MultiEntryList ────────────────────────────────────────── */

function MultiEntryList({
  entries,
  onChange,
  placeholder,
  type = "text",
  addLabel,
  disabled = false,
}: {
  entries: (EmailEntry | PhoneEntry)[];
  onChange: (entries: (EmailEntry | PhoneEntry)[]) => void;
  placeholder: string;
  type?: string;
  addLabel: string;
  disabled?: boolean;
}) {
  const setPrimary = (id: string) => {
    onChange(entries.map((e) => ({ ...e, isPrimary: e.id === id })));
  };

  const setVal = (id: string, value: string) => {
    onChange(entries.map((e) => e.id === id ? { ...e, value } : e));
  };

  const remove = (id: string) => {
    const next = entries.filter((e) => e.id !== id);
    // ensure one primary
    if (next.length > 0 && !next.some((e) => e.isPrimary)) {
      next[0] = { ...next[0], isPrimary: true };
    }
    onChange(next);
  };

  const add = () => {
    onChange([...entries, { id: uid(), value: "", isPrimary: entries.length === 0 }]);
  };

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-center gap-2">
          {/* primary radio */}
          <button
            type="button"
            title="Marcar como principal"
            disabled={disabled}
            onClick={() => setPrimary(entry.id)}
            className={`shrink-0 flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
              entry.isPrimary
                ? "border-brand-500 bg-brand-500"
                : "border-gray-300 bg-white hover:border-brand-400 dark:border-white/[0.20] dark:bg-white/[0.05]"
            }`}
          >
            {entry.isPrimary && (
              <span className="h-2 w-2 rounded-full bg-white" />
            )}
          </button>

          {/* input */}
          <input
            type={type}
            value={entry.value}
            onChange={(e) => setVal(entry.id, e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`${inpCls} flex-1`}
          />

          {/* primary label */}
          {entry.isPrimary && (
            <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              Principal
            </span>
          )}

          {/* remove */}
          {entries.length > 1 && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => remove(entry.id)}
              className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-error-500 dark:hover:bg-white/[0.06] dark:hover:text-error-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        disabled={disabled}
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-600 transition hover:bg-brand-50 disabled:opacity-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 14 14">
          <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        {addLabel}
      </button>
    </div>
  );
}

/* ─── FieldLabel ────────────────────────────────────────────── */

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
      {children}
      {required && <span className="text-error-500">*</span>}
    </label>
  );
}

/* ─── StepCard ──────────────────────────────────────────────── */

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.03] sm:p-6">
      {children}
    </div>
  );
}

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

/* ─── channel icons ─────────────────────────────────────────── */

const CHANNEL_ICONS: Record<ChannelType, React.ReactNode> = {
  whatsapp: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.528 5.859L.054 23.514a.5.5 0 00.614.612l5.807-1.459A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.695-.502-5.243-1.381l-.374-.217-3.882.976.995-3.77-.235-.386A9.945 9.945 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  ),
  email: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  ),
  sms: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  ),
  webchat: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.228 2.707-2.828V8.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 5.25c-2.392 0-4.744.175-7.043.513C3.373 5.746 2.25 7.14 2.25 8.741v4.01z" />
    </svg>
  ),
};

const CHANNEL_OPTIONS = CHANNEL_TYPE.map((c) => ({
  value: c,
  label: CHANNEL_TYPE_LABELS[c],
}));

const CHANNEL_CODE_OPTIONS = CHANNEL_TYPE.map((c) => ({
  value: String(CHANNEL_CODE_BY_TYPE[c]),
  label: `${CHANNEL_TYPE_LABELS[c]}`,
}));

/* ─── props ─────────────────────────────────────────────────── */

export type PatientCreateFormProps = {
  onSuccess: () => void;
  onCancel?: () => void;
};

/* ─── main form ─────────────────────────────────────────────── */

export default function PatientCreateForm({ onSuccess, onCancel }: PatientCreateFormProps) {
  const [displayName,      setDisplayName]      = useState("");
  const [preferredChannel, setPreferredChannel] = useState<ChannelType>("whatsapp");
  const [notes,            setNotes]            = useState("");
  const [emails,           setEmails]           = useState<EmailEntry[]>([{ id: uid(), value: "", isPrimary: true }]);
  const [phones,           setPhones]           = useState<PhoneEntry[]>([{ id: uid(), value: "", isPrimary: true }]);
  const [linkChannel,      setLinkChannel]      = useState(false);
  const [channelCode,      setChannelCode]      = useState<number>(CHANNEL_CODE_BY_TYPE["whatsapp"]);
  const [externalUserId,   setExternalUserId]   = useState("");
  const [submitting,       setSubmitting]       = useState(false);
  const [error,            setError]            = useState<string | null>(null);
  const [success,          setSuccess]          = useState(false);

  const setEmailsCast  = useCallback((v: (EmailEntry | PhoneEntry)[]) => setEmails(v as EmailEntry[]),  []);
  const setPhonesCast  = useCallback((v: (EmailEntry | PhoneEntry)[]) => setPhones(v as PhoneEntry[]),  []);

  function reset() {
    setDisplayName(""); setPreferredChannel("whatsapp"); setNotes("");
    setEmails([{ id: uid(), value: "", isPrimary: true }]);
    setPhones([{ id: uid(), value: "", isPrimary: true }]);
    setLinkChannel(false); setChannelCode(CHANNEL_CODE_BY_TYPE["whatsapp"]);
    setExternalUserId(""); setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = displayName.trim();
    if (!name) { setError("El nombre o razón social es obligatorio."); return; }
    if (linkChannel && !externalUserId.trim()) {
      setError("Indica el ID externo del canal (p.ej. número de teléfono).");
      return;
    }

    const validEmails = emails.filter((e) => e.value.trim());
    const validPhones = phones.filter((p) => p.value.trim());

    setSubmitting(true);
    try {
      await createPatient({
        displayName: name,
        relatedContactId: null,
        preferredChannel,
        notes: notes.trim(),
        emailAddresses: validEmails.map((e) => ({ email: e.value.trim(), isPrimary: e.isPrimary })),
        phoneNumbers:   validPhones.map((p) => ({ phone: p.value.trim(), isPrimary: p.isPrimary })),
        channelIdentities: linkChannel && externalUserId.trim()
          ? [{ channel: channelCode, externalUserId: externalUserId.trim() }]
          : [],
      });
      setSuccess(true);
      setTimeout(() => { reset(); onSuccess(); }, 700);
    } catch (err) {
      setError(err instanceof ClientHttpError ? err.message : "No se pudo crear el cliente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-success-200 bg-success-50 p-16 text-center dark:border-success-500/30 dark:bg-success-500/[0.06]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/20">
          <svg className="h-7 w-7 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <p className="text-base font-semibold text-success-800 dark:text-success-300">¡Cliente creado exitosamente!</p>
        <p className="text-sm text-success-600 dark:text-success-400">Redirigiendo…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-3 dark:border-error-500/30 dark:bg-error-500/10">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-error-500" fill="none" viewBox="0 0 16 16">
            <path d="M8 1.333A6.667 6.667 0 108 14.667 6.667 6.667 0 008 1.333zM8 5.333v3.334M8 10h.007" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
        </div>
      )}

      {/* ── Step 1: Identidad ───────────────────────────────── */}
      <StepCard>
        <StepHeader number={1} title="Identidad" subtitle="¿Cómo se llama y por dónde prefiere que le contacten?" />
        <div className="space-y-4">
          <div>
            <FieldLabel required>Nombre completo</FieldLabel>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ej. María García López"
              disabled={submitting}
              required
              className={inpCls}
            />
          </div>

          {/* channel picker — visual cards */}
          <div>
            <FieldLabel>Canal preferido</FieldLabel>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CHANNEL_OPTIONS.map((opt) => {
                const active = preferredChannel === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPreferredChannel(opt.value as ChannelType)}
                    disabled={submitting}
                    className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-xs font-medium transition ${
                      active
                        ? "border-brand-400 bg-brand-50 text-brand-700 shadow-sm dark:border-brand-500/60 dark:bg-brand-500/10 dark:text-brand-300"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50 dark:border-white/[0.10] dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className={active ? "text-brand-500 dark:text-brand-400" : "text-gray-400 dark:text-gray-500"}>
                      {CHANNEL_ICONS[opt.value as ChannelType]}
                    </span>
                    {opt.label}
                    {active && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500">
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 10 10">
                          <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </StepCard>

      {/* ── Step 2: Correo y teléfono ───────────────────────── */}
      <StepCard>
        <StepHeader number={2} title="Correos y teléfonos" subtitle="Opcional. El círculo selecciona cuál es el principal." />
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <FieldLabel>Correos electrónicos</FieldLabel>
            <MultiEntryList
              entries={emails}
              onChange={setEmailsCast}
              type="email"
              placeholder="correo@ejemplo.com"
              addLabel="Agregar correo"
              disabled={submitting}
            />
          </div>
          <div>
            <FieldLabel>Teléfonos</FieldLabel>
            <MultiEntryList
              entries={phones}
              onChange={setPhonesCast}
              type="tel"
              placeholder="+506 8888 7777"
              addLabel="Agregar teléfono"
              disabled={submitting}
            />
          </div>
        </div>
      </StepCard>

      {/* ── Step 3: Canal externo ───────────────────────────── */}
      <StepCard>
        <StepHeader number={3} title="Canal externo" subtitle="Opcional. Vincula un ID de WhatsApp, webchat u otro canal." />
        <Toggle
          checked={linkChannel}
          onChange={setLinkChannel}
          label="Vincular ID de canal externo"
          disabled={submitting}
        />
        {linkChannel && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Canal</FieldLabel>
              <CustomSelect
                options={CHANNEL_CODE_OPTIONS}
                value={String(channelCode)}
                onChange={(v) => setChannelCode(Number(v))}
                disabled={submitting}
              />
            </div>
            <div>
              <FieldLabel required>ID externo</FieldLabel>
              <input
                type="text"
                value={externalUserId}
                onChange={(e) => setExternalUserId(e.target.value)}
                placeholder="Ej. 50688887777"
                disabled={submitting}
                className={inpCls}
              />
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                Para WhatsApp usa el número con código de país, sin el +.
              </p>
            </div>
          </div>
        )}
      </StepCard>

      {/* ── Step 4: Notas ───────────────────────────────────── */}
      <StepCard>
        <StepHeader number={4} title="Notas internas" subtitle="Opcional. Preferencias, alergias, contexto del cliente." />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          disabled={submitting}
          placeholder="Ej. Prefiere citas por la mañana. Alérgica a la lavanda."
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-white dark:placeholder:text-gray-500"
        />
      </StepCard>

      {/* ── submit bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.03]">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Los campos marcados con <span className="text-error-500">*</span> son obligatorios.
        </p>
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={() => { if (!submitting) { reset(); onCancel(); } }}
              disabled={submitting}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/[0.12] dark:text-gray-400 dark:hover:bg-white/[0.04]"
            >
              Cancelar
            </button>
          )}
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
                Crear cliente
              </>
            )}
          </button>
        </div>
      </div>

    </form>
  );
}
