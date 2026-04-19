"use client";

import {
  updateAppointment,
  type Appointment,
  type UpdateAppointmentRequest,
} from "@/api/appointments";
import { ApiHttpError } from "@/api/client";
import AppointmentCancelConfirmModal from "@/components/appointments/AppointmentCancelConfirmModal";
import Button from "@/components/ui/button/Button";
import React, { useCallback, useEffect, useState } from "react";

function norm(s: string) {
  return s.trim().toLowerCase();
}

export function buildAppointmentUpdateBody(
  a: Appointment,
  overrides: Partial<
    Pick<UpdateAppointmentRequest, "status" | "confirmationStatus">
  >
): UpdateAppointmentRequest | null {
  const providerId = a.providerId ?? "";
  const serviceId = a.serviceId ?? "";
  if (!providerId || !serviceId) return null;
  return {
    providerId,
    serviceId,
    startTime: a.startTime,
    endTime: a.endTime,
    status: overrides.status ?? a.status,
    confirmationStatus:
      overrides.confirmationStatus ?? a.confirmationStatus ?? "Pending",
    notes: (a.notes ?? "").trim(),
  };
}

type Props = {
  appointment: Appointment;
  onAppointmentUpdated?: (a: Appointment) => void;
  /** Mensaje si faltan proveedor/servicio (según contexto: modal vs página detalle). */
  blockedHint?: string;
  className?: string;
  /** En página detalle suele ocultarse: ya hay un título «Acciones» arriba. */
  showHeading?: boolean;
};

export default function AppointmentQuickActionBar({
  appointment,
  onAppointmentUpdated,
  blockedHint = "Asigna proveedor y servicio en el detalle para habilitar acciones rápidas.",
  className = "",
  showHeading = true,
}: Props) {
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    setActionError(null);
    setCancelModalOpen(false);
  }, [appointment.id]);

  const runQuickUpdate = useCallback(
    async (
      a: Appointment,
      overrides: Partial<
        Pick<UpdateAppointmentRequest, "status" | "confirmationStatus">
      >
    ) => {
      const body = buildAppointmentUpdateBody(a, overrides);
      if (!body) {
        setActionError(blockedHint);
        return;
      }
      setActionLoading(true);
      setActionError(null);
      try {
        const updated = await updateAppointment(a.id, body);
        onAppointmentUpdated?.(updated);
      } catch (e) {
        const msg =
          e instanceof ApiHttpError
            ? e.message || `Error ${e.status}`
            : e instanceof Error
              ? e.message
              : "No se pudo actualizar la cita.";
        setActionError(msg);
      } finally {
        setActionLoading(false);
      }
    },
    [blockedHint, onAppointmentUpdated]
  );

  const canQuick =
    Boolean(appointment.providerId?.trim()) &&
    Boolean(appointment.serviceId?.trim());
  const st = norm(appointment.status);
  const isCancelled = st.includes("cancel");
  const isCompleted = st.includes("complet");
  const isNoShow = st.includes("noshow") || st.includes("no_show");
  const isConfirmed =
    st === "confirmed" || appointment.status === "Confirmed";

  const quickDisabled = actionLoading || !canQuick || isCancelled;

  return (
    <>
      <div className={className}>
        {showHeading ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Acciones rápidas
          </p>
        ) : null}
        {!canQuick ? (
          <p className="mb-2 text-xs text-amber-700 dark:text-amber-400/90">
            {blockedHint}
          </p>
        ) : null}
        {actionError ? (
          <p className="mb-2 rounded-lg border border-error-200 bg-error-50 px-2 py-1.5 text-xs text-error-800 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200">
            {actionError}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled={
              quickDisabled || isCompleted || isConfirmed || isNoShow
            }
            className="!bg-success-600 !text-white shadow-theme-xs hover:!bg-success-700 disabled:!bg-success-300"
            onClick={() =>
              void runQuickUpdate(appointment, {
                status: "Confirmed",
                confirmationStatus: "Confirmed",
              })
            }
          >
            Confirmar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled={quickDisabled || isCompleted || isNoShow}
            className="!bg-brand-500 !text-white shadow-theme-xs hover:!bg-brand-600 disabled:!bg-brand-300"
            onClick={() =>
              void runQuickUpdate(appointment, {
                status: "Completed",
              })
            }
          >
            Completar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled={quickDisabled || isCompleted || isNoShow}
            className="!bg-warning-600 !text-white shadow-theme-xs hover:!bg-warning-700 disabled:!bg-warning-300"
            onClick={() =>
              void runQuickUpdate(appointment, {
                status: "NoShow",
              })
            }
          >
            No asistió
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled={quickDisabled}
            className="!bg-error-600 !text-white shadow-theme-xs hover:!bg-error-700 disabled:!bg-error-300"
            onClick={() => setCancelModalOpen(true)}
          >
            Cancelar cita…
          </Button>
        </div>
      </div>

      <AppointmentCancelConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={async () => {
          const body = buildAppointmentUpdateBody(appointment, {
            status: "Cancelled",
            confirmationStatus: "Declined",
          });
          if (!body) {
            setActionError(
              "No se puede cancelar: falta proveedor o servicio en la cita."
            );
            throw new Error("missing provider or service");
          }
          try {
            const updated = await updateAppointment(appointment.id, body);
            onAppointmentUpdated?.(updated);
          } catch (e) {
            const msg =
              e instanceof ApiHttpError
                ? e.message || `Error ${e.status}`
                : e instanceof Error
                  ? e.message
                  : "No se pudo cancelar la cita.";
            setActionError(msg);
            throw e;
          }
        }}
      />
    </>
  );
}
