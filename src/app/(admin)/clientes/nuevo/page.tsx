import PatientCreatePageView from "@/components/patients/PatientCreatePageView";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Nuevo cliente | Ordely",
  description: "Alta de cliente",
};

export default function ClienteNuevoPage() {
  return <PatientCreatePageView />;
}
