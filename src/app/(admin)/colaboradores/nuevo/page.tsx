import ProviderCreatePageView from "@/components/providers/ProviderCreatePageView";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Nuevo colaborador | Ordely",
  description: "Alta de proveedor o profesional",
};

export default function ColaboradorNuevoPage() {
  return <ProviderCreatePageView />;
}
