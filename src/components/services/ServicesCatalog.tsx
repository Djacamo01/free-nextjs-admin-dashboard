"use client";

import { fetchServices, ClientHttpError } from "@/api";
import type { Service } from "@/api/services";
import UserAvatarInitials from "@/components/common/UserAvatarInitials";
import Badge from "@/components/ui/badge/Badge";
import SpinnerOne from "@/components/ui/spinner/SpinnerOne";
import { PlusIcon } from "@/icons";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

function formatPrice(value: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDuration(totalMin: number) {
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function ServiceCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.08] dark:bg-gray-900/40">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 shrink-0 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-1/2 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
            <div className="h-6 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const totalBlock = service.durationMinutes + service.bufferMinutes;

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white shadow-theme-xs transition hover:border-brand-200 hover:shadow-md dark:border-white/[0.08] dark:bg-gray-900/50 dark:hover:border-brand-500/30">
      <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-brand-500/10 via-gray-50 to-white px-5 pb-4 pt-5 dark:from-brand-500/15 dark:via-gray-900/80 dark:to-gray-900/40">
        <div className="flex items-start gap-4">
          <UserAvatarInitials
            name={service.name}
            className="h-14 w-14 shrink-0 rounded-2xl text-lg ring-2 ring-white/80 dark:ring-gray-800"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold leading-snug text-gray-900 dark:text-white">
              {service.name}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {service.active ? (
                <Badge size="sm" color="success">
                  Activo
                </Badge>
              ) : (
                <Badge size="sm" color="light">
                  Inactivo
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.04]">
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Duración
            </dt>
            <dd className="mt-0.5 font-semibold text-gray-900 dark:text-white">
              {formatDuration(service.durationMinutes)}
            </dd>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.04]">
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Margen
            </dt>
            <dd className="mt-0.5 font-semibold text-gray-900 dark:text-white">
              {service.bufferMinutes === 0
                ? "Sin margen"
                : `${service.bufferMinutes} min`}
            </dd>
          </div>
          <div className="col-span-2 rounded-xl border border-brand-100 bg-brand-50/80 px-3 py-2.5 dark:border-brand-500/20 dark:bg-brand-500/10">
            <dt className="text-xs font-medium text-brand-800 dark:text-brand-200">
              Precio referencia
            </dt>
            <dd className="mt-0.5 text-lg font-bold tracking-tight text-brand-700 dark:text-brand-300">
              {formatPrice(service.priceReference)}
            </dd>
          </div>
        </dl>
        <p className="mt-auto text-xs text-gray-400 dark:text-gray-500">
          Bloque agenda: ~{formatDuration(totalBlock)} con margen incluido
        </p>
      </div>
    </article>
  );
}

export default function ServicesCatalog() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchServices()
      .then((data) => {
        if (!cancelled) setServices(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) {
          const msg =
            err instanceof ClientHttpError
              ? err.message
              : "No se pudo cargar el catálogo de servicios.";
          setError(msg);
          setServices([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, query]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-11 max-w-md animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <SpinnerOne className="!h-5 !w-5" />
          Cargando servicios…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 px-5 py-4 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/servicios/nuevo"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 focus:outline-hidden focus:ring-2 focus:ring-brand-500/40"
          >
            <PlusIcon className="h-4 w-4" />
            Nuevo servicio
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {services.length === 0
              ? "No hay servicios en el catálogo."
              : `${filtered.length} de ${services.length} servicio${services.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <label className="block w-full max-w-md lg:shrink-0">
          <span className="sr-only">Buscar servicio</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre…"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-16 text-center dark:border-gray-700 dark:bg-white/[0.02]">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {services.length === 0
              ? "Aún no hay servicios"
              : "Ningún servicio coincide con la búsqueda"}
          </p>
          <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
            {services.length === 0
              ? "Puedes crear el primero con el botón Nuevo servicio."
              : "Prueba con otro término o borra el filtro."}
          </p>
          {services.length === 0 ? (
            <Link
              href="/servicios/nuevo"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              <PlusIcon className="h-4 w-4" />
              Crear servicio
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      )}
    </div>
  );
}
