
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderOpen } from "lucide-react";

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav className="header-nav">
      <Link
        href="/dashboard"
        className={pathname === "/dashboard" ? "active" : ""}
      >
        <LayoutDashboard className="nav-icon" />
        Tableau de bord
      </Link>

      <Link
        href="/project"
        className={pathname.startsWith("/project") ? "active" : ""}
      >
        <FolderOpen className="nav-icon" />
        Projets
      </Link>
    </nav>
  );
}
