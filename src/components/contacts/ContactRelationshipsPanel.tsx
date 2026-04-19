"use client";
import { useEffect, useRef, useState } from "react";
import {
  getContactRelationships,
  getContactHierarchy,
  createContactRelationship,
  deleteContactRelationship,
  ContactRelationshipDto,
  ContactWithHierarchyDto,
} from "@/api/contactRelationships";
import { fetchAllContacts, ContactSearchResult } from "@/api/contactSearch";

const ROLE_META: Record<string, { label: string; cls: string }> = {
  Patient:  { label: "Cliente",     cls: "bg-blue-100   text-blue-700   dark:bg-blue-500/10   dark:text-blue-400"   },
  Provider: { label: "Colaborador", cls: "bg-brand-100  text-brand-700  dark:bg-brand-500/10  dark:text-brand-400"  },
  Staff:    { label: "Staff",       cls: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400" },
};

const RELATIONSHIP_TYPES = [
  { value: "family",           label: "Familiar"                },
  { value: "guardian",         label: "Tutor / Apoderado"       },
  { value: "emergency_contact",label: "Contacto de emergencia"  },
  { value: "billing_contact",  label: "Contacto de facturación" },
  { value: "employee",         label: "Empleado"                },
  { value: "referral",         label: "Referido por"            },
  { value: "other",            label: "Otro"                    },
];

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role];
  if (!meta) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

interface ContactPickerProps {
  onSelect: (contact: ContactSearchResult) => void;
  excludeId: string;
}

function ContactPicker({ onSelect, excludeId }: ContactPickerProps) {
  const [all, setAll] = useState<ContactSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAllContacts()
      .then(setAll)
      .catch(console.error)
      .finally(() => setLoading(false));
    inputRef.current?.focus();
  }, []);

  const results = all.filter((c) => {
    if (c.id === excludeId) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${c.displayName} ${c.email}`.toLowerCase().includes(q);
  }).slice(0, 30);

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre o email…"
        className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-3 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-white dark:placeholder:text-gray-500"
      />
      {loading ? (
        <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">Cargando contactos…</p>
      ) : results.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
          {query.trim() ? `Sin resultados para «${query.trim()}»` : "No hay contactos disponibles"}
        </p>
      ) : (
        <ul className="max-h-56 overflow-y-auto rounded-lg border border-gray-100 dark:border-white/[0.08]">
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                  {c.displayName[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{c.displayName}</p>
                  {c.email && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{c.email}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap gap-1">
                  {c.roles.map((r) => <RoleBadge key={r} role={r} />)}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface Props {
  contactId: string;
}

export function ContactRelationshipsPanel({ contactId }: Props) {
  const [hierarchy, setHierarchy] = useState<ContactWithHierarchyDto | null>(null);
  const [relationships, setRelationships] = useState<ContactRelationshipDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<ContactSearchResult | null>(null);
  const [relType, setRelType] = useState("family");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      getContactHierarchy(contactId),
      getContactRelationships(contactId),
    ]).then(([h, r]) => {
      if (cancelled) return;
      if (h.status === "fulfilled") setHierarchy(h.value);
      if (r.status === "fulfilled") setRelationships(r.value);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [contactId]);

  const handleAdd = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const rel = await createContactRelationship(contactId, {
        relatedContactId: selected.id,
        relationshipType: relType,
        label: label.trim() || undefined,
      });
      setRelationships((prev) => [...prev, rel]);
      setAdding(false);
      setSelected(null);
      setLabel("");
      setRelType("family");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (relId: string) => {
    await deleteContactRelationship(contactId, relId);
    setRelationships((prev) => prev.filter((r) => r.id !== relId));
  };

  if (loading) {
    return <p className="text-sm text-gray-400 dark:text-gray-500">Cargando…</p>;
  }

  const roles = hierarchy?.roles ?? [];
  const parent = hierarchy?.parentContactName;
  const children = hierarchy?.children ?? [];

  return (
    <div className="space-y-5">
      {/* Roles del contacto */}
      {roles.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Roles en el sistema
          </p>
          <div className="flex flex-wrap gap-1.5">
            {roles.map((r) => <RoleBadge key={r} role={r} />)}
          </div>
          {roles.length > 1 && (
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              Este contacto tiene múltiples roles — aparece en las secciones correspondientes del menú.
            </p>
          )}
        </div>
      )}

      {/* Jerarquía (empresa padre / hijos) */}
      {(parent || children.length > 0) && (
        <div>
          <p className="mb-2 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Jerarquía
          </p>
          <div className="space-y-1">
            {parent && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 dark:text-gray-500">Empresa:</span>
                <span className="font-medium text-gray-900 dark:text-white">{parent}</span>
              </div>
            )}
            {children.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <span className="shrink-0 text-gray-400 dark:text-gray-500">Vinculados:</span>
                <span className="text-gray-900 dark:text-white">
                  {children.map((c) => c.displayName).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Relaciones M:N */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Contactos relacionados
          </p>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
            >
              + Agregar
            </button>
          )}
        </div>

        {relationships.length === 0 && !adding && (
          <p className="text-sm text-gray-400 dark:text-gray-500">Sin contactos relacionados.</p>
        )}

        <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
          {relationships.map((rel) => (
            <div key={rel.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {rel.relatedContactName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {rel.label || RELATIONSHIP_TYPES.find((t) => t.value === rel.relationshipType)?.label || rel.relationshipType}
                </p>
              </div>
              <button
                onClick={() => handleDelete(rel.id)}
                className="shrink-0 text-xs text-gray-400 hover:text-error-500 dark:hover:text-error-400 transition-colors"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>

        {adding && (
          <div className="mt-4 space-y-3 rounded-lg border border-gray-100 p-4 dark:border-white/[0.08]">
            {selected ? (
              <div className="flex items-center gap-3 rounded-lg bg-brand-50 px-3 py-2 dark:bg-brand-500/10">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                  {selected.displayName[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-900 dark:text-brand-100">{selected.displayName}</p>
                  <div className="flex gap-1 mt-0.5">
                    {selected.roles.map((r) => <RoleBadge key={r} role={r} />)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-xs text-brand-600 hover:text-brand-800 dark:text-brand-400"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <ContactPicker onSelect={setSelected} excludeId={contactId} />
            )}

            {selected && (
              <>
                <select
                  value={relType}
                  onChange={(e) => setRelType(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-white"
                >
                  {RELATIONSHIP_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Etiqueta personalizada (opcional)"
                  className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-white dark:placeholder:text-gray-500"
                />
              </>
            )}

            <div className="flex gap-2">
              {selected && (
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={saving}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              )}
              <button
                type="button"
                onClick={() => { setAdding(false); setSelected(null); setLabel(""); setRelType("family"); }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-white/[0.12] dark:text-gray-400 dark:hover:bg-white/[0.04]"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
