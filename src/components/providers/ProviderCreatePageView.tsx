"use client";

import ProviderCreateForm from "@/components/providers/ProviderCreateForm";
import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

export default function ProviderCreatePageView() {
  const router = useRouter();

  return (
    <div className="w-full min-w-0">
      <Link
        href="/colaboradores"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Volver a colaboradores
      </Link>

      <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs sm:p-8 lg:p-10 dark:border-white/[0.08] dark:bg-gray-900/40">
        <div className="mb-8 max-w-3xl">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
            Nuevo colaborador
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Alta de proveedor o profesional. Más adelante podrás completar o
            editar la ficha desde su detalle.
          </p>
        </div>
        <ProviderCreateForm
          onSuccess={() => router.push("/colaboradores")}
          onCancel={() => router.push("/colaboradores")}
        />
      </div>
    </div>
  );
}
