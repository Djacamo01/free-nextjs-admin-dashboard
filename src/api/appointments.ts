import { apiJson } from "./client";

export type AppointmentContactSummary = {
  id: string;
  displayName: string;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
};

export type AppointmentServiceSummary = {
  id: string;
  name: string;
  durationMinutes: number;
  bufferMinutes: number;
  priceReference?: number | null;
};

/** Coincide con `AppointmentBasicDto` en cliente tras normalizar. */
export type Appointment = {
  id: string;
  tenantId: string;
  patientId: string | null;
  providerId: string | null;
  serviceId: string | null;
  patient: AppointmentContactSummary | null;
  provider: AppointmentContactSummary | null;
  service: AppointmentServiceSummary | null;
  startTime: string;
  endTime: string;
  status: string;
  sourceChannel: string;
  confirmationStatus: string;
  notes: string;
  createdAt: string;
  updatedAt: string | null;
};

type LooseContact = {
  id?: string | null;
  displayName?: string | null;
  name?: string | null;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
};

type LooseService = {
  id?: string | null;
  name?: string | null;
  durationMinutes?: number;
  bufferMinutes?: number;
  priceReference?: number | null;
};

/** Cuerpo real de GET lista / POST: anidados y/o ids + nombres planos. */
export type AppointmentListApi = {
  id: string;
  tenantId: string;
  patientId: string | null;
  providerId: string | null;
  serviceId: string | null;
  patient?: LooseContact | AppointmentContactSummary | null;
  provider?: LooseContact | AppointmentContactSummary | null;
  service?: LooseService | AppointmentServiceSummary | null;
  patientDisplayName?: string | null;
  providerDisplayName?: string | null;
  serviceName?: string | null;
  startTime: string;
  endTime: string;
  status: string;
  sourceChannel: string;
  confirmationStatus: string;
  notes: string;
  createdAt: string;
  updatedAt: string | null;
};

function contactFromListApi(
  nested: LooseContact | AppointmentContactSummary | null | undefined,
  flatId: string | null,
  flatDisplayName?: string | null
): AppointmentContactSummary | null {
  const id =
    (nested && nested.id != null && String(nested.id)) || (flatId ? String(flatId) : "");
  if (!id) return null;
  const fromNested =
    nested && typeof nested === "object"
      ? String(
          (nested.displayName ??
            ("name" in nested ? nested.name : undefined) ??
            ""
          ).trim() || ""
        )
      : "";
  const fromFlat =
    typeof flatDisplayName === "string" ? flatDisplayName.trim() : "";
  const displayName = fromNested || fromFlat || id;
  const primaryEmail =
    nested && "primaryEmail" in nested ? nested.primaryEmail ?? null : null;
  const primaryPhone =
    nested && "primaryPhone" in nested ? nested.primaryPhone ?? null : null;
  return { id, displayName, primaryEmail, primaryPhone };
}

function serviceFromListApi(
  nested: LooseService | AppointmentServiceSummary | null | undefined,
  flatId: string | null,
  flatName?: string | null
): AppointmentServiceSummary | null {
  const id =
    (nested && nested.id != null && String(nested.id)) || (flatId ? String(flatId) : "");
  if (!id) return null;
  const fromNested =
    nested && typeof nested === "object" && nested.name != null
      ? String(nested.name).trim()
      : "";
  const fromFlat = typeof flatName === "string" ? flatName.trim() : "";
  const name = fromNested || fromFlat || id;
  const durationMinutes =
    nested && typeof nested === "object"
      ? Number(nested.durationMinutes) || 0
      : 0;
  const bufferMinutes =
    nested && typeof nested === "object"
      ? Number(nested.bufferMinutes) || 0
      : 0;
  const priceReference =
    nested && typeof nested === "object" && "priceReference" in nested
      ? nested.priceReference ?? null
      : null;
  return {
    id,
    name,
    durationMinutes,
    bufferMinutes,
    priceReference,
  };
}

export function normalizeAppointmentRow(raw: AppointmentListApi): Appointment {
  const patient = contactFromListApi(
    raw.patient,
    raw.patientId,
    raw.patientDisplayName
  );
  const provider = contactFromListApi(
    raw.provider,
    raw.providerId,
    raw.providerDisplayName
  );
  const service = serviceFromListApi(
    raw.service,
    raw.serviceId,
    raw.serviceName
  );

  return {
    id: raw.id,
    tenantId: raw.tenantId,
    patientId: raw.patientId,
    providerId: raw.providerId,
    serviceId: raw.serviceId,
    patient,
    provider,
    service,
    startTime: raw.startTime,
    endTime: raw.endTime,
    status: raw.status,
    sourceChannel: raw.sourceChannel,
    confirmationStatus: raw.confirmationStatus,
    notes: raw.notes,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export type AppointmentEventItem = {
  id: string;
  eventType: string | null;
  data: string | null;
  createdAt: string;
};

/** `AppointmentDetailsDto` — GET .../details */
export type AppointmentDetails = Appointment & {
  events: AppointmentEventItem[];
};

type AppointmentDetailsApi = AppointmentListApi & {
  events?: AppointmentEventItem[] | null;
};

function normalizeAppointmentDetails(raw: AppointmentDetailsApi): AppointmentDetails {
  const { events, ...rest } = raw;
  const base = normalizeAppointmentRow(rest);
  return {
    ...base,
    events: Array.isArray(events) ? events : [],
  };
}

export async function fetchAppointments(): Promise<Appointment[]> {
  const list = await apiJson<AppointmentListApi[]>("/api/Appointments", {
    method: "GET",
  });
  const arr = Array.isArray(list) ? list : [];
  return arr.map(normalizeAppointmentRow);
}

function idsEqual(a: string | null | undefined, b: string): boolean {
  if (a == null || b === "") return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

/** Por `patientId` o id del contacto anidado en `patient`. */
export function appointmentBelongsToPatient(
  a: Appointment,
  patientId: string
): boolean {
  if (idsEqual(a.patientId, patientId)) return true;
  if (a.patient?.id && idsEqual(a.patient.id, patientId)) return true;
  return false;
}

/** Por `providerId` o id del contacto anidado en `provider`. */
export function appointmentBelongsToProvider(
  a: Appointment,
  providerId: string
): boolean {
  if (idsEqual(a.providerId, providerId)) return true;
  if (a.provider?.id && idsEqual(a.provider.id, providerId)) return true;
  return false;
}

/**
 * Lista de citas del tenant filtrada en cliente por paciente.
 * Origen: `GET /api/Appointments` + filtro local.
 */
export async function fetchAppointmentsForPatient(
  patientId: string
): Promise<Appointment[]> {
  const all = await fetchAppointments();
  return all
    .filter((a) => appointmentBelongsToPatient(a, patientId))
    .sort(
      (x, y) =>
        new Date(y.startTime).getTime() - new Date(x.startTime).getTime()
    );
}

/**
 * Lista de citas del tenant filtrada en cliente por colaborador/proveedor.
 * Origen: `GET /api/Appointments` + filtro local.
 */
export async function fetchAppointmentsForProvider(
  providerId: string
): Promise<Appointment[]> {
  const all = await fetchAppointments();
  return all
    .filter((a) => appointmentBelongsToProvider(a, providerId))
    .sort(
      (x, y) =>
        new Date(y.startTime).getTime() - new Date(x.startTime).getTime()
    );
}

/** GET /api/Appointments/{id}/details */
export async function fetchAppointmentDetails(
  id: string
): Promise<AppointmentDetails> {
  const raw = await apiJson<AppointmentDetailsApi>(
    `/api/Appointments/${encodeURIComponent(id)}/details`,
    { method: "GET" }
  );
  return normalizeAppointmentDetails(raw);
}

/** Cuerpo de `POST /api/Appointments` — `CreateAppointmentDto` (camelCase). */
export type CreateAppointmentRequest = {
  patientId: string;
  providerId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: string;
  sourceChannel: string;
  confirmationStatus: string;
  notes: string;
};

export async function createAppointment(
  body: CreateAppointmentRequest
): Promise<Appointment> {
  const created = await apiJson<AppointmentListApi>("/api/Appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return normalizeAppointmentRow(created);
}

/** Cuerpo de `PUT /api/Appointments/{id}` — alineado con el DTO de actualización (camelCase). */
export type UpdateAppointmentRequest = {
  providerId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: string;
  confirmationStatus: string;
  notes: string;
};

export async function updateAppointment(
  id: string,
  body: UpdateAppointmentRequest
): Promise<Appointment> {
  const updated = await apiJson<AppointmentListApi>(
    `/api/Appointments/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  return normalizeAppointmentRow(updated);
}

/** Valores aceptados por `GET /api/Appointments/grouped?groupBy=` (inglés o español). */
export type AppointmentsGroupByParam =
  | "patient"
  | "provider"
  | "service"
  | "paciente"
  | "proveedor"
  | "servicio";

/** Query de `GET /api/Appointments/grouped`. */
export type FetchAppointmentsGroupedQuery = {
  groupBy: AppointmentsGroupByParam;
  /** Inicio del rango sobre `start_time` (UTC, inclusive). ISO 8601. */
  from?: string;
  /** Fin exclusivo sobre `start_time` (UTC). ISO 8601. */
  to?: string;
  /** Por defecto `true`. Con `false` solo conteos y metadatos por grupo. */
  includeAppointments?: boolean;
  /** Máximo de grupos (1–500, defecto backend 200), ordenados por más citas primero. */
  maxGroups?: number;
  /** Tope de citas incluidas por grupo cuando `includeAppointments` es true. */
  maxAppointmentsPerGroup?: number;
};

/** Grupo tal como puede venir del API (campos flexibles). */
type AppointmentGroupListApi = {
  groupKey?: string | null;
  key?: string | null;
  id?: string | null;
  patientId?: string | null;
  providerId?: string | null;
  serviceId?: string | null;
  displayName?: string | null;
  name?: string | null;
  label?: string | null;
  title?: string | null;
  appointmentCount?: number | null;
  count?: number | null;
  totalCount?: number | null;
  appointments?: AppointmentListApi[] | null;
};

type AppointmentsGroupedPayloadApi = {
  groupBy?: string | null;
  groups?: AppointmentGroupListApi[] | null;
};

export type AppointmentGroup = {
  /** Identificador estable del grupo (p. ej. id de paciente/proveedor/servicio). */
  key: string;
  displayLabel: string;
  /** Número de citas en el grupo (según backend / rango). */
  appointmentCount: number;
  appointments: Appointment[];
};

export type AppointmentsGroupedResult = {
  groupBy: string;
  groups: AppointmentGroup[];
};

function normalizeAppointmentGroup(raw: AppointmentGroupListApi): AppointmentGroup {
  const key = String(
    raw.groupKey ??
      raw.key ??
      raw.id ??
      raw.patientId ??
      raw.providerId ??
      raw.serviceId ??
      ""
  ).trim();
  const displayLabel = String(
    raw.displayName ??
      raw.name ??
      raw.label ??
      raw.title ??
      (key || "—")
  ).trim();
  const rawList = Array.isArray(raw.appointments) ? raw.appointments : [];
  const fromFields =
    raw.appointmentCount ?? raw.count ?? raw.totalCount ?? undefined;
  const appointmentCount =
    typeof fromFields === "number" && !Number.isNaN(fromFields)
      ? fromFields
      : rawList.length;
  const appointments = rawList.map(normalizeAppointmentRow);
  return { key, displayLabel, appointmentCount, appointments };
}

function buildGroupedQueryString(q: FetchAppointmentsGroupedQuery): string {
  const p = new URLSearchParams();
  p.set("groupBy", q.groupBy);
  if (q.from != null && q.from !== "") p.set("from", q.from);
  if (q.to != null && q.to !== "") p.set("to", q.to);
  if (q.includeAppointments === false) p.set("includeAppointments", "false");
  if (q.maxGroups != null) p.set("maxGroups", String(q.maxGroups));
  if (q.maxAppointmentsPerGroup != null) {
    p.set("maxAppointmentsPerGroup", String(q.maxAppointmentsPerGroup));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

/**
 * GET /api/Appointments/grouped
 * Agrupa citas por paciente, proveedor o servicio; opcionalmente filtra por rango de fechas.
 */
export async function fetchAppointmentsGrouped(
  query: FetchAppointmentsGroupedQuery
): Promise<AppointmentsGroupedResult> {
  const qs = buildGroupedQueryString(query);
  const raw = await apiJson<AppointmentsGroupedPayloadApi | AppointmentGroupListApi[]>(
    `/api/Appointments/grouped${qs}`,
    { method: "GET" }
  );

  const groupBy =
    !Array.isArray(raw) && typeof raw.groupBy === "string"
      ? raw.groupBy
      : query.groupBy;

  const list: AppointmentGroupListApi[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw.groups)
      ? raw.groups
      : [];

  return {
    groupBy,
    groups: list.map(normalizeAppointmentGroup),
  };
}
