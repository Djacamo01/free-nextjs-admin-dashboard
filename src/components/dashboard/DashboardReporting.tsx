"use client";

import { fetchDashboardReport, ClientHttpError } from "@/api";
import type { DashboardDayCount, DashboardReport } from "@/api/reporting";
import { labelAppointmentStatus } from "@/constants/publicEnums";
import SpinnerOne from "@/components/ui/spinner/SpinnerOne";
import {
  BoltIcon,
  BoxIconLine,
  CalenderIcon,
  CheckCircleIcon,
  GroupIcon,
  UserIcon,
} from "@/icons";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";

const PERIOD_OPTIONS = [
  { value: 7, label: "7 días" },
  { value: 30, label: "30 días" },
  { value: 90, label: "90 días" },
] as const;

function formatPeriodLabel(start: string, end: string) {
  if (!start || !end) return "";
  try {
    const s = new Date(`${start}T12:00:00`);
    const e = new Date(`${end}T12:00:00`);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return `${start} → ${end}`;
    const same = start === end;
    const fmt = new Intl.DateTimeFormat("es", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    if (same) return fmt.format(s);
    return `${fmt.format(s)} — ${fmt.format(e)}`;
  } catch {
    return `${start} → ${end}`;
  }
}

function formatGeneratedAt(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("es", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return "";
  }
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent = "brand",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  accent?: "brand" | "success" | "error" | "warning" | "neutral";
}) {
  const accentBorder: Record<string, string> = {
    brand: "border-t-brand-500 dark:border-t-brand-400",
    success: "border-t-success-500 dark:border-t-success-400",
    error: "border-t-error-500 dark:border-t-error-400",
    warning: "border-t-orange-500 dark:border-t-orange-400",
    neutral: "border-t-gray-400 dark:border-t-gray-500",
  };
  const iconBg: Record<string, string> = {
    brand: "bg-brand-500/10 dark:bg-brand-400/10",
    success: "bg-success-500/10 dark:bg-success-400/10",
    error: "bg-error-500/10 dark:bg-error-400/10",
    warning: "bg-orange-500/10 dark:bg-orange-400/10",
    neutral: "bg-gray-100 dark:bg-gray-800",
  };
  return (
    <div
      className={`rounded-2xl border border-gray-200 border-t-2 bg-white p-5 shadow-theme-xs dark:border-white/[0.08] dark:border-t-2 dark:bg-white/[0.03] md:p-6 ${accentBorder[accent]}`}
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg[accent]}`}>
        {icon}
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-white">
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{sub}</p>
      ) : null}
    </div>
  );
}

function MiniBarChart({
  title,
  data,
  accentClass = "bg-brand-500 dark:bg-brand-400",
}: {
  title: string;
  data: DashboardDayCount[];
  accentClass?: string;
}) {
  const points = useMemo(() => {
    const slice = data.slice(-21);
    const max = Math.max(1, ...slice.map((d) => d.count));
    return slice.map((d) => ({ ...d, pct: (d.count / max) * 100 }));
  }, [data]);

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-white/[0.08] dark:bg-white/[0.03] md:p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Sin datos en este periodo.
        </p>
      </div>
    );
  }

  const maxPx = 104;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-white/[0.08] dark:bg-white/[0.03] md:p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <div className="mt-4 flex h-28 items-end gap-0.5 sm:gap-1">
        {points.map((d) => {
          const px = Math.round((d.pct / 100) * maxPx);
          const h = d.count > 0 ? Math.max(6, px) : 2;
          return (
            <div
              key={d.date}
              className="group flex min-w-0 flex-1 flex-col items-center justify-end"
              title={`${d.date}: ${d.count}`}
            >
              <div
                className={`w-full max-w-[12px] rounded-t-sm transition group-hover:opacity-90 sm:max-w-[16px] ${accentClass}`}
                style={{ height: `${h}px` }}
              />
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[10px] text-gray-400 dark:text-gray-500">
        Cada barra es un día (últimos {points.length} con datos)
      </p>
    </div>
  );
}

export default function DashboardReporting() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<DashboardReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const report = await fetchDashboardReport(d);
      setData(report);
    } catch (e) {
      setData(null);
      setError(
        e instanceof ClientHttpError
          ? e.message
          : "No se pudo cargar el resumen del tablero."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [load, days]);

  const periodLabel = data
    ? formatPeriodLabel(data.periodStart, data.periodEnd)
    : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Resumen
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Indicadores de tu organización según el periodo elegido.
            {periodLabel ? (
              <span className="mt-0.5 block text-gray-600 dark:text-gray-300">
                Periodo: {periodLabel}
              </span>
            ) : null}
          </p>
          {data?.generatedAtUtc ? (
            <p className="mt-1 text-xs text-gray-400">
              Actualizado: {formatGeneratedAt(data.generatedAtUtc)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Ver:
          </span>
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDays(opt.value)}
              disabled={loading}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                days === opt.value
                  ? "bg-brand-500 text-white shadow-theme-xs"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <SpinnerOne />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cargando datos…
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-800 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200">
          {error}
        </div>
      ) : null}

      {data ? (
        <>
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Catálogo y equipo
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                accent="brand"
                icon={<GroupIcon className="size-6 text-brand-500 dark:text-brand-400" />}
                label="Pacientes"
                value={data.counts.patients}
              />
              <StatCard
                accent="neutral"
                icon={<UserIcon className="size-6 text-gray-600 dark:text-gray-300" />}
                label="Colaboradores"
                value={data.counts.providers}
              />
              <StatCard
                accent="warning"
                icon={<BoltIcon className="size-6 text-orange-500 dark:text-orange-400" />}
                label="Servicios activos"
                value={data.counts.servicesActive}
              />
              <StatCard
                accent="neutral"
                icon={<BoxIconLine className="size-6 text-gray-600 dark:text-gray-300" />}
                label="Cuentas staff activas"
                value={data.counts.staffAccountsActive}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Citas
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard
                accent="neutral"
                icon={<CalenderIcon className="size-6 text-gray-600 dark:text-gray-300" />}
                label="Total en periodo"
                value={data.appointments.totalInPeriod}
              />
              <StatCard
                accent="brand"
                icon={<CalenderIcon className="size-6 text-brand-500 dark:text-brand-400" />}
                label="Hoy"
                value={data.appointments.todayCount}
              />
              <StatCard
                accent="brand"
                icon={<CalenderIcon className="size-6 text-brand-500 dark:text-brand-400" />}
                label="Próximas"
                value={data.appointments.upcomingScheduledOrConfirmed}
              />
              <StatCard
                accent="success"
                icon={<CheckCircleIcon className="size-6 text-success-500 dark:text-success-400" />}
                label="Completadas"
                value={data.appointments.completedInPeriod}
              />
              <StatCard
                accent="error"
                icon={<CalenderIcon className="size-6 text-error-500 dark:text-error-400" />}
                label="Canceladas"
                value={data.appointments.cancelledInPeriod}
              />
              <StatCard
                accent="warning"
                icon={<CalenderIcon className="size-6 text-orange-500 dark:text-orange-400" />}
                label="No asistió"
                value={data.appointments.noShowInPeriod}
              />
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-white/[0.08] dark:bg-white/[0.03] md:p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Citas por estado
              </h3>
              {data.appointmentsByStatus.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Sin desglose.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {data.appointmentsByStatus.map((row) => (
                    <li
                      key={row.key}
                      className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2 last:border-0 dark:border-white/[0.06]"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {labelAppointmentStatus(row.key)}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                        {row.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-white/[0.08] dark:bg-white/[0.03] md:p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Servicios con más citas
              </h3>
              {data.topServicesByAppointments.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Sin datos en el periodo.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {data.topServicesByAppointments.map((s, i) => (
                    <li
                      key={s.serviceId}
                      className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2 last:border-0 dark:border-white/[0.06]"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="mr-2 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-[10px] font-bold text-brand-600 dark:text-brand-400">
                          {i + 1}
                        </span>
                        {s.serviceName || "Servicio"}
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                        {s.appointmentCount}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/servicios"
                className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                Ver catálogo de servicios →
              </Link>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <MiniBarChart
              title="Citas creadas por día"
              data={data.appointmentsCreatedPerDay}
              accentClass="bg-brand-500 dark:bg-brand-400"
            />
            <MiniBarChart
              title="Citas que empiezan por día"
              data={data.appointmentsStartingPerDay}
              accentClass="bg-success-500 dark:bg-success-400"
            />
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/calendar"
              className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Abrir calendario →
            </Link>
            <Link
              href="/clientes"
              className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Ver clientes →
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
