import { badRequest, callBackend, readJson } from "../../../_lib/backend";

/** Ajout d'un contributeur. ⚠️ Supposé : POST `${BACKEND_URL}/projects/:id/contributors` { email, role } */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await readJson(request);
  if (body === undefined) return badRequest();
  const { id } = await params;
  return callBackend("POST", `/projects/${encodeURIComponent(id)}/contributors`, body);
}