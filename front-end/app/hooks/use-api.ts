"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ApiResponse<T> = { data?: T; message?: string };

/**
 * Récupère `data` depuis une route de l'API back-end.
 * Format attendu : { data: ... } en succès, { message: "..." } en erreur.
 *
 * `reload()` relance la requête sans repasser `loading` à true :
 * la page reste affichée pendant que les données se rafraîchissent.
 */
export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const loadedUrl = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    // L'écran de chargement n'apparaît que pour une nouvelle URL, pas pour un reload()
    if (loadedUrl.current !== url) setLoading(true);
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
        loadedUrl.current = url;
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
  }, [url, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { data, loading, error, reload };
}