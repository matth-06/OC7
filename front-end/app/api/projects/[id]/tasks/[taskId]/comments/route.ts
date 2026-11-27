import { badRequest, callBackend, readJson } from "../../../../../_lib/backend";

/**
 * Ajout d'un commentaire sur une tâche.
 * ⚠️ Supposé : POST `${BACKEND_URL}/projects/:id/tasks/:taskId/comments` { content }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const body = await readJson(request);
  if (body === undefined) return badRequest();
  const { id, taskId } = await params;
  return callBackend(
    "POST",
    `/projects/${encodeURIComponent(id)}/tasks/${encodeURIComponent(taskId)}/comments`,
    body
  );
}