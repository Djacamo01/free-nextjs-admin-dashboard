"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getProviderAvailability,
  createProviderAvailability,
  deleteProviderAvailability,
  getProviderTimeOff,
  createProviderTimeOff,
  deleteProviderTimeOff,
  ProviderAvailabilityDto,
  ProviderTimeOffDto,
} from "@/api/providerAvailability";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function ProviderAvailabilityPage() {
  const { id } = useParams<{ id: string }>();
  const [availability, setAvailability] = useState<ProviderAvailabilityDto[]>([]);
  const [timeOff, setTimeOff] = useState<ProviderTimeOffDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState({ dayOfWeek: 1, startTime: "09:00", endTime: "17:00", slotDuration: 30 });
  const [newTimeOff, setNewTimeOff] = useState({ startDatetime: "", endDatetime: "", reason: "" });

  useEffect(() => {
    Promise.all([getProviderAvailability(id), getProviderTimeOff(id)])
      .then(([av, to]) => {
        setAvailability(av);
        setTimeOff(to);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const addSlot = async () => {
    const slot = await createProviderAvailability(id, newSlot);
    setAvailability((prev) => [...prev, slot].sort((a, b) => a.dayOfWeek - b.dayOfWeek));
  };

  const removeSlot = async (slotId: string) => {
    await deleteProviderAvailability(id, slotId);
    setAvailability((prev) => prev.filter((s) => s.id !== slotId));
  };

  const addTimeOff = async () => {
    const to = await createProviderTimeOff(id, newTimeOff);
    setTimeOff((prev) => [...prev, to]);
    setNewTimeOff({ startDatetime: "", endDatetime: "", reason: "" });
  };

  const removeTimeOff = async (toId: string) => {
    await deleteProviderTimeOff(id, toId);
    setTimeOff((prev) => prev.filter((t) => t.id !== toId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Disponibilidad semanal</h1>
        <p className="text-gray-500 dark:text-[#94a3b8] text-sm mt-1">Configura los horarios disponibles por día</p>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-[#334155] p-5">
        <h2 className="text-gray-900 dark:text-white font-medium mb-4">Horarios regulares</h2>
        <div className="space-y-2 mb-4">
          {availability.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-[#334155] last:border-0">
              <div className="flex items-center gap-4">
                <span className="text-gray-900 dark:text-white text-sm w-20">{DAYS[slot.dayOfWeek]}</span>
                <span className="text-gray-500 dark:text-[#94a3b8] text-sm">{slot.startTime} — {slot.endTime}</span>
                <span className="text-gray-400 dark:text-[#64748b] text-xs">{slot.slotDuration} min/slot</span>
              </div>
              <button onClick={() => removeSlot(slot.id)} className="text-gray-400 dark:text-[#64748b] hover:text-red-500 dark:hover:text-red-400 text-xs transition-colors">Eliminar</button>
            </div>
          ))}
          {availability.length === 0 && <p className="text-gray-400 dark:text-[#64748b] text-sm">Sin horarios configurados.</p>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100 dark:border-[#334155]">
          <select
            value={newSlot.dayOfWeek}
            onChange={(e) => setNewSlot((s) => ({ ...s, dayOfWeek: Number(e.target.value) }))}
            className="bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-[#334155] rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-[#3b82f6]"
          >
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
          <input type="time" value={newSlot.startTime}
            onChange={(e) => setNewSlot((s) => ({ ...s, startTime: e.target.value }))}
            className="bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-[#334155] rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-[#3b82f6]" />
          <input type="time" value={newSlot.endTime}
            onChange={(e) => setNewSlot((s) => ({ ...s, endTime: e.target.value }))}
            className="bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-[#334155] rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-[#3b82f6]" />
          <button onClick={addSlot}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
            + Agregar
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-[#334155] p-5">
        <h2 className="text-gray-900 dark:text-white font-medium mb-4">Bloqueos / Ausencias</h2>
        <div className="space-y-2 mb-4">
          {timeOff.map((to) => (
            <div key={to.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-[#334155] last:border-0">
              <div>
                <div className="text-gray-900 dark:text-white text-sm">{new Date(to.startDatetime).toLocaleString()} — {new Date(to.endDatetime).toLocaleString()}</div>
                {to.reason && <div className="text-gray-500 dark:text-[#94a3b8] text-xs">{to.reason}</div>}
              </div>
              <button onClick={() => removeTimeOff(to.id)} className="text-gray-400 dark:text-[#64748b] hover:text-red-500 dark:hover:text-red-400 text-xs transition-colors">Eliminar</button>
            </div>
          ))}
          {timeOff.length === 0 && <p className="text-gray-400 dark:text-[#64748b] text-sm">Sin bloqueos registrados.</p>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100 dark:border-[#334155]">
          <input type="datetime-local" value={newTimeOff.startDatetime}
            onChange={(e) => setNewTimeOff((t) => ({ ...t, startDatetime: e.target.value }))}
            className="bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-[#334155] rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-[#3b82f6]" />
          <input type="datetime-local" value={newTimeOff.endDatetime}
            onChange={(e) => setNewTimeOff((t) => ({ ...t, endDatetime: e.target.value }))}
            className="bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-[#334155] rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-[#3b82f6]" />
          <button onClick={addTimeOff}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
            + Bloquear
          </button>
        </div>
      </div>
    </div>
  );
}
