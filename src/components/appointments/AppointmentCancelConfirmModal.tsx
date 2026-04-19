"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import React, { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Se llama al confirmar; si devuelve una promesa, el botón muestra carga hasta terminar. */
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
};

export default function AppointmentCancelConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "¿Cancelar esta cita?",
  description = "La cita quedará como cancelada y la confirmación como rechazada. Los cambios se aplican de inmediato.",
  cancelLabel = "Volver",
  confirmLabel = "Sí, cancelar cita",
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      /* El padre muestra el error; el modal permanece abierto. */
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6 lg:p-8">
      <div className="space-y-4 pr-8 text-sm text-gray-700 dark:text-gray-300">
        <div>
          <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h5>
          <p className="mt-2 leading-relaxed text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading}
            className="!text-gray-700 ring-gray-300 hover:!bg-gray-100 dark:!text-gray-300 dark:ring-gray-600 dark:hover:!bg-white/[0.06]"
            onClick={onClose}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled={loading}
            className="!bg-error-600 !text-white shadow-theme-xs hover:!bg-error-700 disabled:!bg-error-300"
            onClick={() => void handleConfirm()}
          >
            {loading ? "Cancelando…" : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
