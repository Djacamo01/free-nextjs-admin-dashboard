import { apiJson } from "./client";

export interface TenantSettingsDto {
  tenantId: string;
  clientLabel: string;
  clientPluralLabel: string;
  providerLabel: string;
  providerPluralLabel: string;
  appointmentLabel: string;
  appointmentPluralLabel: string;
  primaryColor: string;
  logoUrl?: string;
  currencyCode: string;
  dateFormat: string;
}

export type UpdateTenantSettingsDto = Partial<Omit<TenantSettingsDto, "tenantId">>;

export const getTenantSettings = () =>
  apiJson<TenantSettingsDto>("/api/tenant/settings");

export const updateTenantSettings = (dto: UpdateTenantSettingsDto) =>
  apiJson<TenantSettingsDto>("/api/tenant/settings", {
    method: "PUT",
    body: JSON.stringify(dto),
    headers: { "Content-Type": "application/json" },
  });
