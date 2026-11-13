"use client";

import type { TeamMember } from "../utils";
import { TaskFormModal, toTaskPayload, type TaskFormValues } from "./TaskFormModal";

type EditableTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  assignees: { id: string }[];
};

type Props = {
  projectId: string;
  task: EditableTask;
  members: TeamMember[];
  onClose: () => void;
  /** Appelé après une modification réussie (ex. recharger la liste des tâches) */
  onSaved: () => void;
};

export function EditTaskModal({ projectId, task, members, onClose, onSaved }: Props) {
  const initialValues: TaskFormValues = {
    title: task.title,
    description: task.description ?? "",
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    assigneeIds: task.assignees.map((u) => u.id),
    status: task.status,
  };

  async function handleSubmit(values: TaskFormValues) {
    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(task.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toTaskPayload(values)),
        }
      );
      const result = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        return result.message ?? "La modification a échoué. Veuillez réessayer.";
      }
      onSaved();
      return null;
    } catch {
      return "Impossible de contacter le serveur.";
    }
  }

  return (
    <TaskFormModal
      title="Modifier"
      submitLabel="Enregistrer"
      savingLabel="Enregistrement..."
      requireChange
      initialValues={initialValues}
      members={members}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  );
}
