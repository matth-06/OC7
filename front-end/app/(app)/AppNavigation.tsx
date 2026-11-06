
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { LayoutDashboard, FolderOpen } from "lucide-react";

function NavigationLinks() {
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

function Avatar(){
  const pathname = usePathname();
  return (
    <nav className="header-avatar">
      <Link href="/profile" className={pathname === "/profile" ? "active" : ""}>
        <span className="avatar-text">AD</span>
      </Link>
    </nav>
  );
}

export function AppNavigation() {
  return (
    <Suspense
      fallback={
        <nav className="header-nav">
          <Link href="/dashboard">
            <LayoutDashboard className="nav-icon" />
            Tableau de bord
          </Link>
          <Link href="/project">
            <FolderOpen className="nav-icon" />
            Projets
          </Link>
        </nav>
      }
    >
      <NavigationLinks />
    </Suspense>
  );
}
