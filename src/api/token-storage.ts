const ACCESS_KEY = "ordely_auth_access_token";
const REFRESH_KEY = "ordely_auth_refresh_token";

function clearKey(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearAllTokenStorages() {
  if (typeof window === "undefined") return;
  clearKey(localStorage, ACCESS_KEY);
  clearKey(localStorage, REFRESH_KEY);
  clearKey(sessionStorage, ACCESS_KEY);
  clearKey(sessionStorage, REFRESH_KEY);
}

/** true si la sesión actual está en localStorage (recordarme) */
export function isPersistentAuth(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(ACCESS_KEY);
}

function storageForWrite(persistent: boolean): Storage {
  return persistent ? localStorage : sessionStorage;
}

export function setStoredTokens(
  accessToken: string,
  refreshToken: string,
  persistent: boolean
) {
  if (typeof window === "undefined") return;
  clearAllTokenStorages();
  const s = storageForWrite(persistent);
  s.setItem(ACCESS_KEY, accessToken);
  s.setItem(REFRESH_KEY, refreshToken);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(ACCESS_KEY) ?? sessionStorage.getItem(ACCESS_KEY)
  );
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY)
  );
}
