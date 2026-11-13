"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Modal } from "../../../components/Modal";
import { initials, type TeamMember } from "../utils";
import "./create-task-modal.css";

type Props = {
  projectId: string;
  /** Personnes du projet pouvant être assignées (propriétaire + membres) */
  members: TeamMember[];
  onClose: () => void;
  /** Appelé après une création réussie (ex. recharger la liste des tâches) */
  onCreated: () => void;
};

const STATUS_OPTIONS = [
  { value: "TODO", label: "À faire", className: "ct-status-todo" },
  { value: "IN_PROGRESS", label: "En cours", className: "ct-status-in-progress" },
  { value: "DONE", label: "Terminée", className: "ct-status-done" },
] as const;

/* ---------- Sélecteur multiple de collaborateurs ---------- */
function AssigneeSelect({
  id,
  members,
  value,
  onChange,
}: {
  id: string;
  members: TeamMember[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const selected = members.filter((m) => value.includes(m.user.id));

  function toggle(userId: string) {
    onChange(value.includes(userId) ? value.filter((v) => v !== userId) : [...value, userId]);
  }

  return (
    <div className="ct-select" ref={ref}>
      <button
        id={id}
        type="button"
        className="ct-select-trigger"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={selected.length === 0 ? "ct-placeholder" : "ct-selected-text"}>
          {selected.length === 0
            ? "Choisir un ou plusieurs collaborateurs"
            : selected.map((m) => m.user.name).join(", ")}
        </span>
        <ChevronDown size={18} aria-hidden />
      </button>

      {open && (
        <div id={listId} className="ct-options" role="group" aria-label="Collaborateurs">
          {members.map((m) => (
            <label key={m.user.id} className="ct-option">
              <input
                type="checkbox"
                checked={value.includes(m.user.id)}
                onChange={() => toggle(m.user.id)}
              />
              <span className="ct-option-avatar" aria-hidden>
                {initials(m.user)}
              </span>
              <span>{m.user.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Modale ---------- */
export function CreateTaskModal({ projectId, members, onClose, onCreated }: Props) {
  const uid = useId();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("TODO");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isValid = title.trim() !== "" && description.trim() !== "" && dueDate !== "";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || saving) return;

    setError("");
    setSaving(true);

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          dueDate: `${dueDate}T00:00:00.000Z`,
          status,
          assigneeIds,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setError(result.message ?? "La création de la tâche a échoué. Veuillez réessayer.");
        return;
      }

      onCreated();
      onClose();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Créer une tâche" onClose={onClose}>
      <form className="ct-form" onSubmit={handleSubmit}>
        <div className="ct-field">
          <label htmlFor={`${uid}-title`}>Titre*</label>
          <input
            id={`${uid}-title`}
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="ct-field">
          <label htmlFor={`${uid}-description`}>Description*</label>
          <input
            id={`${uid}-description`}
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="ct-field">
          <label htmlFor={`${uid}-date`}>Échéance*</label>
          <div className="ct-date">
            <input
              id={`${uid}-date`}
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <CalendarDays size={16} aria-hidden />
          </div>
        </div>

        <div className="ct-field">
          <label htmlFor={`${uid}-assignees`}>Assigné à :</label>
          <AssigneeSelect
            id={`${uid}-assignees`}
            members={members}
            value={assigneeIds}
            onChange={setAssigneeIds}
          />
        </div>

        <fieldset className="ct-field ct-status-group">
          <legend>Statut :</legend>
          <div className="ct-status-list">
            {STATUS_OPTIONS.map((option) => (
              <label key={option.value} className="ct-status-option">
                <input
                  type="radio"
                  name={`${uid}-status`}
                  value={option.value}
                  checked={status === option.value}
                  onChange={() => setStatus(option.value)}
                />
                <span className={`ct-status ${option.className}`}>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && (
          <p className="ct-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="ct-submit" disabled={!isValid || saving}>
          {saving ? "Ajout en cours..." : "+ Ajouter une tâche"}
        </button>
      </form>
    </Modal>
  );
}
