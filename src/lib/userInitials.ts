export function getUserInitials(name: string, email?: string): string {
  const n = name.trim();
  if (n) {
    const parts = n.split(/\s+/).filter((p) => p.length > 0);
    if (parts.length >= 2) {
      const a = parts[0][0] ?? "";
      const b = parts[parts.length - 1][0] ?? "";
      const pair = (a + b).toUpperCase();
      if (pair) return pair;
    }
    if (n.length >= 2) return n.slice(0, 2).toUpperCase();
    if (n.length === 1) return (n[0] + n[0]).toUpperCase();
  }
  const local = email?.split("@")[0]?.trim() ?? "";
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  if (local.length === 1) return (local[0] + local[0]).toUpperCase();
  return "?";
}
