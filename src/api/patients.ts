import { apiJson } from "./client";

export type Patient = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  preferredChannel: string;
  notes: string;
  createdAt: string;
  updatedAt: string | null;
};

export type PatientEmailAddress = {
  id: string;
  email: string;
  isPrimary: boolean;
};

export type PatientPhoneNumber = {
  id: string;
  phone: string;
  isPrimary: boolean;
};

export type PatientChannelIdentity = {
  id: string;
  channel: number;
  externalUserId: string;
  createdAt: string;
};

export type PatientProfile = {
  preferredChannel: string;
  notes: string;
  createdAt: string;
  updatedAt: string | null;
};

export type PatientDetails = {
  id: string;
  tenantId: string;
  relatedContactId: string | null;
  displayName: string;
  profile: PatientProfile;
  emailAddresses: PatientEmailAddress[];
  phoneNumbers: PatientPhoneNumber[];
  channelIdentities: PatientChannelIdentity[];
  createdAt: string;
  updatedAt: string | null;
};

/** Cuerpo real del GET: listas y perfil pueden faltar o ser null. */
type PatientDetailsApi = Omit<
  PatientDetails,
  "profile" | "emailAddresses" | "phoneNumbers" | "channelIdentities"
> & {
  profile?: PatientProfile | null;
  emailAddresses?: PatientEmailAddress[] | null;
  phoneNumbers?: PatientPhoneNumber[] | null;
  channelIdentities?: PatientChannelIdentity[] | null;
};

function normalizePatientDetails(raw: PatientDetailsApi): PatientDetails {
  const profile: PatientProfile =
    raw.profile && typeof raw.profile === "object"
      ? {
          preferredChannel: raw.profile.preferredChannel ?? "",
          notes: raw.profile.notes ?? "",
          createdAt: raw.profile.createdAt ?? raw.createdAt ?? "",
          updatedAt: raw.profile.updatedAt ?? null,
        }
      : {
          preferredChannel: "",
          notes: "",
          createdAt: raw.createdAt ?? "",
          updatedAt: raw.updatedAt ?? null,
        };

  return {
    ...raw,
    profile,
    emailAddresses: Array.isArray(raw.emailAddresses)
      ? raw.emailAddresses
      : [],
    phoneNumbers: Array.isArray(raw.phoneNumbers) ? raw.phoneNumbers : [],
    channelIdentities: Array.isArray(raw.channelIdentities)
      ? raw.channelIdentities
      : [],
  };
}

export type CreatePatientEmailInput = {
  email: string;
  isPrimary: boolean;
};

export type CreatePatientPhoneInput = {
  phone: string;
  isPrimary: boolean;
};

export type CreatePatientChannelInput = {
  channel: number;
  externalUserId: string;
};

export type CreatePatientRequest = {
  displayName: string;
  relatedContactId: string | null;
  preferredChannel: string;
  notes: string;
  emailAddresses: CreatePatientEmailInput[];
  phoneNumbers: CreatePatientPhoneInput[];
  channelIdentities: CreatePatientChannelInput[];
};

export async function fetchPatients(): Promise<Patient[]> {
  return apiJson<Patient[]>("/api/Patients", { method: "GET" });
}

/** GET /api/Patients/{patientId}/details */
export async function fetchPatientDetails(
  patientId: string
): Promise<PatientDetails> {
  const raw = await apiJson<PatientDetailsApi>(
    `/api/Patients/${encodeURIComponent(patientId)}/details`,
    {
      method: "GET",
    }
  );
  return normalizePatientDetails(raw);
}

/** POST /api/Patients/details */
export async function createPatient(
  body: CreatePatientRequest
): Promise<Patient> {
  return apiJson<Patient>("/api/Patients/details", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
