import PatientDetailsView from "@/components/patients/PatientDetailsView";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Detalle cliente | Ordely",
  description: "Ficha del cliente",
};

export default function ClienteDetallePage() {
  return <PatientDetailsView />;
}
