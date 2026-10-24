import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${process.env.BACKEND_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message ?? "Inscription refusée." },
        { status: response.status }
      );
    }

    const token = data.data?.token;

    if (typeof token !== "string" || !token) {
      return NextResponse.json(
        { message: "Token absent de la réponse du backend." },
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
      { message: "Impossible de contacter le backend." },
      { status: 500 }
    );
  }
}
