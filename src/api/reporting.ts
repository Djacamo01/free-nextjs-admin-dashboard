import { apiJson } from "./client";

export type DashboardCounts = {
  patients: number;
  providers: number;
  servicesActive: number;
  staffAccountsActive: number;
};

export type DashboardAppointmentsSummary = {
  totalInPeriod: number;
  todayCount: number;
  upcomingScheduledOrConfirmed: number;
  completedInPeriod: number;
  cancelledInPeriod: number;
  noShowInPeriod: number;
};

export type DashboardStatusRow = {
  key: string;
  count: number;
};

export type DashboardDayCount = {
  date: string;
  count: number;
};

export type DashboardTopService = {
  serviceId: string;
  serviceName: string;
  appointmentCount: number;
};

export type DashboardReport = {
  generatedAtUtc: string;
  periodStart: string;
  periodEnd: string;
  days: number;
  counts: DashboardCounts;
  appointments: DashboardAppointmentsSummary;
  appointmentsByStatus: DashboardStatusRow[];
  appointmentsCreatedPerDay: DashboardDayCount[];
  appointmentsStartingPerDay: DashboardDayCount[];
  topServicesByAppointments: DashboardTopService[];
};

const emptyCounts: DashboardCounts = {
  patients: 0,
  providers: 0,
  servicesActive: 0,
  staffAccountsActive: 0,
};

const emptyAppointments: DashboardAppointmentsSummary = {
  totalInPeriod: 0,
  todayCount: 0,
  upcomingScheduledOrConfirmed: 0,
  completedInPeriod: 0,
  cancelledInPeriod: 0,
  noShowInPeriod: 0,
};

function normalizeReport(raw: Partial<DashboardReport>): DashboardReport {
  return {
    generatedAtUtc: raw.generatedAtUtc ?? new Date().toISOString(),
    periodStart: raw.periodStart ?? "",
    periodEnd: raw.periodEnd ?? "",
    days: typeof raw.days === "number" ? raw.days : 0,
    counts: { ...emptyCounts, ...raw.counts },
    appointments: { ...emptyAppointments, ...raw.appointments },
    appointmentsByStatus: Array.isArray(raw.appointmentsByStatus)
      ? raw.appointmentsByStatus
      : [],
    appointmentsCreatedPerDay: Array.isArray(raw.appointmentsCreatedPerDay)
      ? raw.appointmentsCreatedPerDay
      : [],
    appointmentsStartingPerDay: Array.isArray(raw.appointmentsStartingPerDay)
      ? raw.appointmentsStartingPerDay
      : [],
    topServicesByAppointments: Array.isArray(raw.topServicesByAppointments)
      ? raw.topServicesByAppointments
      : [],
  };
}

/** GET /api/Reporting/dashboard?days=… */
export async function fetchDashboardReport(
  days: number = 30
): Promise<DashboardReport> {
  const q = new URLSearchParams({ days: String(Math.max(1, Math.min(365, days))) });
  const raw = await apiJson<Partial<DashboardReport>>(
    `/api/Reporting/dashboard?${q.toString()}`,
    { method: "GET" }
  );
  return normalizeReport(raw);
}
