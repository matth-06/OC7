export type ApiUser = { id: string; firstName: string; lastName: string };
export type ApiMember = { role: "OWNER" | "MEMBER"; user: ApiUser };

export const fullName = (u: ApiUser) => `${u.firstName} ${u.lastName}`.trim();

export const initials = (u: ApiUser) =>
  `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase();

export const STATUS_LABELS: Record<string, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminée",
  CANCELLED: "Annulée",
};

export const STATUS_CLASSES: Record<string, string> = {
  TODO: "pj-status-todo",
  IN_PROGRESS: "pj-status-in-progress",
  DONE: "pj-status-done",
  CANCELLED: "pj-status-cancelled",
};

export function formatDate(iso: string | null, fallback = "Sans échéance") {
  if (!iso) return fallback;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" });
}

/** Propriétaire en premier, puis les autres membres. */
export function sortMembers(members: ApiMember[]) {
  return [...members].sort((a, b) => Number(b.role === "OWNER") - Number(a.role === "OWNER"));
}
