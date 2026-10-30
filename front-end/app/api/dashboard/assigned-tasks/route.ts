import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const token = (await cookies()).get("auth_token")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Vous devez être connecté pour consulter vos tâches." },
      { status: 401 }
    );
  }

  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    console.error("La variable BACKEND_URL n'est pas configurée.");
    return NextResponse.json(
      { message: "Le serveur de tâches n'est pas configuré." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${backendUrl}/dashboard/assigned-tasks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    return NextResponse.json(await response.json(), {
      status: response.status,
    });
  } catch (error) {
    console.error("Impossible de récupérer les tâches auprès du backend:", error);
    return NextResponse.json(
      { message: "Impossible de récupérer les tâches pour le moment." },
      { status: 502 }
    );
  }
}
