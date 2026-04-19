/** Evita redirecciones abiertas: solo rutas relativas internas. */
export function safePostLoginPath(from: string | null): string {
  if (from && from.startsWith("/") && !from.startsWith("//")) return from;
  return "/";
}
