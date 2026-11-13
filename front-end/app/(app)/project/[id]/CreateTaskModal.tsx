"use client";

import type { TeamMember } from "../utils";
import { TaskFormModal, toTaskPayload, type TaskFormValues } from "./TaskFormModal";

type Props = {
  projectId: string;
  members: TeamMember[];
  onClose: () => void;
  /** Appelé après une création réussie (ex. recharger la liste des tâches) */
  onCreated: () => void;
};

const EMPTY: TaskFormValues = {
  title: "",
  description: "",
  dueDate: "",
  assigneeIds: [],
  status: "TODO",
};

export function CreateTaskModal({ projectId, members, onClose, onCreated }: Props) {
  async function handleSubmit(values: TaskFormValues) {
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toTaskPayload(values)),
      });
      const result = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        return result.message ?? "La création de la tâche a échoué. Veuillez réessayer.";
      }
      onCreated();
      return null;
    } catch {
      return "Impossible de contacter le serveur.";
    }
  }

  return (
    <TaskFormModal
      title="Créer une tâche"
      submitLabel="+ Ajouter une tâche"
      savingLabel="Ajout en cours..."
      markRequired
      initialValues={EMPTY}
      members={members}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  );
}