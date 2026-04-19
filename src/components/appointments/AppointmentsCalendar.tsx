"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventContentArg, EventInput } from "@fullcalendar/core";
import { useModal } from "@/hooks/useModal";
import AppointmentQuickModal from "./AppointmentQuickModal";
import { fetchAppointments, type Appointment } from "@/api/appointments";
import React, { useCallback, useEffect, useRef, useState } from "react";

type EventLabels = {
  patientLine: string;
  serviceLine: string;
  providerLine: string | null;
  statusLabel: string;
};

type CalendarEvent = EventInput & {
  extendedProps: {
    calendar: string;
    appointment?: Appointment;
    labels: EventLabels;
  };
};

const calendarsEvents = {
  Danger: "danger",
  Success: "success",
  Primary: "primary",
  Warning: "warning",
} as const;

function statusToCalendarKey(status: string): keyof typeof calendarsEvents {
  const s = status.toLowerCase();
  if (s.includes("cancel")) return "Danger";
  if (s.includes("confirm")) return "Success";
  if (s.includes("no_show") || s.includes("noshow")) return "Warning";
  if (s.includes("reschedul")) return "Warning";
  if (s.includes("complet")) return "Primary";
  return "Primary";
}

function appointmentEventLabels(a: Appointment): EventLabels {
  const patient = a.patient?.displayName?.trim() || "Sin cliente";
  const service = a.service?.name?.trim() || "Sin servicio";
  const provider = a.provider?.displayName?.trim() || null;
  return {
    patientLine: patient,
    serviceLine: service,
    providerLine: provider,
    statusLabel: a.status,
  };
}

function appointmentsToEvents(list: Appointment[]): CalendarEvent[] {
  return list.map((a) => {
    const key = statusToCalendarKey(a.status);
    const labels = appointmentEventLabels(a);
    const title = `${labels.patientLine} · ${labels.serviceLine}`;
    return {
      id: a.id,
      title,
      start: a.startTime,
      end: a.endTime,
      allDay: false,
      extendedProps: { calendar: key, appointment: a, labels },
    };
  });
}

type Props = {
  /** Vista inicial: en pestaña embebida conviene semana. */
  initialView?: "dayGridMonth" | "timeGridWeek" | "timeGridDay";
  /** Incrementar tras crear/editar citas para recargar eventos. */
  refreshTrigger?: number;
};

export default function AppointmentsCalendar({
  initialView = "timeGridWeek",
  refreshTrigger = 0,
}: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Appointment | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAppointments();
      setEvents(appointmentsToEvents(list));
    } catch (e) {
      setEvents([]);
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar las citas."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshTrigger]);

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const app = (clickInfo.event.extendedProps as { appointment?: Appointment })
        .appointment;
      if (app) {
        setDetail(app);
        openModal();
      }
    },
    [openModal]
  );

  return (
    <div className="space-y-2">
      {loading ? (
        <p className="py-1 text-center text-xs text-gray-500 dark:text-gray-400">
          Cargando citas…
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="custom-calendar rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={initialView}
          customButtons={{
            refreshAppointments: {
              text: "Actualizar",
              click: () => void load(),
            },
          }}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right:
              "refreshAppointments,dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          selectable={false}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          /* timeGrid requiere altura explícita; aprovecha alto de ventana menos cabecera del layout */
          height="calc(100vh - 16rem)"
          /*
           * Incluir 00:00–24:00: con 06:00–22:00 las citas fuera de ese rango no tienen “ranura”
           * en semana/día (la vista mes sí muestra el día). Ver timeGrid en la doc de FullCalendar.
           * https://fullcalendar.io/docs/slotMinTime
           */
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          slotDuration="00:30:00"
          scrollTime="08:00:00"
          locale="es"
          datesSet={() => {
            requestAnimationFrame(() =>
              calendarRef.current?.getApi().updateSize()
            );
          }}
          buttonText={{
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
          }}
        />
      </div>

      <AppointmentQuickModal
        isOpen={isOpen}
        onClose={() => {
          closeModal();
          setDetail(null);
        }}
        appointment={detail}
        onAppointmentUpdated={(updated) => {
          setDetail(updated);
          void load();
        }}
      />
    </div>
  );
}

function renderEventContent(eventInfo: EventContentArg) {
  const props = eventInfo.event.extendedProps as {
    calendar?: string;
    labels?: EventLabels;
  };
  const cal = props.calendar;
  const key = cal && typeof cal === "string" ? cal : "Primary";
  const colorClass = `fc-bg-${key.toLowerCase()}`;
  const viewType = eventInfo.view.type;
  const isTimeGrid =
    viewType === "timeGridWeek" || viewType === "timeGridDay";

  const labels = props.labels;
  const patient = labels?.patientLine ?? eventInfo.event.title;
  const service = labels?.serviceLine;
  const provider = labels?.providerLine;
  const status = labels?.statusLabel;

  /* dayGridMonth: compacto; timeGrid: paciente + servicio (+ proveedor si cabe). */
  if (isTimeGrid) {
    return (
      <div
        className={`event-fc-color fc-event-main flex min-h-full w-full min-w-0 flex-col gap-0.5 overflow-hidden rounded px-1 py-0.5 text-left ${colorClass}`}
      >
        <div className="fc-event-time shrink-0 text-[10px] leading-tight opacity-90">
          {eventInfo.timeText}
        </div>
        <div className="fc-event-title line-clamp-2 text-xs font-semibold leading-snug">
          {patient}
        </div>
        {service ? (
          <div className="line-clamp-2 text-[10px] leading-snug opacity-90">
            {service}
          </div>
        ) : null}
        {provider ? (
          <div className="line-clamp-1 text-[9px] leading-tight opacity-75">
            {provider}
          </div>
        ) : null}
        {status ? (
          <div className="mt-auto text-[9px] font-medium uppercase tracking-wide opacity-80">
            {status}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`event-fc-color flex fc-event-main min-w-0 ${colorClass} rounded-sm p-1`}
    >
      <div className="fc-daygrid-event-dot shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="fc-event-time">{eventInfo.timeText}</div>
        <div className="fc-event-title line-clamp-2 font-medium">{patient}</div>
        {service ? (
          <div className="line-clamp-1 text-[11px] opacity-90">{service}</div>
        ) : null}
      </div>
    </div>
  );
}
