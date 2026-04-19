import DashboardReporting from "@/components/dashboard/DashboardReporting";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Inicio | Ordely",
  description: "Resumen de citas, catálogo y actividad",
};

export default function AdminHomePage() {
  return <DashboardReporting />;
}
