import { callBackend } from "../../../../_lib/backend";

/** Retrait d'un contributeur. ⚠️ Supposé : DELETE `${BACKEND_URL}/projects/:id/contributors/:userId` */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params;
  return callBackend(
    "DELETE",
    `/projects/${encodeURIComponent(id)}/contributors/${encodeURIComponent(userId)}`
  );
}