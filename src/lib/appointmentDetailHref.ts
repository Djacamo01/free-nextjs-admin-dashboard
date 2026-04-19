/** Ruta de la app al detalle de cita (`/calendar/event/detail/[id]`). */
export function appointmentDetailHref(appointmentId: string): string {
  return `/calendar/event/detail/${encodeURIComponent(appointmentId.trim())}`;
}

export function hasAppointmentDetailId(
  id: string | undefined
): id is string {
  return typeof id === "string" && id.trim().length > 0;
}
