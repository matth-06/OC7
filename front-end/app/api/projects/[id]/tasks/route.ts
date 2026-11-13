import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Création d'une tâche dans un projet.
 * ⚠️ Chemin supposé : POST `${BACKEND_URL}/projects/:id/tasks`
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = (await cookies()).get("auth_token")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Vous devez être connecté pour créer une tâche." },
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }

  const { id } = await params;

  try {
    const response = await fetch(
      `${backendUrl}/projects/${encodeURIComponent(id)}/tasks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    console.error("Impossible de créer la tâche auprès du backend:", error);
    return NextResponse.json(
      { message: "Impossible de créer la tâche pour le moment." },
      { status: 502 }
    );
  }
}