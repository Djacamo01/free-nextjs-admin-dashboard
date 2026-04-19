import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ClientesView from "@/components/patients/ClientesView";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Clientes | Ordely",
  description: "Pacientes y clientes",
};

export default function ClientesPage() {
  return (
    <div className="space-y-2">
      <PageBreadcrumb pageTitle="Clientes" />
      <p className="text-sm text-gray-500 dark:text-gray-400 pb-4">
        Personas que reciben tus servicios y tienen citas en el sistema. A diferencia de los partners, los clientes son el destinatario final de tu atención.
      </p>
      <ClientesView />
    </div>
  );
}
