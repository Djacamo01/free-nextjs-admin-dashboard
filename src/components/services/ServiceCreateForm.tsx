"use client";

import { ClientHttpError, createService } from "@/api";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import SpinnerOne from "@/components/ui/spinner/SpinnerOne";
import React, { useState } from "react";

type ServiceCreateFormProps = {
  onSuccess: () => void;
  onCancel?: () => void;
};

export default function ServiceCreateForm({
  onSuccess,
  onCancel,
}: ServiceCreateFormProps) {
  const [name, setName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [priceReference, setPriceReference] = useState(0);
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = name.trim();
    if (!n) {
      setError("El nombre del servicio es obligatorio.");
      return;
    }
    const dur = Number(durationMinutes);
    const buf = Number(bufferMinutes);
    const price = Number(priceReference);
    if (!Number.isFinite(dur) || dur < 0) {
      setError("La duración debe ser un número mayor o igual a 0.");
      return;
    }
    if (!Number.isFinite(buf) || buf < 0) {
      setError("El margen debe ser un número mayor o igual a 0.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("El precio de referencia debe ser un número mayor o igual a 0.");
      return;
    }

    setSubmitting(true);
    try {
      await createService({
        name: n,
        durationMinutes: Math.round(dur),
        bufferMinutes: Math.round(buf),
        priceReference: price,
        active,
      });
      onSuccess();
    } catch (err) {
      const msg =
        err instanceof ClientHttpError
          ? err.message
          : "No se pudo crear el servicio.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <p
          className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="lg:col-span-2">
          <Label>
            Nombre del servicio <span className="text-error-500">*</span>
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Masaje descontracturante"
            disabled={submitting}
            className="h-12"
          />
        </div>

        <div>
          <Label>Duración (minutos)</Label>
          <Input
            type="number"
            min="0"
            step={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            disabled={submitting}
            className="h-12"
          />
        </div>
        <div>
          <Label>Margen entre citas (minutos)</Label>
          <Input
            type="number"
            min="0"
            step={1}
            value={bufferMinutes}
            onChange={(e) => setBufferMinutes(Number(e.target.value))}
            disabled={submitting}
            className="h-12"
          />
        </div>

        <div className="lg:col-span-2">
          <Label>Precio referencia (₡)</Label>
          <Input
            type="number"
            min="0"
            step={0.01}
            value={priceReference}
            onChange={(e) => setPriceReference(Number(e.target.value))}
            disabled={submitting}
            className="h-12"
          />
        </div>

        <div className="lg:col-span-2">
          <Switch
            label="Servicio activo (visible en catálogo y agenda)"
            checked={active}
            onChange={setActive}
            disabled={submitting}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end dark:border-white/[0.08]">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (!submitting) onCancel();
            }}
            disabled={submitting}
          >
            Cancelar
          </Button>
        ) : null}
        <Button
          type="submit"
          size="md"
          disabled={submitting}
          className="w-full sm:w-auto"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <SpinnerOne className="!h-5 !w-5" />
              Guardando…
            </span>
          ) : (
            "Crear servicio"
          )}
        </Button>
      </div>
    </form>
  );
}
