"use client";

import { ClientHttpError, createProvider } from "@/api";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import SpinnerOne from "@/components/ui/spinner/SpinnerOne";
import React, { useState } from "react";

export type ProviderCreateFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

export default function ProviderCreateForm({
  onSuccess,
  onCancel,
}: ProviderCreateFormProps) {
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [email, setEmail] = useState("");
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = name.trim();
    const s = specialty.trim();
    const em = email.trim();
    if (!n || !s || !em) {
      setError("Completa nombre, especialidad y email.");
      return;
    }
    setSubmitting(true);
    try {
      await createProvider({
        name: n,
        specialty: s,
        email: em,
        active,
      });
      onSuccess();
    } catch (err) {
      const msg =
        err instanceof ClientHttpError
          ? err.message
          : "No se pudo crear el colaborador.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      {error ? (
        <p
          className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div>
        <Label>
          Nombre <span className="text-error-500">*</span>
        </Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre completo"
          disabled={submitting}
        />
      </div>
      <div>
        <Label>
          Especialidad <span className="text-error-500">*</span>
        </Label>
        <Input
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          placeholder="Ej. Fisioterapia"
          disabled={submitting}
        />
      </div>
      <div>
        <Label>
          Email <span className="text-error-500">*</span>
        </Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          disabled={submitting}
        />
      </div>
      <div>
        <Checkbox
          id="provider-create-active"
          label="Activo"
          checked={active}
          onChange={setActive}
          disabled={submitting}
        />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button type="submit" size="md" variant="primary" disabled={submitting}>
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <SpinnerOne className="!h-5 !w-5" />
              Guardando…
            </span>
          ) : (
            "Guardar"
          )}
        </Button>
      </div>
    </form>
  );
}
