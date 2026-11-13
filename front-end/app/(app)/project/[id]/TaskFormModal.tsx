"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Modal } from "../../../components/Modal";
import { initials, type TeamMember } from "../utils";
import "./task-form.css";

export type TaskFormValues = {
  title: string;
  description: string;
  dueDate: string; // AAAA-MM-JJ
  assigneeIds: string[];
  status: string;
};

/** Corps envoyé à l'API (la date est envoyée à minuit UTC). */
export function toTaskPayload(values: TaskFormValues) {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    dueDate: `${values.dueDate}T00:00:00.000Z`,
    status: values.status,
    assigneeIds: values.assigneeIds,
  };
}

type Props = {
  title: string;
  submitLabel: string;
  savingLabel: string;
  /** Affiche « * » sur les champs obligatoires (maquette de création) */
  markRequired?: boolean;
  /** Le bouton n'est actif que si au moins un champ a changé (modification) */
  requireChange?: boolean;
  initialValues: TaskFormValues;
  /** Personnes du projet pouvant être assignées (propriétaire + membres) */
  members: TeamMember[];
  /** Renvoie un message d'erreur, ou null si tout s'est bien passé */
  onSubmit: (values: TaskFormValues) => Promise<string | null>;
  onClose: () => void;
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

  let summary = "Choisir un ou plusieurs collaborateurs";
  if (selected.length === 1) summary = selected[0].user.name;
  if (selected.length > 1) summary = `${selected.length} collaborateurs`;

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
          {summary}
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

const sameIds = (a: string[], b: string[]) => [...a].sort().join() === [...b].sort().join();

/* ---------- Modale ---------- */
export function TaskFormModal({
  title,
  submitLabel,
  savingLabel,
  markRequired = false,
  requireChange = false,
  initialValues,
  members,
  onSubmit,
  onClose,
}: Props) {
  const uid = useId();
  const star = markRequired ? "*" : "";

  const [values, setValues] = useState<TaskFormValues>(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const isValid =
    values.title.trim() !== "" && values.description.trim() !== "" && values.dueDate !== "";

  const isDirty =
    values.title !== initialValues.title ||
    values.description !== initialValues.description ||
    values.dueDate !== initialValues.dueDate ||
    values.status !== initialValues.status ||
    !sameIds(values.assigneeIds, initialValues.assigneeIds);

  const canSubmit = isValid && (!requireChange || isDirty) && !saving;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setError("");
    setSaving(true);
    try {
      const message = await onSubmit(values);
      if (message) {
        setError(message);
      } else {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form className="ct-form" onSubmit={handleSubmit}>
        <div className="ct-field">
          <label htmlFor={`${uid}-title`}>Titre{star}</label>
          <input
            id={`${uid}-title`}
            type="text"
            required
            autoFocus
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </div>

        <div className="ct-field">
          <label htmlFor={`${uid}-description`}>Description{star}</label>
          <input
            id={`${uid}-description`}
            type="text"
            required
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className="ct-field">
          <label htmlFor={`${uid}-date`}>Échéance{star}</label>
          <div className="ct-date">
            <input
              id={`${uid}-date`}
              type="date"
              required
              value={values.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
            />
            <CalendarDays size={16} aria-hidden />
          </div>
        </div>

        <div className="ct-field">
          <label htmlFor={`${uid}-assignees`}>Assigné à :</label>
          <AssigneeSelect
            id={`${uid}-assignees`}
            members={members}
            value={values.assigneeIds}
            onChange={(ids) => set("assigneeIds", ids)}
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
                  checked={values.status === option.value}
                  onChange={() => set("status", option.value)}
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

        <button type="submit" className="ct-submit" disabled={!canSubmit}>
          {saving ? savingLabel : submitLabel}
        </button>
      </form>
    </Modal>
  );
}
