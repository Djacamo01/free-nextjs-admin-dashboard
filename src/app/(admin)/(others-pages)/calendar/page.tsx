import CitasTabContent from "@/components/appointments/CitasTabContent";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Citas | Ordely",
  description: "Calendario y lista de citas",
};

export default function CalendarPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Citas" className="mb-3" />
      <CitasTabContent />
    </div>
  );
}
