/**
 * Obtiene el slug del tenant desde el hostname del navegador.
 *
 * Configura `NEXT_PUBLIC_TENANT_ROOT_DOMAIN=ordely.co` para que
 * `elprogreso.ordely.co` → `elprogreso`. Sin esa variable no se infiere slug
 * (útil en localhost salvo que uses `*.localhost` con la misma lógica).
 */
export function getTenantSlugFromBrowserHostname(hostname: string): string | undefined {
  const root = process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN?.trim().toLowerCase();
  const h = hostname.trim().toLowerCase();
  if (!root) return undefined;
  if (h === root || h === `www.${root}`) return undefined;
  const suffix = `.${root}`;
  if (!h.endsWith(suffix)) return undefined;
  const sub = h.slice(0, -suffix.length);
  if (!sub || sub.includes(".")) return undefined;
  return sub;
}
