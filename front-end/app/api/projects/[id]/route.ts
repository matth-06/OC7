import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = (await cookies()).get("auth_token")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Vous devez être connecté pour consulter ce projet." },
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

  const { id } = await params;

  try {
    const response = await fetch(
      `${backendUrl}/projects/${encodeURIComponent(id)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    return NextResponse.json(await response.json(), {
      status: response.status,
    });
  } catch (error) {
    console.error("Impossible de récupérer le projet auprès du backend:", error);
    return NextResponse.json(
      { message: "Impossible de récupérer le projet pour le moment." },
      { status: 502 }
    );
  }
}
