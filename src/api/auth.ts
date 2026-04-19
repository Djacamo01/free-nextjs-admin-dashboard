import { getApiBaseUrl, getPublicAuthHeaders } from "./env";
import {
  accessTokenExpiresWithin,
  getAccessTokenExpiryMs,
} from "./jwt";
import type {
  AuthResponse,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
} from "./types";
import {
  clearAuthRouteCookie,
  setAuthRouteCookieFromToken,
} from "@/lib/auth-route-cookie";
import {
  clearAllTokenStorages,
  getAccessToken,
  getRefreshToken,
  isPersistentAuth,
  setStoredTokens,
} from "./token-storage";

const REFRESH_BEFORE_EXPIRY_MS = 60_000;
const PROACTIVE_MIN_DELAY_MS = 2_000;

let refreshMutex: Promise<AuthResponse> | null = null;
let refreshTimerId: ReturnType<typeof setTimeout> | null = null;

export class AuthHttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public bodyText?: string
  ) {
    super(message);
    this.name = "AuthHttpError";
  }
}

async function parseJsonBody<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    if (!res.ok) {
      throw new AuthHttpError(res.statusText || "Error HTTP", res.status);
    }
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AuthHttpError(
      "Respuesta no válida (no es JSON)",
      res.status,
      text
    );
  }
}

function clearRefreshTimer() {
  if (refreshTimerId != null) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }
}

function scheduleProactiveRefresh() {
  clearRefreshTimer();
  if (typeof window === "undefined") return;

  const access = getAccessToken();
  if (!access) return;

  const expMs = getAccessTokenExpiryMs(access);
  if (expMs == null) return;

  const triggerAt = expMs - REFRESH_BEFORE_EXPIRY_MS;
  let delay = triggerAt - Date.now();
  if (delay < PROACTIVE_MIN_DELAY_MS) {
    delay = PROACTIVE_MIN_DELAY_MS;
  }

  refreshTimerId = setTimeout(() => {
    refreshTimerId = null;
    void refreshSession().catch(() => {
      clearAuthSession();
    });
  }, delay);
}

function applyAuthResponse(data: AuthResponse, persistent: boolean) {
  setStoredTokens(data.token, data.refreshToken, persistent);
  if (data.token) setAuthRouteCookieFromToken(data.token);
  scheduleProactiveRefresh();
}

/**
 * Arranca el temporizador de refresh si ya hay tokens guardados (p. ej. tras recargar la página).
 */
export function bootstrapAuth() {
  if (typeof window === "undefined") return;
  if (!getAccessToken()) return;
  void ensureFreshAccessToken()
    .then(() => scheduleProactiveRefresh())
    .catch(() => clearAuthSession());
}

export function clearAuthSession() {
  clearRefreshTimer();
  clearAllTokenStorages();
  clearAuthRouteCookie();
}

export async function login(
  body: LoginRequest,
  persistSession: boolean
): Promise<AuthResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/Auth/login`, {
    method: "POST",
    headers: getPublicAuthHeaders(),
    body: JSON.stringify(body),
  });

  const data = await parseJsonBody<AuthResponse>(res);
  if (!res.ok) {
    const msg =
      typeof data.message === "string" && data.message
        ? data.message
        : res.statusText || "Login fallido";
    throw new AuthHttpError(msg, res.status, JSON.stringify(data));
  }

  applyAuthResponse(data, persistSession);
  return data;
}

/**
 * Registro. Misma cabecera `x-api-key` que login (`NEXT_PUBLIC_APP_KEY`).
 * Si la API devuelve tokens, se guardan la sesión como en login.
 */
export async function register(
  body: RegisterRequest,
  persistSession: boolean
): Promise<AuthResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/Auth/register`, {
    method: "POST",
    headers: getPublicAuthHeaders(),
    body: JSON.stringify(body),
  });

  const data = await parseJsonBody<AuthResponse>(res);
  if (!res.ok) {
    const msg =
      typeof data.message === "string" && data.message
        ? data.message
        : res.statusText || "Registro fallido";
    throw new AuthHttpError(msg, res.status, JSON.stringify(data));
  }

  if (data.token && data.refreshToken) {
    applyAuthResponse(data, persistSession);
  }
  return data;
}

async function postRefresh(refreshToken: string): Promise<AuthResponse> {
  const payload: RefreshRequest = { refreshToken };
  const res = await fetch(`${getApiBaseUrl()}/api/Auth/refresh`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonBody<AuthResponse>(res);
  if (!res.ok) {
    const msg =
      typeof data.message === "string" && data.message
        ? data.message
        : res.statusText || "Refresh fallido";
    throw new AuthHttpError(msg, res.status, JSON.stringify(data));
  }
  return data;
}

/**
 * Obtiene nuevos tokens usando el refresh guardado. Serializa llamadas concurrentes.
 */
export async function refreshSession(): Promise<AuthResponse> {
  if (refreshMutex) return refreshMutex;

  const rt = getRefreshToken();
  if (!rt) {
    throw new AuthHttpError("No hay sesión", 401);
  }

  const persistent = isPersistentAuth();

  refreshMutex = postRefresh(rt)
    .then((data) => {
      applyAuthResponse(data, persistent);
      return data;
    })
    .finally(() => {
      refreshMutex = null;
    });

  return refreshMutex;
}

/**
 * Si el access token está por expirar, hace refresh antes de seguir.
 */
export async function ensureFreshAccessToken(): Promise<void> {
  const access = getAccessToken();
  if (!access) return;

  if (
    accessTokenExpiresWithin(access, REFRESH_BEFORE_EXPIRY_MS) &&
    getRefreshToken()
  ) {
    await refreshSession();
  }
}
