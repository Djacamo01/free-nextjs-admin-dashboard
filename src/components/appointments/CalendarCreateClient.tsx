"use client";

import AppointmentCreateForm from "@/components/appointments/AppointmentCreateForm";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

export default function CalendarCreateClient() {
  const router = useRouter();

  return (
    <div className="w-full min-w-0 space-y-6">

      {/* back link */}
      <Link
        href="/calendar"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Citas
      </Link>

      {/* page header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 shadow-sm">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5M12 15h.008M12 12h.008M9 15h.008M9 12h.008M15 12h.008"/>
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
            Nueva cita
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Registra una cita manualmente para un cliente.
          </p>
        </div>
      </div>

      {/* form */}
      <AppointmentCreateForm onCreated={() => router.push("/calendar")} />
    </div>
  );
}
