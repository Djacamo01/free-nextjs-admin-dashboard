import { apiJson } from "./client";

export interface ProviderAvailabilityDto {
  id: string;
  providerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

export interface CreateProviderAvailabilityDto {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration?: number;
}

export interface ProviderTimeOffDto {
  id: string;
  providerId: string;
  startDatetime: string;
  endDatetime: string;
  reason?: string;
}

export interface CreateProviderTimeOffDto {
  startDatetime: string;
  endDatetime: string;
  reason?: string;
}

export const getProviderAvailability = (providerId: string) =>
  apiJson<ProviderAvailabilityDto[]>(`/api/providers/${providerId}/availability`);

export const createProviderAvailability = (providerId: string, dto: CreateProviderAvailabilityDto) =>
  apiJson<ProviderAvailabilityDto>(`/api/providers/${providerId}/availability`, {
    method: "POST",
    body: JSON.stringify(dto),
    headers: { "Content-Type": "application/json" },
  });

export const deleteProviderAvailability = (providerId: string, availabilityId: string) =>
  apiJson<void>(`/api/providers/${providerId}/availability/${availabilityId}`, { method: "DELETE" });

export const getProviderTimeOff = (providerId: string) =>
  apiJson<ProviderTimeOffDto[]>(`/api/providers/${providerId}/time-off`);

export const createProviderTimeOff = (providerId: string, dto: CreateProviderTimeOffDto) =>
  apiJson<ProviderTimeOffDto>(`/api/providers/${providerId}/time-off`, {
    method: "POST",
    body: JSON.stringify(dto),
    headers: { "Content-Type": "application/json" },
  });

export const deleteProviderTimeOff = (providerId: string, timeOffId: string) =>
  apiJson<void>(`/api/providers/${providerId}/time-off/${timeOffId}`, { method: "DELETE" });
