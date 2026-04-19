function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Origen del front (Next.js), p. ej. `http://localhost:3000` — enlaces absolutos y redirects. */
export function getAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) {
    throw new Error(
      "Falta NEXT_PUBLIC_APP_URL en .env (ej. http://localhost:3000)"
    );
  }
  return normalizeBaseUrl(raw);
}

/** Base de la API Ordely (no confundir con `getAppBaseUrl`). */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    throw new Error(
      "Falta NEXT_PUBLIC_API_URL en .env (ej. https://localhost:7000)"
    );
  }
  return normalizeBaseUrl(raw);
}

/** Clave pública de app (NEXT_PUBLIC_APP_KEY), si está definida. */
export function getAppApiKey(): string | undefined {
  const v = process.env.NEXT_PUBLIC_APP_KEY?.trim();
  return v ? v : undefined;
}

/**
 * Headers para login y registro: JSON + `x-api-key` cuando existe la variable de entorno.
 */
export function getPublicAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
  };
  const key = getAppApiKey();
  if (key) {
    headers["x-api-key"] = key;
  }
  return headers;
}

/**
 * URL del webhook de chat (n8n). Acepta la URL completa (`.../webhook/chat`) o solo el origen (`http://host:5678`).
 */
export function getChatWebhookChatUrl(): string {
  const raw = process.env.NEXT_PUBLIC_CHAT_WEBHOOK_URL?.trim();
  if (!raw) {
    throw new Error(
      "Falta NEXT_PUBLIC_CHAT_WEBHOOK_URL en .env (ej. http://192.168.1.37:5678 o .../webhook/chat)"
    );
  }
  const base = normalizeBaseUrl(raw);
  if (/\/webhook\/chat$/i.test(base)) return base;
  return `${base}/webhook/chat`;
}

const DEFAULT_CHAT_WEBHOOK_TIMEOUT_MS = 900_000; // 15 min — flujos n8n lentos

/**
 * Tiempo máximo de espera del `fetch` al webhook de chat (ms).
 * `NEXT_PUBLIC_CHAT_WEBHOOK_TIMEOUT_MS`: número; `0` = sin límite (sin AbortSignal).
 */
export function getChatWebhookFetchTimeoutMs(): number {
  const raw = process.env.NEXT_PUBLIC_CHAT_WEBHOOK_TIMEOUT_MS?.trim();
  if (!raw) return DEFAULT_CHAT_WEBHOOK_TIMEOUT_MS;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_CHAT_WEBHOOK_TIMEOUT_MS;
  return n;
}
