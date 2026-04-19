import { apiJson } from "./client";

export type Service = {
  id: string;
  tenantId: string;
  name: string;
  durationMinutes: number;
  bufferMinutes: number;
  priceReference: number;
  active: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export async function fetchServices(): Promise<Service[]> {
  return apiJson<Service[]>("/api/Services", { method: "GET" });
}

export type CreateServiceRequest = {
  name: string;
  durationMinutes: number;
  bufferMinutes: number;
  priceReference: number;
  active: boolean;
};

/** POST /api/Services */
export async function createService(
  body: CreateServiceRequest
): Promise<Service> {
  return apiJson<Service>("/api/Services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
