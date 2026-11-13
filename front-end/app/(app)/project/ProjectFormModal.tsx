"use client";

import { useId, useState } from "react";
import { Modal } from "../../components/Modal";
import { ContributorSelect, type Contributor } from "./ContributorSelect";
import "./project-form.css";

export type ProjectFormValues = {
  name: string;
  description: string;
  contributors: Contributor[];
};

type Props = {
  title: string;
  submitLabel: string;
  savingLabel: string;
  /** Affiche « * » sur les champs obligatoires */
  markRequired?: boolean;
  /** Le bouton n'est actif que si au moins un champ a changé (modification) */
  requireChange?: boolean;
  initialValues: ProjectFormValues;
  /** Utilisateurs à ne pas proposer comme contributeurs (propriétaire…) */
  excludeIds?: string[];
  /** Renvoie un message d'erreur, ou null si tout s'est bien passé */
  onSubmit: (values: ProjectFormValues) => Promise<string | null>;
  onClose: () => void;
};

const sameIds = (a: Contributor[], b: Contributor[]) =>
  a.map((u) => u.id).sort().join() === b.map((u) => u.id).sort().join();

export function ProjectFormModal({
  title,
  submitLabel,
  savingLabel,
  markRequired = false,
  requireChange = false,
  initialValues,
  excludeIds,
  onSubmit,
  onClose,
}: Props) {
  const uid = useId();
  const star = markRequired ? "*" : "";

  const [values, setValues] = useState<ProjectFormValues>(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const isValid = values.name.trim() !== "" && values.description.trim() !== "";
  const isDirty =
    values.name !== initialValues.name ||
    values.description !== initialValues.description ||
    !sameIds(values.contributors, initialValues.contributors);
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
      <form className="pf-form" onSubmit={handleSubmit}>
        <div className="pf-field">
          <label htmlFor={`${uid}-name`}>Titre{star}</label>
          <input
            id={`${uid}-name`}
            type="text"
            required
            autoFocus
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        <div className="pf-field">
          <label htmlFor={`${uid}-description`}>Description{star}</label>
          <input
            id={`${uid}-description`}
            type="text"
            required
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className="pf-field pf-field-last">
          <label htmlFor={`${uid}-contributors`}>Contributeurs</label>
          <ContributorSelect
            id={`${uid}-contributors`}
            value={values.contributors}
            onChange={(list) => set("contributors", list)}
            excludeIds={excludeIds}
          />
        </div>

        {error && (
          <p className="pf-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="pf-submit" disabled={!canSubmit}>
          {saving ? savingLabel : submitLabel}
        </button>
      </form>
    </Modal>
  );
}
