
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, FolderOpen } from "lucide-react";
import { AppNavigation } from "./AppNavigation";
import "./layoutApp.css";

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <Link href="/dashboard" className="header-logo">
          <Image
            src="/images/logo.svg"
            alt="Abricot"
            width={90}
            height={30}
            priority
          />
        </Link>

        <AppNavigation />

        <Link href="/profile" className="header-avatar">
          AD
        </Link>
      </header>

      {/* Contenu des pages */}
      <main className="app-content">{children}</main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-logo">
          <Image
            src="/images/logoB.svg"
            alt="Abricot"
            width={60}
            height={20}
          />
        </div>

        <p className="footer-copyright">Abricot 2025</p>
      </footer>
    </div>
  );
}
