import ServiceCreatePageView from "@/components/services/ServiceCreatePageView";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Nuevo servicio | Ordely",
  description: "Alta de servicio",
};

export default function ServicioNuevoPage() {
  return <ServiceCreatePageView />;
}
