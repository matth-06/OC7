import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type Method = "GET" | "POST" | "PUT" | "DELETE";

/**
 * Relaie une requête vers le back-end avec le cookie `auth_token`.
 * Gère : utilisateur non connecté, BACKEND_URL absent, back-end injoignable
 * et réponses sans corps (204).
 */
export async function callBackend(method: Method, path: string, body?: unknown) {
  const token = (await cookies()).get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Vous devez être connecté." }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    console.error("La variable BACKEND_URL n'est pas configurée.");
    return NextResponse.json({ message: "Le serveur n'est pas configuré." }, { status: 500 });
  }

  try {
    const response = await fetch(`${backendUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

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
    console.error(`Erreur lors de l'appel ${method} ${path} du backend:`, error);
    return NextResponse.json(
      { message: "Impossible de contacter le serveur pour le moment." },
      { status: 502 }
    );
  }
}

/** Lit le corps JSON d'une requête ; renvoie undefined s'il est invalide. */
export async function readJson(request: Request): Promise<unknown | undefined> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export const badRequest = () =>
  NextResponse.json({ message: "Requête invalide." }, { status: 400 });
