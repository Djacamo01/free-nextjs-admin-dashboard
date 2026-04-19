"use client";

import ProvidersList from "@/components/providers/ProvidersList";
import { PlusIcon } from "@/icons";
import Link from "next/link";
import React from "react";

export default function ColaboradoresView() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/colaboradores/nuevo"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 focus:outline-hidden focus:ring-2 focus:ring-brand-500/40"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo colaborador
        </Link>
      </div>
      <ProvidersList />
    </div>
  );
}
