"use client";

import { bootstrapAuth } from "@/api";
import { getAccessToken } from "@/api/token-storage";
import { setAuthRouteCookieFromToken } from "@/lib/auth-route-cookie";
import { useEffect } from "react";

/** Restaura temporizador de refresh tras recargar si hay tokens guardados */
export default function AuthSessionBootstrap() {
  useEffect(() => {
    bootstrapAuth();
    const access = getAccessToken();
    if (access) setAuthRouteCookieFromToken(access);
  }, []);
  return null;
}
