"use client";

import type { Appointment } from "@/api/appointments";
import AppointmentQuickActionBar from "@/components/appointments/AppointmentQuickActionBar";
import { Modal } from "@/components/ui/modal";
import { labelAppointmentStatus } from "@/constants/publicEnums";
import Link from "next/link";
import React from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onAppointmentUpdated?: (a: Appointment) => void;
};

export default function AppointmentQuickModal({
  isOpen,
  onClose,
  appointment,
  onAppointmentUpdated,
}: Props) {
  if (!appointment) return null;

  const detailHref = `/calendar/event/detail/${encodeURIComponent(appointment.id)}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6 lg:p-8">
      <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
        <div>
          <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
            {appointment.patient?.displayName?.trim() ||
              appointment.service?.name?.trim() ||
              "Cita"}
          </h5>
          {appointment.service?.name?.trim() &&
          appointment.patient?.displayName?.trim() ? (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {appointment.service.name.trim()}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            En el detalle puedes editar horario y notas con el formulario completo.
          </p>
        </div>

        <dl className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-900/40">
          {appointment.patient?.displayName?.trim() ? (
            <div>
              <dt className="text-xs font-medium text-gray-500">Paciente</dt>
              <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">
                {appointment.patient.displayName.trim()}
              </dd>
            </div>
          ) : null}
          {appointment.provider?.displayName?.trim() ? (
            <div>
              <dt className="text-xs font-medium text-gray-500">Proveedor</dt>
              <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">
                {appointment.provider.displayName.trim()}
              </dd>
            </div>
          ) : null}
          {appointment.service?.name?.trim() ? (
            <div>
              <dt className="text-xs font-medium text-gray-500">Servicio</dt>
              <dd className="mt-0.5 text-gray-900 dark:text-white">
                {appointment.service.name.trim()}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-2">
            <dt className="text-xs font-medium text-gray-500">Estado</dt>
            <dd className="font-medium text-gray-900 dark:text-white">
              {labelAppointmentStatus(appointment.status)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">Horario</dt>
            <dd className="mt-0.5">
              {new Date(appointment.startTime).toLocaleString("es", {
                dateStyle: "short",
                timeStyle: "short",
              })}{" "}
              →{" "}
              {new Date(appointment.endTime).toLocaleString("es", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">Confirmación</dt>
            <dd>{appointment.confirmationStatus || "—"}</dd>
          </div>
          {appointment.notes ? (
            <div>
              <dt className="text-xs font-medium text-gray-500">Notas</dt>
              <dd className="mt-0.5 line-clamp-3">{appointment.notes}</dd>
            </div>
          ) : null}
        </dl>

        <div className="rounded-xl border border-gray-100 bg-white/60 p-3 dark:border-white/[0.08] dark:bg-gray-900/30">
          <AppointmentQuickActionBar
            appointment={appointment}
            onAppointmentUpdated={onAppointmentUpdated}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cerrar
          </button>
          <Link
            href={detailHref}
            onClick={onClose}
            className="inline-flex justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Ver información detallada
          </Link>
        </div>
      </div>
    </Modal>
  );
}
