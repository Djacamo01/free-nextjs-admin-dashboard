"use client";

import CitasTabContent from "@/components/appointments/CitasTabContent";
import SegmentedTabs from "@/components/ui/tabs/SegmentedTabs";
import { PlusIcon } from "@/icons";
import Link from "next/link";
import React from "react";
import PatientsTable from "./PatientsTable";

export default function ClientesView() {
  return (
    <div className="space-y-6">
      <SegmentedTabs
        ariaLabel="Clientes y citas"
        tabs={[
          {
            id: "clientes",
            label: "Clientes",
            description:
              "Pacientes de tu organización. Las citas se consultan en la pestaña siguiente.",
            content: (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Link
                    href="/clientes/nuevo"
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 focus:outline-hidden focus:ring-2 focus:ring-brand-500/40"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Nuevo cliente
                  </Link>
                </div>
                <PatientsTable />
              </div>
            ),
          },
          {
            id: "citas",
            label: "Citas",
            description:
              "Consulta el calendario y el listado de citas de tu organización.",
            content: <CitasTabContent />,
          },
        ]}
      />
    </div>
  );
}
