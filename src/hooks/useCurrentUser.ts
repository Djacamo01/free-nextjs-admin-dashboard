"use client";

import { fetchCurrentUser, type CurrentUser } from "@/api/user";
import { getAccessToken } from "@/api/token-storage";
import { useEffect, useState } from "react";

type State = {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
};

export function useCurrentUser() {
  const [state, setState] = useState<State>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    if (!getAccessToken()) {
      setState({ user: null, loading: false, error: null });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    fetchCurrentUser()
      .then((user) => {
        if (!cancelled) setState({ user, loading: false, error: null });
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            user: null,
            loading: false,
            error: "No se pudo cargar el perfil",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
