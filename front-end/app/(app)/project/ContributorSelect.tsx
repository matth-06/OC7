"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { initials } from "./utils";

export type Contributor = { id: string; email: string; name: string };

type Props = {
  id: string;
  value: Contributor[];
  onChange: (contributors: Contributor[]) => void;
  /** Utilisateurs à ne pas proposer (ex. le propriétaire du projet) */
  excludeIds?: string[];
};

const MIN_QUERY_LENGTH = 2;

/**
 * Sélecteur multiple de collaborateurs avec recherche.
 * ⚠️ Appelle GET /api/users/search?query=… (réponse attendue : { data: { users: [...] } }).
 */
export function ContributorSelect({ id, value, onChange, excludeIds = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Contributor[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const panelId = useId();

  // Fermeture au clic extérieur
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Recherche (avec délai pour ne pas appeler l'API à chaque frappe)
  useEffect(() => {
    const query = term.trim();
    if (query.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setSearching(false);
      setSearchError("");
      return;
    }

    const controller = new AbortController();
    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const result = (await response.json().catch(() => ({}))) as {
          data?: { users?: Contributor[] } | Contributor[];
          message?: string;
        };

        if (!response.ok) throw new Error(result.message ?? "La recherche a échoué.");

        const users = Array.isArray(result.data) ? result.data : result.data?.users;
        setResults(Array.isArray(users) ? users : []);
        setSearchError("");
      } catch (e) {
        if (!controller.signal.aborted) {
          setSearchError(e instanceof Error ? e.message : "La recherche a échoué.");
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  const selectedIds = useMemo(() => new Set(value.map((u) => u.id)), [value]);
  const visibleResults = results.filter(
    (u) => !selectedIds.has(u.id) && !excludeIds.includes(u.id)
  );

  function toggle(user: Contributor) {
    onChange(
      selectedIds.has(user.id) ? value.filter((u) => u.id !== user.id) : [...value, user]
    );
  }

  let summary = "Choisir un ou plusieurs collaborateurs";
  if (value.length === 1) summary = value[0].name;
  if (value.length > 1) summary = `${value.length} collaborateurs`;

  let hint = "";
  if (term.trim().length < MIN_QUERY_LENGTH) {
    hint = "Saisissez au moins 2 caractères pour rechercher un collaborateur.";
  } else if (searching) {
    hint = "Recherche en cours...";
  } else if (searchError) {
    hint = searchError;
  } else if (visibleResults.length === 0) {
    hint = "Aucun résultat.";
  }

  const renderOption = (user: Contributor, checked: boolean) => (
    <label key={user.id} className="pf-option">
      <input type="checkbox" checked={checked} onChange={() => toggle(user)} />
      <span className="pf-option-avatar" aria-hidden>
        {initials(user)}
      </span>
      <span className="pf-option-text">
        <span>{user.name}</span>
        {user.email && <span className="pf-option-email">{user.email}</span>}
      </span>
    </label>
  );

  return (
    <div className="pf-select" ref={ref}>
      <button
        id={id}
        type="button"
        className="pf-select-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={value.length === 0 ? "pf-placeholder" : "pf-selected-text"}>
          {summary}
        </span>
        <ChevronDown size={18} aria-hidden />
      </button>

      {open && (
        <div id={panelId} className="pf-panel">
          <input
            type="search"
            className="pf-search"
            placeholder="Rechercher par nom ou e-mail"
            aria-label="Rechercher un collaborateur"
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              // Entrée ne doit pas envoyer le formulaire
              if (e.key === "Enter") e.preventDefault();
            }}
          />

          <div role="group" aria-label="Collaborateurs" className="pf-options">
            {value.map((u) => renderOption(u, true))}
            {visibleResults.map((u) => renderOption(u, false))}
          </div>

          {hint && (
            <p className="pf-hint" role="status">
              {hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
