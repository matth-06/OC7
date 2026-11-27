import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Propose 3 tâches à partir d'une description (IA Gemini).
 *
 * ⚠️ Variables d'environnement (.env.local) :
 *   GEMINI_API_KEY=AIza...          (obligatoire, ne jamais exposer côté client)
 *   GEMINI_MODEL=gemini-3.5-flash-lite (optionnel)
 *
 * Réponse : { data: { tasks: [{ title, description }, … 3 éléments] } }
 */

const MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
const MAX_PROMPT_LENGTH = 1000;
const GEMINI_TIMEOUT_MS = 60_000;

const SYSTEM_PROMPT = `Tu es un assistant de gestion de projet intégré à une application de suivi de tâches.
L'utilisateur décrit des tâches à ajouter à un projet.
Propose exactement 3 tâches différentes et concrètes, en français. Chaque tâche a :
- un nom court (60 caractères maximum) ;
- une description d'une phrase (160 caractères maximum).
Les 3 propositions doivent offrir des angles ou des découpages distincts, sans doublon avec les tâches existantes.
Réponds uniquement avec du JSON valide, sans aucun autre texte, de la forme :
{"tasks":[{"title":"...","description":"..."},{"title":"...","description":"..."},{"title":"...","description":"..."}]}`;

type Suggestion = { title: string; description: string };

type GeminiResponse = {
  candidates?: {
    finishReason?: string;
    content?: { parts?: { text?: string; thought?: boolean }[] };
  }[];
  promptFeedback?: { blockReason?: string };
};

function parseSuggestions(text: string): Suggestion[] | null {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as { tasks?: unknown };
    if (!Array.isArray(parsed.tasks)) return null;

    const tasks = parsed.tasks
      .filter(
        (t): t is Suggestion =>
          typeof t === "object" &&
          t !== null &&
          typeof (t as Suggestion).title === "string" &&
          typeof (t as Suggestion).description === "string"
      )
      .map((t) => ({
        title: t.title.trim().slice(0, 80),
        description: t.description.trim().slice(0, 200),
      }))
      .filter((t) => t.title !== "");

    return tasks.length > 0 ? tasks.slice(0, 3) : null;
  } catch {
    return null;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Vous devez être connecté." }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_URL;
  // trim : évite un espace ou un retour à la ligne invisible collé avec la clé
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!backendUrl || !apiKey) {
    console.error("BACKEND_URL ou GEMINI_API_KEY n'est pas configurée.");
    return NextResponse.json(
      { message: "La génération par IA n'est pas configurée." },
      { status: 500 }
    );
  }

  let prompt = "";
  try {
    const body = (await request.json()) as { prompt?: unknown };
    prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  } catch {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }

  if (!prompt) {
    return NextResponse.json(
      { message: "Décrivez les tâches que vous souhaitez ajouter." },
      { status: 400 }
    );
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json(
      { message: `Votre description est trop longue (${MAX_PROMPT_LENGTH} caractères maximum).` },
      { status: 400 }
    );
  }

  const { id } = await params;

  // 1. Vérifie que l'utilisateur a accès au projet et récupère son contexte
  let project: { name?: string; description?: string | null; tasks?: { title?: string }[] } = {};
  try {
    const response = await fetch(`${backendUrl}/projects/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const result = (await response.json().catch(() => ({}))) as {
      data?: { project?: typeof project };
      message?: string;
    };

    if (!response.ok) {
      return NextResponse.json(
        { message: result.message ?? "Projet introuvable." },
        { status: response.status }
      );
    }
    project = result.data?.project ?? {};
  } catch {
    return NextResponse.json({ message: "Impossible de contacter le serveur." }, { status: 502 });
  }

  const existingTitles = (project.tasks ?? [])
    .map((t) => t.title)
    .filter((t): t is string => Boolean(t))
    .slice(0, 50);

  // 2. Demande 3 propositions à Gemini
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: [
                    `Projet : ${project.name ?? "Sans nom"}`,
                    `Description du projet : ${project.description ?? "Aucune"}`,
                    `Tâches existantes : ${existingTitles.length > 0 ? existingTitles.join(" ; ") : "aucune"}`,
                    "",
                    `Demande de l'utilisateur : ${prompt}`,
                  ].join("\n"),
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 512,
          },
        }),
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      }
    );

    if (!response.ok) {
      if ([400, 401, 403].includes(response.status)) {
        console.error(
          "GEMINI_API_KEY refusée ou modèle invalide : vérifiez la clé et GEMINI_MODEL dans .env.local, puis redémarrez `npm run dev`."
        );
      }
      console.error("Erreur de l'API Gemini:", response.status, await response.text());
      return NextResponse.json(
        { message: "L'IA n'a pas pu générer de tâches. Veuillez réessayer." },
        { status: 502 }
      );
    }

    const result = (await response.json()) as GeminiResponse;

    if (result.promptFeedback?.blockReason) {
      return NextResponse.json(
        { message: "L'IA ne peut pas traiter cette demande. Veuillez la reformuler." },
        { status: 422 }
      );
    }

    const text = (result.candidates?.[0]?.content?.parts ?? [])
      .filter((part) => !part.thought)
      .map((part) => part.text ?? "")
      .join("");

    const tasks = parseSuggestions(text);
    if (!tasks) {
      return NextResponse.json(
        { message: "La réponse de l'IA est inexploitable. Veuillez reformuler votre demande." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, data: { tasks } });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.error(`Délai dépassé lors de l'appel à Gemini (${GEMINI_TIMEOUT_MS} ms).`);
      return NextResponse.json(
        { message: "La génération prend trop de temps. Veuillez réessayer." },
        { status: 504 }
      );
    }

    console.error("Impossible de contacter l'API Gemini:", error);
    return NextResponse.json(
      { message: "L'IA ne répond pas pour le moment. Veuillez réessayer." },
      { status: 502 }
    );
  }
}