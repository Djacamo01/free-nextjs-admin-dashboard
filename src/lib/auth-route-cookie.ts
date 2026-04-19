import { getAccessTokenExpiryMs } from "@/api/jwt";
import { AUTH_ROUTE_COOKIE } from "@/constants/authCookie";

export function setAuthRouteCookieFromToken(accessToken: string): void {
  if (typeof window === "undefined") return;
  const expMs = getAccessTokenExpiryMs(accessToken);
  const maxAgeSec = expMs
    ? Math.max(120, Math.floor((expMs - Date.now()) / 1000))
    : 86_400;
  const secure = window.location.protocol === "https:";
  document.cookie = `${AUTH_ROUTE_COOKIE}=1; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export function clearAuthRouteCookie(): void {
  if (typeof window === "undefined") return;
  document.cookie = `${AUTH_ROUTE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
