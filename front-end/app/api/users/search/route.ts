import { callBackend } from "../../_lib/backend";

/** Recherche de collaborateurs. ⚠️ Supposé : GET `${BACKEND_URL}/users/search?query=...` */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("query") ?? "";
  return callBackend("GET", `/users/search?query=${encodeURIComponent(query)}`);
}