import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type Context = { params: Promise<{ id: string; taskId: string }> };

/**
 * Modification (PUT) et suppression (DELETE) d'une tâche.
 * ⚠️ Chemin supposé : `${BACKEND_URL}/projects/:id/tasks/:taskId`
 */
async function forward(method: "PUT" | "DELETE", { params }: Context, body?: unknown) {
  const token = (await cookies()).get("auth_token")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Vous devez être connecté pour modifier une tâche." },
      { status: 401 }
    );
  }

  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    console.error("La variable BACKEND_URL n'est pas configurée.");
    return NextResponse.json(
      { message: "Le serveur de projets n'est pas configuré." },
      { status: 500 }
    );
  }

  const { id, taskId } = await params;

  try {
    const response = await fetch(
      `${backendUrl}/projects/${encodeURIComponent(id)}/tasks/${encodeURIComponent(taskId)}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        cache: "no-store",
      }
    );

    // Une suppression peut répondre sans corps (204)
    const text = await response.text();
    let payload: unknown = {};
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = {};
      }
    }

    return NextResponse.json(payload, { status: response.status === 204 ? 200 : response.status });
  } catch (error) {
    console.error("Erreur lors de l'appel au backend (tâche):", error);
    return NextResponse.json(
      { message: "Impossible de contacter le serveur pour le moment." },
      { status: 502 }
    );
  }
}

export async function PUT(request: Request, context: Context) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }
  return forward("PUT", context, body);
}

export async function DELETE(_request: Request, context: Context) {
  return forward("DELETE", context);
}