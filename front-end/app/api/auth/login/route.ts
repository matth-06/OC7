
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const response = await fetch(
      `${process.env.BACKEND_URL}/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { message: "Identifiants invalides ou accès refusé." },
        { status: 401 }
      );
    }

    const data = await response.json();

    // À adapter au format réel de ton backend.
    const token = data.token;

    if (typeof token !== "string" || !token) {
      return NextResponse.json(
        { message: "Réponse du backend invalide." },
        { status: 502 }
      );
    }

    const cookieStore = await cookies();

    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { message: "Impossible de contacter le serveur." },
      { status: 500 }
    );
  }
}
