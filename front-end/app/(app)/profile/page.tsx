"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "../../hooks/use-api";
import "./profile.css";

/* ---- Réponse de GET /api/profile → { data: { user: { id, email, name } } } ---- */
type ApiUser = { id: string; email: string; name: string };

type Feedback = { type: "success" | "error"; text: string } | null;

/* Le back-end stocke un seul champ `name` : « Prénom Nom ». */
function splitName(name: string) {
  const [firstName = "", ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

function ProfileForm({ user }: { user: ApiUser }) {
  const router = useRouter();
  const initial = splitName(user.name);

  const [displayName, setDisplayName] = useState(user.name);
  const [lastName, setLastName] = useState(initial.lastName);
  const [firstName, setFirstName] = useState(initial.firstName);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setSaving(true);

    const name = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email.trim(),
          // Le mot de passe n'est envoyé que s'il a été saisi
          ...(password ? { password } : {}),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setFeedback({
          type: "error",
          text: result.message ?? "La modification a échoué. Veuillez réessayer.",
        });
        return;
      }

      setDisplayName(name);
      setPassword("");
      setFeedback({ type: "success", text: "Vos informations ont été mises à jour." });
      router.refresh();
    } catch {
      setFeedback({ type: "error", text: "Impossible de contacter le serveur." });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLogoutError("");
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        setLogoutError("La déconnexion a échoué. Veuillez réessayer.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setLogoutError("Impossible de contacter le serveur.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <section className="profile-card">
      <h1 className="profile-title">Mon compte</h1>
      <p className="profile-subtitle">{displayName}</p>

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="profile-field">
          <label htmlFor="profile-lastname">Nom</label>
          <input
            id="profile-lastname"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <div className="profile-field">
          <label htmlFor="profile-firstname">Prénom</label>
          <input
            id="profile-firstname"
            type="text"
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        <div className="profile-field">
          <label htmlFor="profile-email">Email</label>
          <input
            id="profile-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="profile-field">
          <label htmlFor="profile-password">Mot de passe</label>
          <input
            id="profile-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••"
            aria-describedby="profile-password-hint"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p id="profile-password-hint" className="profile-hint">
            Laissez vide pour conserver votre mot de passe actuel.
          </p>
        </div>

        {feedback && (
          <p
            className={`profile-feedback profile-feedback-${feedback.type}`}
            role={feedback.type === "error" ? "alert" : "status"}
          >
            {feedback.text}
          </p>
        )}

        <div className="profile-actions">
          <button type="submit" className="profile-btn profile-btn-dark" disabled={saving}>
            {saving ? "Enregistrement..." : "Modifier les informations"}
          </button>

          <button
            type="button"
            className="profile-btn profile-btn-outline"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Déconnexion..." : "Se déconnecter"}
          </button>
        </div>

        {logoutError && (
          <p className="profile-feedback profile-feedback-error" role="alert">
            {logoutError}
          </p>
        )}
      </form>
    </section>
  );
}

export default function ProfilePage() {
  const { data, loading, error } = useApi<{ user: ApiUser }>("/api/profile");

  return (
    <div className="profile-page">
      <div className="profile-container">
        {loading ? (
          <p className="profile-state" role="status">Chargement de votre compte...</p>
        ) : error || !data?.user ? (
          <p className="profile-state profile-state-error" role="alert">
            {error || "Impossible de charger votre compte."}
          </p>
        ) : (
          <ProfileForm user={data.user} />
        )}
      </div>
    </div>
  );
}