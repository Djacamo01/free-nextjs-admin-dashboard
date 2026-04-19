"use client";

import ServiceCreateForm from "@/components/services/ServiceCreateForm";
import { ChevronLeftIcon } from "@/icons";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function ServiceCreatePageView() {
  const router = useRouter();

  return (
    <div className="w-full min-w-0">
      <Link
        href="/servicios"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Volver a servicios
      </Link>

      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs sm:p-8 lg:p-10 dark:border-white/[0.08] dark:bg-gray-900/40">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
          Nuevo servicio
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Define nombre, tiempos, precio de referencia en colones y si el
          servicio queda activo.
        </p>
        <div className="mt-8">
          <ServiceCreateForm
            onSuccess={() => router.push("/servicios")}
            onCancel={() => router.push("/servicios")}
          />
        </div>
      </div>
    </div>
  );
}
