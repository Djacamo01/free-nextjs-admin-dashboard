"use client";

import AppointmentsCalendar from "./AppointmentsCalendar";
import AppointmentsList from "./AppointmentsList";
import Link from "next/link";
import React, { useState } from "react";

type CitasPrimaryView = "calendar" | "list";

export default function CitasTabContent() {
  const [primaryView, setPrimaryView] = useState<CitasPrimaryView>("calendar");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-900"
          role="group"
          aria-label="Vista de citas"
        >
          <button
            type="button"
            onClick={() => setPrimaryView("calendar")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              primaryView === "calendar"
                ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Calendario
          </button>
          <button
            type="button"
            onClick={() => setPrimaryView("list")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              primaryView === "list"
                ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Lista
          </button>
        </div>
        <Link
          href="/calendar/create"
          className="inline-flex h-9 items-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
        >
          Nueva cita
        </Link>
      </div>

      {primaryView === "calendar" ? (
        <section className="min-h-0">
          <AppointmentsCalendar initialView="timeGridWeek" />
        </section>
      ) : (
        <section>
          <AppointmentsList hideFooterCalendarLink />
        </section>
      )}
    </div>
  );
}
