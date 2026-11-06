import { fullName, initials, STATUS_CLASSES, STATUS_LABELS, type ApiUser } from "./utils";

export function Avatar({ user, owner = false }: { user: ApiUser; owner?: boolean }) {
  return (
    <span
      className={`pj-avatar ${owner ? "pj-avatar-owner" : ""}`}
      title={fullName(user)}
      aria-hidden
    >
      {initials(user)}
    </span>
  );
}

/** Avatar + pastille (nom, ou « Propriétaire »). */
export function UserChip({ user, owner = false }: { user: ApiUser; owner?: boolean }) {
  return (
    <span className="pj-chip">
      <Avatar user={user} owner={owner} />
      <span className={`pj-pill ${owner ? "pj-pill-owner" : ""}`}>
        {owner ? "Propriétaire" : fullName(user)}
      </span>
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`pj-status ${STATUS_CLASSES[status] ?? "pj-status-unknown"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
