import { apiJson } from "./client";

export type CurrentUser = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const CACHE_TTL_MS = 30_000;

let cache: { user: CurrentUser; at: number } | null = null;
let inflight: Promise<CurrentUser> | null = null;

export function invalidateCurrentUserCache() {
  cache = null;
}

/**
 * GET /api/Users/me (Bearer automático vía `apiJson`).
 */
export async function fetchCurrentUser(options?: {
  force?: boolean;
}): Promise<CurrentUser> {
  if (options?.force) {
    cache = null;
    inflight = null;
  }
  if (!options?.force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.user;
  }
  if (!inflight) {
    inflight = apiJson<CurrentUser>("/api/Users/me", {
      method: "GET",
    })
      .then((user) => {
        cache = { user, at: Date.now() };
        return user;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Lista de usuarios del tenant (GET /api/Users). */
export async function fetchUsers(): Promise<CurrentUser[]> {
  return apiJson<CurrentUser[]>("/api/Users", { method: "GET" });
}

/** Actualiza nombre, rol y estado activo de un usuario. */
export async function updateUser(
  id: string,
  dto: { name: string; role: string; active: boolean }
): Promise<CurrentUser> {
  return apiJson<CurrentUser>(`/api/Users/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

/** Cambia la contraseña de un usuario. */
export async function setUserPassword(
  id: string,
  newPassword: string
): Promise<void> {
  await apiJson<void>(`/api/Users/${id}/password`, {
    method: "PATCH",
    body: JSON.stringify({ newPassword }),
  });
}

/** Da acceso al dashboard a un contacto existente. */
export async function grantContactAccess(dto: {
  contactId: string;
  email: string;
  password: string;
  role: string;
}): Promise<CurrentUser> {
  return apiJson<CurrentUser>("/api/Users/grant-access", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

/** Revoca el acceso al dashboard de un contacto (elimina su StaffAccount). */
export async function revokeContactAccess(id: string): Promise<void> {
  await apiJson<void>(`/api/Users/${id}/revoke-access`, { method: "DELETE" });
}
