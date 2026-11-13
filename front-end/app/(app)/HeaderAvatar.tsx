"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "./CurrentUserProvider";
import { initials } from "./project/utils";

export function HeaderAvatar() {
  const { user } = useCurrentUser();
  const pathname = usePathname();
  const isActive = pathname.startsWith("/profile");

  return (
    <Link
      href="/profile"
      className={`header-avatar ${isActive ? "header-avatar-active" : ""}`}
      aria-label={user ? `Mon compte (${user.name})` : "Mon compte"}
      aria-current={isActive ? "page" : undefined}
      title={user?.name}
    >
      {user ? initials(user) : null}
    </Link>
  );
}