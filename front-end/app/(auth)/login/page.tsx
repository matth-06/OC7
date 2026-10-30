
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Connexion impossible.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
    <section className="login-panel">
      <Link href="/dashboard" aria-label="Accueil">
        <Image
          src="/images/logo.svg"
          alt="Abricot"
          width={185}
          height={60}
          className="login-logo"
          priority
        />
      </Link>

      <div className="login-form-container">
        <h1>Connexion</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <Link href="/forgot-password" className="login-forgot">
          Mot de passe oublié ?
        </Link>
      </div>

      <p className="login-register">
        Pas encore de compte ?{" "}
        <Link href="/register">Créer un compte</Link>
      </p>
    </section>

    <aside className="login-image-panel">
      <Image
        src="/images/login/login.jpg"
        alt=""
        width={1200}
        height={1600}
        className="login-image"
        priority
      />
    </aside>
  </main>
);
}
