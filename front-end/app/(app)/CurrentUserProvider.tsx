"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useApi } from "../hooks/use-api";

export type CurrentUser = { id: string; email: string; name: string };

type CurrentUserContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  error: string;
  /** Met à jour l'utilisateur affiché partout (header, tableau de bord…) sans recharger. */
  updateUser: (patch: Partial<CurrentUser>) => void;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

/**
 * Charge l'utilisateur connecté UNE seule fois (GET /api/profile)
 * et le partage avec toutes les pages du groupe (app).
 */
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { data, loading, error } = useApi<{ user: CurrentUser }>("/api/profile");
  const [patch, setPatch] = useState<Partial<CurrentUser>>({});

  const value = useMemo<CurrentUserContextValue>(
    () => ({
      user: data?.user ? { ...data.user, ...patch } : null,
      loading,
      error,
      updateUser: (next) => setPatch((prev) => ({ ...prev, ...next })),
    }),
    [data, patch, loading, error]
  );

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error("useCurrentUser doit être utilisé dans <CurrentUserProvider>.");
  }
  return context;
}
