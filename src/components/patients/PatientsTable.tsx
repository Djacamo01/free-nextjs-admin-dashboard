"use client";

import { fetchPatients, ClientHttpError } from "@/api";
import type { Patient } from "@/api/patients";
import UserAvatarInitials from "@/components/common/UserAvatarInitials";
import Badge from "@/components/ui/badge/Badge";
import SpinnerOne from "@/components/ui/spinner/SpinnerOne";
import { labelChannelType } from "@/constants/publicEnums";
import { formatShortDateTime } from "@/lib/formatDate";
import { ArrowRightIcon } from "@/icons";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

function notesPreview(notes: string, max = 56) {
  if (!notes) return null;
  return notes.length <= max ? notes : `${notes.slice(0, max)}…`;
}

function PatientRowSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-4 rounded-2xl border border-transparent px-4 py-4 sm:px-5">
      <div className="h-12 w-12 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="h-4 w-[40%] max-w-[200px] rounded-md bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-[55%] max-w-[280px] rounded-md bg-gray-200 dark:bg-gray-700" />
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
      <div className="hidden h-4 w-24 shrink-0 rounded sm:block sm:bg-gray-200 dark:sm:bg-gray-700" />
    </div>
  );
}

type PatientsTableProps = {
  refreshTrigger?: number;
};

export default function PatientsTable({
  refreshTrigger = 0,
}: PatientsTableProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPatients()
      .then((data) => {
        if (!cancelled) setPatients(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) {
          const msg =
            err instanceof ClientHttpError
              ? err.message
              : "No se pudo cargar la lista de clientes.";
          setError(msg);
          setPatients([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => {
      const hay = `${p.name} ${p.email} ${p.phone} ${p.notes}`.toLowerCase();
      return hay.includes(q);
    });
  }, [patients, query]);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-theme-xs dark:border-white/[0.08] dark:bg-gray-900/20">
        <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-4 dark:border-white/[0.06] dark:from-gray-900/40 dark:to-gray-900/20">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-2 h-3 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
          {Array.from({ length: 5 }).map((_, i) => (
            <PatientRowSkeleton key={i} />
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 border-t border-gray-100 py-3 text-xs text-gray-400 dark:border-white/[0.06]">
          <SpinnerOne className="!h-4 !w-4" />
          Cargando clientes…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-error-200/80 bg-gradient-to-br from-error-50 to-white px-6 py-8 text-center dark:border-error-500/25 dark:from-error-500/10 dark:to-gray-900/40">
        <p className="text-sm font-medium text-error-700 dark:text-error-400">
          {error}
        </p>
        <p className="mt-2 text-xs text-error-600/80 dark:text-error-400/70">
          Comprueba la conexión y vuelve a abrir la página.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-theme-xs dark:border-white/[0.08] dark:bg-gray-900/25">
      <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50/95 to-white px-4 py-4 sm:px-6 dark:border-white/[0.06] dark:from-gray-900/50 dark:to-gray-900/25">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
              Directorio de clientes
            </h3>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {patients.length === 0
                ? "Aún no hay registros"
                : `${patients.length} ${
                    patients.length === 1 ? "persona" : "personas"
                  }`}
              {query.trim() && patients.length > 0
                ? ` · ${filtered.length} resultado${
                    filtered.length !== 1 ? "s" : ""
                  }`
                : null}
            </p>
          </div>
          <div className="w-full max-w-md">
            <label htmlFor="patients-search" className="sr-only">
              Buscar clientes
            </label>
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                id="patients-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, email o teléfono…"
                className="h-10 w-full rounded-xl border border-gray-200 bg-white/90 pl-10 pr-4 text-sm text-gray-800 shadow-inner placeholder:text-gray-400 focus:border-brand-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-900/60 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/[0.06]">
            <svg
              className="h-7 w-7 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            No hay clientes todavía
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            Usa el botón + para dar de alta el primer contacto.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          No hay coincidencias con «{query.trim()}». Prueba con otro término.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
          {filtered.map((p) => {
            const noteShort = notesPreview(p.notes);
            return (
              <li key={p.id}>
                <Link
                  href={`/clientes/${p.id}`}
                  className="group flex items-stretch gap-3 px-3 py-4 transition-colors hover:bg-gray-50/90 sm:gap-4 sm:px-5 dark:hover:bg-white/[0.04]"
                >
                  <div className="shrink-0 pt-0.5">
                    <UserAvatarInitials
                      name={p.name}
                      email={p.email}
                      size="sm"
                      className="!h-11 !w-11 text-xs ring-2 ring-white dark:ring-gray-900"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-semibold text-gray-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                        {p.name}
                      </span>
                    </div>
                    {p.email ? (
                      <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                        {p.email}
                      </p>
                    ) : null}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      {p.phone ? (
                        <span className="inline-flex items-center rounded-lg bg-gray-100 px-2 py-1 text-theme-xs font-medium text-gray-600 dark:bg-white/[0.08] dark:text-gray-300">
                          {p.phone}
                        </span>
                      ) : null}
                      {p.preferredChannel ? (
                        <Badge size="sm" color="primary" variant="light">
                          {labelChannelType(p.preferredChannel)}
                        </Badge>
                      ) : null}
                      {noteShort ? (
                        <span
                          className="max-w-full truncate text-theme-xs text-gray-400 dark:text-gray-500"
                          title={p.notes}
                        >
                          {noteShort}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="hidden shrink-0 flex-col items-end justify-center text-end sm:flex">
                    <time
                      className="text-theme-xs text-gray-400 dark:text-gray-500"
                      dateTime={p.createdAt}
                    >
                      {formatShortDateTime(p.createdAt)}
                    </time>
                    <span className="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">
                      Alta
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center text-gray-300 transition-colors group-hover:text-brand-500 dark:text-gray-600 dark:group-hover:text-brand-400">
                    <ArrowRightIcon className="h-5 w-5" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
