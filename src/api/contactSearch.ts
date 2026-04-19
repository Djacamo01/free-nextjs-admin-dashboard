import { fetchPatients } from "./patients";
import { fetchProviders } from "./providers";

export interface ContactSearchResult {
  id: string;
  displayName: string;
  email: string;
  roles: string[];
}

const ROLE_ORDER = ["Patient", "Provider", "Staff"];

export async function fetchAllContacts(): Promise<ContactSearchResult[]> {
  const [patientsResult, providersResult] = await Promise.allSettled([
    fetchPatients(),
    fetchProviders(),
  ]);

  const map = new Map<string, ContactSearchResult>();

  const merge = (id: string, displayName: string, email: string, role: string) => {
    const existing = map.get(id);
    if (existing) {
      if (!existing.roles.includes(role)) existing.roles.push(role);
    } else {
      map.set(id, { id, displayName, email, roles: [role] });
    }
  };

  if (patientsResult.status === "fulfilled") {
    for (const p of patientsResult.value) merge(p.id, p.name, p.email, "Patient");
  }
  if (providersResult.status === "fulfilled") {
    for (const p of providersResult.value) merge(p.id, p.name, p.email, "Provider");
  }

  return [...map.values()].sort((a, b) => {
    const ai = ROLE_ORDER.indexOf(a.roles[0] ?? "");
    const bi = ROLE_ORDER.indexOf(b.roles[0] ?? "");
    if (ai !== bi) return ai - bi;
    return a.displayName.localeCompare(b.displayName, "es");
  });
}
