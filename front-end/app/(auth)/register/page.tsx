"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import "./../login/login.css";
import "./register.css";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Inscription impossible.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page register-page">
      <section className="login-panel">
        <Link href="/" aria-label="Accueil">
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
          <h1>Inscription</h1>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="name">Nom</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              minLength={2}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <p className="register-hint">
              8 caractères minimum, avec une majuscule, un chiffre et un
              caractère spécial.
            </p>

            <label htmlFor="confirm-password">Confirmer le mot de passe</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Création du compte..." : "Créer mon compte"}
            </button>
          </form>
        </div>

        <p className="login-register">
          Déjà inscrit ? <Link href="/login">Se connecter</Link>
        </p>
      </section>

      <aside className="login-image-panel">
        <Image
          src="/images/login/register.jpg"
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