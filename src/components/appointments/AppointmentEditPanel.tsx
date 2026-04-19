"use client";

import {
  fetchAppointmentDetails,
  updateAppointment,
  type AppointmentDetails,
  type UpdateAppointmentRequest,
} from "@/api/appointments";
import { ApiHttpError } from "@/api/client";
import { fetchProviders, type Provider } from "@/api/providers";
import { fetchServices, type Service } from "@/api/services";
import AppointmentCancelConfirmModal from "@/components/appointments/AppointmentCancelConfirmModal";
import Button from "@/components/ui/button/Button";
import { labelAppointmentStatus } from "@/constants/publicEnums";
import React, { useCallback, useEffect, useMemo, useState } from "react";

/** Mismos valores que `AppointmentCreateForm` (Enum C#). */
const APPOINTMENT_STATUS_OPTIONS = [
  { value: "Scheduled", label: "Programada" },
  { value: "Confirmed", label: "Confirmada" },
  { value: "Cancelled", label: "Cancelada" },
  { value: "Completed", label: "Completada" },
  { value: "NoShow", label: "No asistió" },
  { value: "Rescheduled", label: "Reprogramada" },
] as const;

const CONFIRMATION_OPTIONS = [
  { value: "Pending", label: "Pendiente de confirmar" },
  { value: "Confirmed", label: "Confirmada" },
  { value: "Declined", label: "Rechazada" },
] as const;

const API_STATUS_TO_FORM: Record<string, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "NoShow",
  rescheduled: "Rescheduled",
};

const API_CONFIRM_TO_FORM: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  declined: "Declined",
  cancelled: "Declined",
};

function toFormStatus(api: string): string {
  const k = api.trim().toLowerCase();
  return API_STATUS_TO_FORM[k] ?? api;
}

function toFormConfirmation(api: string): string {
  const k = api.trim().toLowerCase();
  return API_CONFIRM_TO_FORM[k] ?? api;
}

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

type Props = {
  appointmentId: string;
  data: AppointmentDetails;
  onSaved: (next: AppointmentDetails) => void;
};

export default function AppointmentEditPanel({
  appointmentId,
  data,
  onSaved,
}: Props) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const [providerId, setProviderId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");
  const [status, setStatus] = useState("Scheduled");
  const [confirmationStatus, setConfirmationStatus] = useState("Pending");
  const [notes, setNotes] = useState("");

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  );

  const loadMeta = useCallback(async () => {
    setLoadingMeta(true);
    setError(null);
    try {
      const [r, s] = await Promise.all([fetchProviders(), fetchServices()]);
      setProviders(r.filter((x) => x.active !== false));
      setServices(s.filter((x) => x.active !== false));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar proveedores o servicios."
      );
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    setProviderId(data.providerId ?? "");
    setServiceId(data.serviceId ?? "");
    setStartLocal(toLocalInputValue(data.startTime));
    setEndLocal(toLocalInputValue(data.endTime));
    setStatus(toFormStatus(data.status));
    setConfirmationStatus(toFormConfirmation(data.confirmationStatus));
    setNotes(data.notes ?? "");
  }, [
    data.id,
    data.providerId,
    data.serviceId,
    data.startTime,
    data.endTime,
    data.status,
    data.confirmationStatus,
    data.notes,
  ]);

  const applyDurationFromService = useCallback(() => {
    if (!startLocal || !selectedService) return;
    const start = new Date(fromLocalInputValue(startLocal));
    if (Number.isNaN(start.getTime())) return;
    const mins =
      selectedService.durationMinutes + selectedService.bufferMinutes;
    const end = new Date(start.getTime() + mins * 60_000);
    setEndLocal(toLocalInputValue(end.toISOString()));
  }, [startLocal, selectedService]);

  const persist = async (
    body: UpdateAppointmentRequest,
    opts?: { throwOnError?: boolean }
  ) => {
    setSaving(true);
    setError(null);
    try {
      await updateAppointment(appointmentId, body);
      const full = await fetchAppointmentDetails(appointmentId);
      onSaved(full);
    } catch (e) {
      const msg =
        e instanceof ApiHttpError
          ? e.message || `Error ${e.status}`
          : e instanceof Error
            ? e.message
            : "No se pudo guardar.";
      setError(msg);
      if (opts?.throwOnError) throw e;
    } finally {
      setSaving(false);
    }
  };

  const buildBody = (): UpdateAppointmentRequest | null => {
    const startTime = fromLocalInputValue(startLocal);
    const endTime = fromLocalInputValue(endLocal);
    if (!providerId || !serviceId) {
      setError("Elige proveedor y servicio.");
      return null;
    }
    if (!startTime || !endTime) {
      setError("Indica inicio y fin.");
      return null;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      setError("La hora de fin debe ser posterior a la de inicio.");
      return null;
    }
    return {
      providerId,
      serviceId,
      startTime,
      endTime,
      status: status.trim() || "Scheduled",
      confirmationStatus: confirmationStatus.trim() || "Pending",
      notes: notes.trim(),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = buildBody();
    if (!body) return;
    await persist(body);
  };

  const statusOptionValues = new Set<string>(
    APPOINTMENT_STATUS_OPTIONS.map((o) => o.value)
  );
  const confirmationOptionValues = new Set<string>(
    CONFIRMATION_OPTIONS.map((o) => o.value)
  );

  const selCls = "h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-white";
  const inpCls = "h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-white";
  const chevron = (
    <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 16 16">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-3 dark:border-error-500/30 dark:bg-error-500/10">
          <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
        </div>
      ) : null}

      {loadingMeta ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />)}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Colaborador</label>
          <div className="relative">
            <select value={providerId} onChange={(e) => setProviderId(e.target.value)} className={selCls} disabled={loadingMeta || saving} required>
              <option value="">Seleccionar colaborador…</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              {data.providerId && !providers.some((p) => p.id === data.providerId) ? (
                <option value={data.providerId}>{data.provider?.displayName?.trim() || "Colaborador actual"}</option>
              ) : null}
            </select>
            {chevron}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Servicio</label>
          <div className="relative">
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={selCls} disabled={loadingMeta || saving} required>
              <option value="">Seleccionar servicio…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} · {s.durationMinutes} min</option>
              ))}
              {data.serviceId && !services.some((s) => s.id === data.serviceId) ? (
                <option value={data.serviceId}>{data.service?.name?.trim() || "Servicio actual"}</option>
              ) : null}
            </select>
            {chevron}
          </div>
          {selectedService ? (
            <button type="button" onClick={applyDurationFromService}
              className="mt-2 rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-semibold text-brand-600 transition hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400">
              Ajustar fin según duración
            </button>
          ) : null}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Inicio</label>
          <input type="datetime-local" value={startLocal} onChange={(e) => setStartLocal(e.target.value)} className={inpCls} disabled={saving} required />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Fin</label>
          <input type="datetime-local" value={endLocal} onChange={(e) => setEndLocal(e.target.value)} className={inpCls} disabled={saving} required />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Estado</label>
          <div className="relative">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selCls} disabled={saving}>
              {APPOINTMENT_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
              {!statusOptionValues.has(status) && status ? (
                <option value={status}>{labelAppointmentStatus(status)}</option>
              ) : null}
            </select>
            {chevron}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Confirmación</label>
          <div className="relative">
            <select value={confirmationStatus} onChange={(e) => setConfirmationStatus(e.target.value)} className={selCls} disabled={saving}>
              {CONFIRMATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
              {!confirmationOptionValues.has(confirmationStatus) && confirmationStatus ? (
                <option value={confirmationStatus}>{confirmationStatus}</option>
              ) : null}
            </select>
            {chevron}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Notas internas</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} disabled={saving}
            placeholder="Indicaciones especiales, observaciones…"
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-white dark:placeholder:text-gray-500" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 dark:border-white/[0.08]">
        <Button type="submit" size="sm" variant="primary" disabled={saving || loadingMeta}
          className="!bg-brand-500 hover:!bg-brand-600 disabled:!bg-brand-300">
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
        <Button type="button" size="sm" variant="primary" disabled={saving || loadingMeta}
          className="!bg-error-600 !text-white hover:!bg-error-700 disabled:!bg-error-300"
          onClick={() => setCancelModalOpen(true)}>
          Cancelar cita…
        </Button>
        <p className="w-full text-xs text-gray-500 dark:text-gray-400 sm:ml-auto sm:w-auto">
          Para reprogramar, cambia fecha y hora y pulsa «Guardar cambios».
        </p>
      </div>
    </form>

    <AppointmentCancelConfirmModal
      isOpen={cancelModalOpen}
      onClose={() => setCancelModalOpen(false)}
      onConfirm={async () => {
        const base = buildBody();
        if (!base) throw new Error("validation");
        await persist(
          { ...base, status: "Cancelled", confirmationStatus: "Declined" },
          { throwOnError: true }
        );
      }}
    />
    </>
  );
}
