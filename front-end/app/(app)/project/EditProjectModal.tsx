"use client";

import type { Contributor } from "./ContributorSelect";
import { ProjectFormModal, type ProjectFormValues } from "./ProjectFormModal";

type EditableProject = {
  id: string;
  name: string;
  description: string | null;
  owner: { id: string };
  /** Contributeurs actuels (hors propriétaire) */
  members: { user: { id: string; email?: string; name: string } }[];
};

type Props = {
  project: EditableProject;
  onClose: () => void;
  /** Appelé après la modification (même partielle) pour recharger les données */
  onSaved: () => void;
};

async function send(url: string, method: "PUT" | "POST" | "DELETE", body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (response.ok) return null;
  const result = (await response.json().catch(() => ({}))) as { message?: string };
  return result.message ?? "La modification a échoué. Veuillez réessayer.";
}

export function EditProjectModal({ project, onClose, onSaved }: Props) {
  const initialContributors: Contributor[] = project.members.map((m) => ({
    id: m.user.id,
    email: m.user.email ?? "",
    name: m.user.name,
  }));

  const initialValues: ProjectFormValues = {
    name: project.name,
    description: project.description ?? "",
    contributors: initialContributors,
  };

  async function handleSubmit(values: ProjectFormValues) {
    const base = `/api/projects/${encodeURIComponent(project.id)}`;
    const initialIds = new Set(initialContributors.map((c) => c.id));
    const nextIds = new Set(values.contributors.map((c) => c.id));

    const added = values.contributors.filter((c) => !initialIds.has(c.id));
    const removed = initialContributors.filter((c) => !nextIds.has(c.id));
    const infoChanged =
      values.name !== initialValues.name || values.description !== initialValues.description;

    try {
      // Les appels sont faits l'un après l'autre : on s'arrête à la première erreur
      if (infoChanged) {
        const error = await send(base, "PUT", {
          name: values.name.trim(),
          description: values.description.trim(),
        });
        if (error) return error;
      }
      for (const contributor of added) {
        const error = await send(`${base}/contributors`, "POST", {
          email: contributor.email,
          role: "CONTRIBUTOR",
        });
        if (error) return error;
      }
      for (const contributor of removed) {
        const error = await send(
          `${base}/contributors/${encodeURIComponent(contributor.id)}`,
          "DELETE"
        );
        if (error) return error;
      }
      return null;
    } catch {
      return "Impossible de contacter le serveur.";
    } finally {
      onSaved(); // rafraîchit l'affichage même si une étape a échoué
    }
  }

  return (
    <ProjectFormModal
      title="Modifier un projet"
      submitLabel="Enregistrer"
      savingLabel="Enregistrement..."
      markRequired
      requireChange
      initialValues={initialValues}
      excludeIds={[project.owner.id]}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  );
}
