/**
 * Valores públicos del dominio (Postgres enums / contrato API).
 * Usar estos tipos y etiquetas para mantener la UI alineada con el backend.
 */

export const APPOINTMENT_STATUS = [
  "scheduled",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
  "rescheduled",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[number];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Programada",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No asistió",
  rescheduled: "Reprogramada",
};

export const CONVERSATION_STATUS = [
  "open",
  "closed",
  "bot",
  "human",
] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUS)[number];

export const CONVERSATION_STATUS_LABELS: Record<ConversationStatus, string> = {
  open: "Abierta",
  closed: "Cerrada",
  bot: "Bot",
  human: "Humano",
};

export const SENDER_TYPE = ["patient", "bot", "staff", "system"] as const;
export type SenderType = (typeof SENDER_TYPE)[number];

export const SENDER_TYPE_LABELS: Record<SenderType, string> = {
  patient: "Paciente",
  bot: "Bot",
  staff: "Equipo",
  system: "Sistema",
};

export const CHANNEL_TYPE = ["email", "whatsapp", "webchat", "sms"] as const;
export type ChannelType = (typeof CHANNEL_TYPE)[number];

export const CHANNEL_TYPE_LABELS: Record<ChannelType, string> = {
  email: "Correo",
  whatsapp: "WhatsApp",
  webchat: "Chat web",
  sms: "SMS",
};

export const NOTIFICATION_STATUS = ["pending", "sent", "failed"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUS)[number];

export const NOTIFICATION_STATUS_LABELS: Record<NotificationStatus, string> = {
  pending: "Pendiente",
  sent: "Enviada",
  failed: "Fallida",
};

export const CONTACT_ROLE = [
  "staff",
  "patient",
  "provider",
  "partner",
] as const;
export type ContactRole = (typeof CONTACT_ROLE)[number];

export const CONTACT_ROLE_LABELS: Record<ContactRole, string> = {
  staff: "Equipo",
  patient: "Paciente",
  provider: "Proveedor",
  partner: "Partner",
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

export function isChannelType(value: string): value is ChannelType {
  return (CHANNEL_TYPE as readonly string[]).includes(norm(value));
}

/** Etiqueta legible para `channel_type` o strings equivalentes del API. */
export function labelChannelType(value: string): string {
  const k = norm(value);
  return isChannelType(k) ? CHANNEL_TYPE_LABELS[k] : value;
}

/** Normaliza `scheduled` / `Scheduled` / `NoShow` → clave del enum de dominio. */
function resolveAppointmentStatusKey(value: string): AppointmentStatus | null {
  const k = norm(value).replace(/\s+/g, "_").replace(/-/g, "_");
  if (k === "noshow") return "no_show";
  if ((APPOINTMENT_STATUS as readonly string[]).includes(k as AppointmentStatus)) {
    return k as AppointmentStatus;
  }
  return null;
}

export function isAppointmentStatus(value: string): value is AppointmentStatus {
  return resolveAppointmentStatusKey(value) != null;
}

export function labelAppointmentStatus(value: string): string {
  const key = resolveAppointmentStatusKey(value);
  return key ? APPOINTMENT_STATUS_LABELS[key] : value;
}

/** Tono visual para badges (lista, tablas); alineado con `Badge` del UI kit. */
export type AppointmentStatusBadgeTone =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "light";

export function appointmentStatusBadgeTone(
  raw: string
): AppointmentStatusBadgeTone {
  const key = resolveAppointmentStatusKey(raw);
  if (key) {
    switch (key) {
      case "cancelled":
        return "error";
      case "completed":
      case "confirmed":
        return "success";
      case "no_show":
      case "rescheduled":
        return "warning";
      case "scheduled":
        return "primary";
      default:
        return "light";
    }
  }
  const k = norm(raw);
  if (k.includes("cancel")) return "error";
  if (k.includes("complet")) return "success";
  if (k.includes("confirm")) return "success";
  if (k.includes("noshow") || k.includes("no_show")) return "warning";
  if (k.includes("reschedul")) return "warning";
  if (k.includes("schedul")) return "primary";
  return "light";
}

export function isConversationStatus(
  value: string
): value is ConversationStatus {
  const k = norm(value);
  return (CONVERSATION_STATUS as readonly string[]).includes(
    k as ConversationStatus
  );
}

export function labelConversationStatus(value: string): string {
  if (!isConversationStatus(value)) return value;
  return CONVERSATION_STATUS_LABELS[norm(value) as ConversationStatus];
}

export function isSenderType(value: string): value is SenderType {
  const k = norm(value);
  return (SENDER_TYPE as readonly string[]).includes(k as SenderType);
}

export function labelSenderType(value: string): string {
  if (!isSenderType(value)) return value;
  return SENDER_TYPE_LABELS[norm(value) as SenderType];
}

export function isNotificationStatus(
  value: string
): value is NotificationStatus {
  const k = norm(value);
  return (NOTIFICATION_STATUS as readonly string[]).includes(
    k as NotificationStatus
  );
}

export function labelNotificationStatus(value: string): string {
  if (!isNotificationStatus(value)) return value;
  return NOTIFICATION_STATUS_LABELS[norm(value) as NotificationStatus];
}

export function isContactRole(value: string): value is ContactRole {
  const k = norm(value);
  return (CONTACT_ROLE as readonly string[]).includes(k as ContactRole);
}

export function labelContactRole(value: string): string {
  if (!isContactRole(value)) return value;
  return CONTACT_ROLE_LABELS[norm(value) as ContactRole];
}

/**
 * Código numérico de canal en `channelIdentities` → `channel_type`.
 * Ampliar cuando el backend documente el mapa completo.
 * (Ejemplo previo: canal 1 ↔ WhatsApp.)
 */
export const CHANNEL_TYPE_BY_API_CODE: Partial<Record<number, ChannelType>> = {
  0: "email",
  1: "whatsapp",
  2: "webchat",
  3: "sms",
};

/** `channel_type` → código numérico del API (p. ej. `channelIdentities`). */
export const CHANNEL_CODE_BY_TYPE: Record<ChannelType, number> = {
  email: 0,
  whatsapp: 1,
  webchat: 2,
  sms: 3,
};

export function labelChannelFromApiCode(code: number): string {
  const t = CHANNEL_TYPE_BY_API_CODE[code];
  return t != null ? CHANNEL_TYPE_LABELS[t] : `Canal (${code})`;
}
