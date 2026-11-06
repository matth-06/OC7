/* Utilisateur tel que renvoyé par le back-end : { id, email, name } */
export type ApiUser = { id: string; email?: string; name: string };

/* Entrée de `members` : { id, role: "CONTRIBUTOR" | …, user } (le propriétaire n'y figure pas) */
export type ApiMember = { id: string; role: string; user: ApiUser };

export type TeamMember = { user: ApiUser; isOwner: boolean };

export const fullName = (u: ApiUser) => (u.name ?? "").trim();

export function initials(u: ApiUser) {
  const parts = fullName(u).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Équipe complète : le propriétaire (champ `owner`) en premier, puis `members`. */
export function buildTeam(owner: ApiUser, members: ApiMember[]): TeamMember[] {
  return [
    { user: owner, isOwner: true },
    ...members
      .filter((m) => m.user.id !== owner.id)
      .map((m) => ({ user: m.user, isOwner: false })),
  ];
}

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