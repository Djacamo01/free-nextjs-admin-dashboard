export type JwtPayload = {
  exp?: number;
  iat?: number;
  [key: string]: unknown;
};

/**
 * Decodifica el payload del JWT (sin verificar firma; eso lo hace el backend).
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const segment = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = segment.padEnd(
      segment.length + ((4 - (segment.length % 4)) % 4),
      "="
    );
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** `exp` en JWT es segundos desde epoch UTC */
export function getAccessTokenExpiryMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (payload?.exp == null || typeof payload.exp !== "number") return null;
  return payload.exp * 1000;
}

export function isAccessTokenExpired(
  token: string,
  skewMs = 0
): boolean | null {
  const expMs = getAccessTokenExpiryMs(token);
  if (expMs == null) return null;
  return Date.now() + skewMs >= expMs;
}

/** True si el token expira dentro de `withinMs` milisegundos */
export function accessTokenExpiresWithin(
  token: string,
  withinMs: number
): boolean {
  const expMs = getAccessTokenExpiryMs(token);
  if (expMs == null) return true;
  return expMs - Date.now() <= withinMs;
}
