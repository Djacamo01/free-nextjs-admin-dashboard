"use client";

import { fetchAppointments, type Appointment } from "@/api/appointments";
import Badge from "@/components/ui/badge/Badge";
import {
  appointmentStatusBadgeTone,
  labelAppointmentStatus,
} from "@/constants/publicEnums";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

type Props = {
  refreshTrigger?: number;
  /** En /calendar el enlace al calendario es redundante si ya hay selector de vista. */
  hideFooterCalendarLink?: boolean;
};

export default function AppointmentsList({
  refreshTrigger = 0,
  hideFooterCalendarLink = false,
}: Props) {
  const [rows, setRows] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAppointments();
      setRows(
        [...list].sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        )
      );
    } catch (e) {
      setRows([]);
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar las citas."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshTrigger]);

  if (loading) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">Cargando lista…</p>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
        {error}
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        No hay citas. Puedes crear una desde «Nueva cita» en el calendario.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="max-h-[min(28rem,calc(100vh-14rem))] overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-800">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/80">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                Inicio
              </th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                Fin
              </th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                Estado
              </th>
              <th className="hidden px-4 py-3 font-medium text-gray-600 sm:table-cell dark:text-gray-400">
                Paciente
              </th>
              <th className="hidden px-4 py-3 font-medium text-gray-600 md:table-cell dark:text-gray-400">
                Servicio
              </th>
              <th className="hidden px-4 py-3 font-medium text-gray-600 lg:table-cell dark:text-gray-400">
                Proveedor
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02]">
                <td className="whitespace-nowrap px-4 py-2.5 text-gray-800 dark:text-gray-200">
                  {new Date(a.startTime).toLocaleString("es", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-gray-800 dark:text-gray-200">
                  {new Date(a.endTime).toLocaleString("es", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-4 py-2.5">
                  <Badge
                    size="sm"
                    variant="light"
                    color={appointmentStatusBadgeTone(a.status)}
                  >
                    {labelAppointmentStatus(a.status)}
                  </Badge>
                </td>
                <td className="hidden max-w-[10rem] px-4 py-2.5 text-gray-800 sm:table-cell dark:text-gray-200">
                  <div className="truncate font-medium">
                    {a.patient?.displayName?.trim() || "—"}
                  </div>
                </td>
                <td className="hidden max-w-[10rem] truncate px-4 py-2.5 text-gray-800 md:table-cell dark:text-gray-200">
                  {a.service?.name?.trim() || "—"}
                </td>
                <td className="hidden max-w-[10rem] px-4 py-2.5 text-gray-800 lg:table-cell dark:text-gray-200">
                  <div className="truncate font-medium">
                    {a.provider?.displayName?.trim() || "—"}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <Link
                    href={`/calendar/event/detail/${encodeURIComponent(a.id)}`}
                    className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    Detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!hideFooterCalendarLink ? (
        <div className="border-t border-gray-100 px-4 py-2 text-right dark:border-gray-800">
          <Link
            href="/calendar"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Abrir calendario completo →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
