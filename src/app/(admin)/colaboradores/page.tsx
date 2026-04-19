import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ColaboradoresView from "@/components/providers/ColaboradoresView";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Colaboradores | Ordely",
  description: "Gestión de colaboradores y proveedores",
};

export default function ColaboradoresPage() {
  return (
    <div className="space-y-2">
      <PageBreadcrumb pageTitle="Colaboradores" />
      <p className="text-sm text-gray-500 dark:text-gray-400 pb-4">
        Contactos con rol de colaborador — prestan servicios y tienen agenda disponible. Un mismo contacto puede también ser cliente o partner.
      </p>
      <ColaboradoresView />
    </div>
  );
}
