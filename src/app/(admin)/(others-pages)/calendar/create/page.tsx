import CalendarCreateClient from "@/components/appointments/CalendarCreateClient";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Nueva cita | Ordely",
  description: "Crear cita (POST /api/Appointments)",
};

export default function CalendarCreatePage() {
  return (
    <div>
      <CalendarCreateClient />
    </div>
  );
}
