
import type { Metadata } from "next";
import Link from "next/link";
import "./layoutApp.css";

export const metadata: Metadata = {
  title: "My Application",
  description: "Mon application Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <header className="header">
          <div className="header-content">
            <h2 className="logo">MyApp</h2>

            <nav className="navigation">
              <Link href="/" className="nav-button">
                Dashboard
              </Link>

              <Link href="/project" className="nav-button">
                Project
              </Link>

              <Link href="/profile" className="nav-button">
                Profile
              </Link>
            </nav>
          </div>
        </header>

        <main className="main-content">
          {children}
        </main>

        <footer className="footer">
          <p>© 2026 MyApp — Tous droits réservés.</p>
        </footer>
      </body>
    </html>
  );
}
