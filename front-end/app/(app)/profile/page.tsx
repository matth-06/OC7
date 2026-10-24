"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogout() {
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
            });

            if (!response.ok) {
                setError("La déconnexion a échoué. Veuillez réessayer.");
                return;
            }

            router.replace("/login");
            router.refresh();
        } catch {
            setError("Impossible de contacter le serveur.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main>
            <h1>Profile Page</h1>
            {error && <p role="alert">{error}</p>}
            <button type="button" onClick={handleLogout} disabled={loading}>
                {loading ? "Déconnexion..." : "Se déconnecter"}
            </button>
        </main>
    );
}