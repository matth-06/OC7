import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Relais vers le profil de l'utilisateur connecté côté back-end.
 * ⚠️ Chemin supposé : `${BACKEND_URL}/auth/profile` (GET pour lire, PUT pour modifier).
 */
async function forward(method: "GET" | "PUT", body?: unknown) {
  const token = (await cookies()).get("auth_token")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Vous devez être connecté pour accéder à votre compte." },
      { status: 401 }
    );
  }

  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    console.error("La variable BACKEND_URL n'est pas configurée.");
    return NextResponse.json(
      { message: "Le serveur n'est pas configuré." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${backendUrl}/auth/profile`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    console.error("Erreur lors de l'appel au profil du backend:", error);
    return NextResponse.json(
      { message: "Impossible de contacter le serveur pour le moment." },
      { status: 502 }
    );
  }
}

export async function GET() {
  return forward("GET");
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }
  return forward("PUT", body);
}