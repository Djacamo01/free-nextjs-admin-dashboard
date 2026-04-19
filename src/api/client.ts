import {
  clearAuthSession,
  ensureFreshAccessToken,
  refreshSession,
} from "./auth";
import { getApiBaseUrl } from "./env";
import type { ApiRequestInit } from "./types";
import { getAccessToken } from "./token-storage";

export class ApiHttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public bodyText?: string
  ) {
    super(message);
    this.name = "ApiHttpError";
  }
}

function buildUrl(path: string): string {
  const base = getApiBaseUrl();
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function mergeHeaders(
  init?: RequestInit
): { headers: Headers; rest: RequestInit } {
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json, text/plain, */*");
  }
  const { headers: _h, ...rest } = init ?? {};
  return { headers, rest };
}

/**
 * Cliente HTTP hacia la API configurada en `NEXT_PUBLIC_API_URL`.
 * Añade `Authorization: Bearer` con el access token y refresca antes de expirar o ante 401.
 */
export async function apiFetch(
  path: string,
  init: ApiRequestInit = {}
): Promise<Response> {
  const { skipAuth, ...fetchInit } = init;
  const { headers, rest } = mergeHeaders(fetchInit);

  if (!skipAuth) {
    await ensureFreshAccessToken();
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const url = buildUrl(path);
  let res = await fetch(url, {
    ...rest,
    headers,
  });

  if (res.status === 401 && !skipAuth && getAccessToken()) {
    try {
      await refreshSession();
      const token = getAccessToken();
      const h2 = new Headers(headers);
      if (token) h2.set("Authorization", `Bearer ${token}`);
      res = await fetch(url, { ...rest, headers: h2 });
    } catch {
      clearAuthSession();
    }
  }

  return res;
}

export async function apiJson<T>(
  path: string,
  init: ApiRequestInit = {}
): Promise<T> {
  const res = await apiFetch(path, init);
  const text = await res.text();
  if (!res.ok) {
    throw new ApiHttpError(
      text || res.statusText || "Solicitud fallida",
      res.status,
      text
    );
  }
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiHttpError("Respuesta no es JSON válido", res.status, text);
  }
}
