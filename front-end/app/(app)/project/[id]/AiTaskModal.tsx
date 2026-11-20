"use client";

import { useRef, useState } from "react";
import { Pencil, Sparkles, Trash2 } from "lucide-react";
import { Modal } from "../../../components/Modal";
import "./ai-task-modal.css";

type Props = {
  projectId: string;
  onClose: () => void;
  /** Appelé après l'ajout d'au moins une tâche (recharger la liste) */
  onCreated: () => void;
};

type Suggestion = { id: string; title: string; description: string };

/** Les tâches créées par l'IA n'ont pas d'échéance : on prend J+7 par défaut. */
function defaultDueDate() {
  const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return `${date.toISOString().slice(0, 10)}T00:00:00.000Z`;
}

export function AiTaskModal({ projectId, onClose, onCreated }: Props) {
  const [prompt, setPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", description: "" });
  const nextId = useRef(0);

  const hasSuggestions = suggestions.length > 0;
  const busy = generating || adding;

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = prompt.trim();
    if (!text || busy) return;

    setError("");
    setEditingId(null);
    setGenerating(true);

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/ai-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        data?: { tasks?: { title: string; description: string }[] };
        message?: string;
      };

      if (!response.ok || !result.data?.tasks?.length) {
        setError(result.message ?? "L'IA n'a pas pu générer de tâches. Veuillez réessayer.");
        return;
      }

      setSuggestions(
        result.data.tasks.map((t) => ({
          id: `suggestion-${nextId.current++}`,
          title: t.title,
          description: t.description,
        }))
      );
      setPrompt("");
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setGenerating(false);
    }
  }

  function startEditing(suggestion: Suggestion) {
    setEditingId(suggestion.id);
    setDraft({ title: suggestion.title, description: suggestion.description });
  }

  function saveEditing() {
    if (!draft.title.trim()) return;
    setSuggestions((list) =>
      list.map((s) =>
        s.id === editingId
          ? { ...s, title: draft.title.trim(), description: draft.description.trim() }
          : s
      )
    );
    setEditingId(null);
  }

  async function handleAdd() {
    if (busy || !hasSuggestions) return;

    setError("");
    setEditingId(null);
    setAdding(true);

    const dueDate = defaultDueDate();
    const remaining = [...suggestions];
    let createdAny = false;
    let allDone = false;

    try {
      // Une par une : on s'arrête à la première erreur, les autres restent proposées
      for (const suggestion of suggestions) {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: suggestion.title,
            description: suggestion.description,
            dueDate,
            status: "TODO",
            assigneeIds: [],
          }),
        });

        if (!response.ok) {
          const result = (await response.json().catch(() => ({}))) as { message?: string };
          setError(result.message ?? "L'ajout d'une tâche a échoué. Veuillez réessayer.");
          return;
        }

        createdAny = true;
        remaining.shift();
        setSuggestions([...remaining]);
      }
      allDone = true;
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      if (createdAny) onCreated();
      setAdding(false);
      if (allDone) onClose();
    }
  }

  const title = (
    <span className="ai-title">
      <Sparkles size={20} aria-hidden />
      {hasSuggestions ? "Vos tâches..." : "Créer une tâche"}
    </span>
  );

  return (
    <Modal title={title} onClose={onClose}>
      <div className="ai-body">
        <div className="ai-content" aria-live="polite">
          {generating && (
            <p className="ai-status" role="status">
              <Sparkles size={16} aria-hidden className="ai-spin" />
              L’IA prépare 3 propositions...
            </p>
          )}

          {!generating &&
            suggestions.map((suggestion) =>
              editingId === suggestion.id ? (
                <article key={suggestion.id} className="ai-card ai-card-editing">
                  <label className="ai-edit-label" htmlFor={`${suggestion.id}-title`}>
                    Nom de la tâche
                  </label>
                  <input
                    id={`${suggestion.id}-title`}
                    type="text"
                    className="ai-edit-input"
                    value={draft.title}
                    autoFocus
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  />
                  <label className="ai-edit-label" htmlFor={`${suggestion.id}-description`}>
                    Description
                  </label>
                  <input
                    id={`${suggestion.id}-description`}
                    type="text"
                    className="ai-edit-input"
                    value={draft.description}
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  />
                  <div className="ai-card-actions">
                    <button
                      type="button"
                      className="ai-action"
                      onClick={saveEditing}
                      disabled={!draft.title.trim()}
                    >
                      Valider
                    </button>
                    <span className="ai-divider" aria-hidden />
                    <button type="button" className="ai-action" onClick={() => setEditingId(null)}>
                      Annuler
                    </button>
                  </div>
                </article>
              ) : (
                <article key={suggestion.id} className="ai-card">
                  <h3 className="ai-card-title">{suggestion.title}</h3>
                  <p className="ai-card-description">{suggestion.description}</p>
                  <div className="ai-card-actions">
                    <button
                      type="button"
                      className="ai-action"
                      onClick={() =>
                        setSuggestions((list) => list.filter((s) => s.id !== suggestion.id))
                      }
                      disabled={adding}
                    >
                      <Trash2 size={13} aria-hidden />
                      Supprimer
                    </button>
                    <span className="ai-divider" aria-hidden />
                    <button
                      type="button"
                      className="ai-action"
                      onClick={() => startEditing(suggestion)}
                      disabled={adding}
                    >
                      <Pencil size={13} aria-hidden />
                      Modifier
                    </button>
                  </div>
                </article>
              )
            )}

          {error && (
            <p className="ai-error" role="alert">
              {error}
            </p>
          )}

          {!generating && hasSuggestions && (
            <button type="button" className="ai-add" onClick={handleAdd} disabled={adding}>
              {adding
                ? "Ajout en cours..."
                : suggestions.length === 1
                  ? "+ Ajouter la tâche"
                  : "+ Ajouter les tâches"}
            </button>
          )}
        </div>

        <form
          className={`ai-prompt ${hasSuggestions ? "ai-prompt-separated" : ""}`}
          onSubmit={handleGenerate}
        >
          <input
            type="text"
            value={prompt}
            maxLength={1000}
            placeholder="Décrivez les tâches que vous souhaitez ajouter..."
            aria-label="Décrivez les tâches que vous souhaitez ajouter"
            disabled={busy}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            type="submit"
            className="ai-send"
            aria-label="Générer des propositions de tâches"
            disabled={busy || !prompt.trim()}
          >
            <Sparkles size={14} aria-hidden />
          </button>
        </form>
      </div>
    </Modal>
  );
}
