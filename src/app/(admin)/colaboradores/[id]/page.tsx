import ProviderDetailsView from "@/components/providers/ProviderDetailsView";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Detalle colaborador | Ordely",
  description: "Ficha del colaborador",
};

export default function ColaboradorDetallePage() {
  return <ProviderDetailsView />;
}
