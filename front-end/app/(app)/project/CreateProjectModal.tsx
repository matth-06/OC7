"use client";

import { useCurrentUser } from "../CurrentUserProvider";
import { ProjectFormModal, type ProjectFormValues } from "./ProjectFormModal";

type Props = {
  onClose: () => void;
  /** Appelé après une création réussie (recharger la liste, rediriger…) */
  onCreated: () => void;
};

const EMPTY: ProjectFormValues = { name: "", description: "", contributors: [] };

export function CreateProjectModal({ onClose, onCreated }: Props) {
  const { user } = useCurrentUser();

  async function handleSubmit(values: ProjectFormValues) {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          description: values.description.trim(),
          contributors: values.contributors.map((c) => c.email),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        return result.message ?? "La création du projet a échoué. Veuillez réessayer.";
      }
      onCreated();
      return null;
    } catch {
      return "Impossible de contacter le serveur.";
    }
  }

  return (
    <ProjectFormModal
      title="Créer un projet"
      submitLabel="Ajouter un projet"
      savingLabel="Ajout en cours..."
      markRequired
      initialValues={EMPTY}
      excludeIds={user ? [user.id] : []}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  );
}
