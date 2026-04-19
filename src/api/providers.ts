import { apiJson } from "./client";

export type Provider = {
  id: string;
  tenantId: string;
  name: string;
  specialty: string;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateProviderRequest = {
  name: string;
  specialty: string;
  email: string;
  active: boolean;
};

/** `ProviderEmailDetailsDto` — alineado con emails de paciente. */
export type ProviderEmailAddress = {
  id: string;
  email: string;
  isPrimary: boolean;
};

/** `ProviderPhoneDetailsDto` — `contact_phone_numbers`, como en pacientes. */
export type ProviderPhoneNumber = {
  id: string;
  phone: string;
  isPrimary: boolean;
};

/** `ProviderProfileDetailsDto` / perfil en detalle. */
export type ProviderProfileDetails = {
  specialty: string;
  active: boolean;
  createdAt: string;
  updatedAt: string | null;
};

/** `ProviderDetailsDto` — GET .../details (contacto completo + perfil + emails + teléfonos). */
export type ProviderDetails = {
  id: string;
  tenantId: string;
  relatedContactId: string | null;
  displayName: string;
  profile: ProviderProfileDetails;
  emailAddresses: ProviderEmailAddress[];
  phoneNumbers: ProviderPhoneNumber[];
  createdAt: string;
  updatedAt: string | null;
};

type ProviderDetailsApi = Omit<
  ProviderDetails,
  "profile" | "emailAddresses" | "phoneNumbers"
> & {
  profile?: ProviderProfileDetails | null;
  emailAddresses?: ProviderEmailAddress[] | null;
  phoneNumbers?: ProviderPhoneNumber[] | null;
};

function normalizeProviderDetails(raw: ProviderDetailsApi): ProviderDetails {
  const profile: ProviderProfileDetails =
    raw.profile && typeof raw.profile === "object"
      ? {
          specialty: raw.profile.specialty ?? "",
          active: Boolean(raw.profile.active),
          createdAt: raw.profile.createdAt ?? raw.createdAt ?? "",
          updatedAt: raw.profile.updatedAt ?? null,
        }
      : {
          specialty: "",
          active: true,
          createdAt: raw.createdAt ?? "",
          updatedAt: raw.updatedAt ?? null,
        };

  return {
    id: raw.id,
    tenantId: raw.tenantId,
    relatedContactId:
      raw.relatedContactId === undefined || raw.relatedContactId === ""
        ? null
        : raw.relatedContactId,
    displayName: raw.displayName ?? "",
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? null,
    profile,
    emailAddresses: Array.isArray(raw.emailAddresses)
      ? raw.emailAddresses
      : [],
    phoneNumbers: Array.isArray(raw.phoneNumbers) ? raw.phoneNumbers : [],
  };
}

/** GET /api/Providers */
export async function fetchProviders(): Promise<Provider[]> {
  return apiJson<Provider[]>("/api/Providers", { method: "GET" });
}

/** GET /api/Providers/{id}/details (JWT + tenant; include perfil, emails y teléfonos). */
export async function fetchProviderDetails(
  id: string
): Promise<ProviderDetails> {
  const raw = await apiJson<ProviderDetailsApi>(
    `/api/Providers/${encodeURIComponent(id)}/details`,
    { method: "GET" }
  );
  return normalizeProviderDetails(raw);
}

/** POST /api/Providers */
export async function createProvider(
  body: CreateProviderRequest
): Promise<Provider> {
  return apiJson<Provider>("/api/Providers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
