import AppointmentDetailView from "@/components/appointments/AppointmentDetailView";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Detalle cita | Ordely",
  description: "Información detallada de la cita",
};

export default function AppointmentDetailPage() {
  return <AppointmentDetailView />;
}
