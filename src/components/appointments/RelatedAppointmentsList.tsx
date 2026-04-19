"use client";

import {
  fetchAppointmentsForPatient,
  fetchAppointmentsForProvider,
  ClientHttpError,
} from "@/api";
import type { Appointment } from "@/api/appointments";
import Badge from "@/components/ui/badge/Badge";
import SpinnerOne from "@/components/ui/spinner/SpinnerOne";
import {
  appointmentStatusBadgeTone,
  labelAppointmentStatus,
} from "@/constants/publicEnums";
import { formatShortDateTime } from "@/lib/formatDate";
import Link from "next/link";
import React, { useEffect, useState } from "react";

type Props =
  | { variant: "patient"; patientId: string }
  | { variant: "provider"; providerId: string };

export default function RelatedAppointmentsList(props: Props) {
  const [rows, setRows] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const entityId =
    props.variant === "patient" ? props.patientId : props.providerId;

  useEffect(() => {
    if (!entityId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const req =
      props.variant === "patient"
        ? fetchAppointmentsForPatient(entityId)
        : fetchAppointmentsForProvider(entityId);
    req
      .then((list) => {
        if (!cancelled) setRows(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ClientHttpError
              ? err.message
              : "No se pudieron cargar las citas."
          );
          setRows([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entityId, props.variant]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <SpinnerOne className="!h-8 !w-8" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Cargando citas…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
        {error}
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No hay citas asociadas a este perfil.
      </p>
    );
  }

  const showProvider = props.variant === "patient";
  const showPatient = props.variant === "provider";

  return (
    <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
      {rows.map((a) => {
        const secondary =
          showProvider && a.provider?.displayName?.trim()
            ? a.provider.displayName.trim()
            : showPatient && a.patient?.displayName?.trim()
              ? a.patient.displayName.trim()
              : null;
        return (
          <li key={a.id} className="py-3 first:pt-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatShortDateTime(a.startTime)}
                  <span className="font-normal text-gray-500 dark:text-gray-400">
                    {" "}
                    → {formatShortDateTime(a.endTime)}
                  </span>
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">
                    {a.service?.name?.trim() || "Servicio"}
                  </span>
                  {secondary ? (
                    <span className="text-gray-500 dark:text-gray-400">
                      {" "}
                      · {secondary}
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Badge
                  size="sm"
                  variant="light"
                  color={appointmentStatusBadgeTone(a.status)}
                >
                  {labelAppointmentStatus(a.status)}
                </Badge>
                <Link
                  href={`/calendar/event/detail/${encodeURIComponent(a.id)}`}
                  className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                >
                  Ver detalle
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
