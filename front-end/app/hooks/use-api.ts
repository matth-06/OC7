"use client";

import { useEffect, useState } from "react";

type ApiResponse<T> = { data?: T; message?: string };

/**
 * Récupère `data` depuis une route de l'API back-end.
 * Format attendu : { data: ... } en succès, { message: "..." } en erreur.
 */
export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    async function load() {
      try {
        const response = await fetch(url, { cache: "no-store", signal: controller.signal });
        const result = (await response.json().catch(() => ({}))) as ApiResponse<T>;

        if (!response.ok) {
          throw new Error(result.message ?? "Impossible de charger les données.");
        }
        if (result.data === undefined) {
          throw new Error("La réponse du serveur est invalide.");
        }
        setData(result.data);
      } catch (e) {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : "Impossible de charger les données.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}
