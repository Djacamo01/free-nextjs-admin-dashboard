import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ServicesCatalog from "@/components/services/ServicesCatalog";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Servicios | Ordely",
  description: "Catálogo de servicios",
};

export default function ServiciosPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Servicios" />
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Catálogo de servicios ofrecidos: duración, margen entre citas y precio de
        referencia.
      </p>
      <ServicesCatalog />
    </div>
  );
}
