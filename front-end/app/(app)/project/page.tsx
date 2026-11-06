"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { useApi } from "./use-api";
import { Avatar } from "./ui";
import { fullName, sortMembers, type ApiMember } from "./utils";
import "./projects.css";

/* ---- Format attendu de GET /api/projects → { data: { projects: [...] } } ---- */
type ApiProject = {
  id: string;
  name: string;
  description: string | null;
  members: ApiMember[];
  tasks: { status: string }[];
};

const MAX_VISIBLE_MEMBERS = 3; // en plus du propriétaire

function ProjectCard({ project }: { project: ApiProject }) {
  const total = project.tasks.length;
  const done = project.tasks.filter((t) => t.status === "DONE").length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  const members = sortMembers(project.members);
  const owner = members.find((m) => m.role === "OWNER");
  const others = members.filter((m) => m !== owner);
  const visible = others.slice(0, MAX_VISIBLE_MEMBERS);
  const hidden = others.length - visible.length;

  return (
    <Link href={`/project/${project.id}`} className="pj-card">
      <h2 className="pj-card-title">{project.name}</h2>
      <p className="pj-card-description">{project.description ?? "Aucune description"}</p>

      <div className="pj-card-progress">
        <div className="pj-progress-row">
          <span>Progression</span>
          <span className="pj-progress-value">{progress}%</span>
        </div>
        <div
          className="pj-progress-bar"
          role="progressbar"
          aria-label={`Progression de ${project.name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div className="pj-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="pj-progress-caption">
          {done}/{total} tâches terminées
        </p>
      </div>

      <div className="pj-card-team">
        <p className="pj-team-label">
          <Users className="pj-team-icon" aria-hidden />
          Équipe ({members.length})
        </p>
        <div className="pj-team-members">
          {owner && (
            <span className="pj-chip">
              <Avatar user={owner.user} owner />
              <span className="pj-pill pj-pill-owner">Propriétaire</span>
            </span>
          )}
          <span className="pj-avatar-stack">
            {visible.map((m) => (
              <Avatar key={m.user.id} user={m.user} />
            ))}
            {hidden > 0 && (
              <span className="pj-avatar" title={others.slice(MAX_VISIBLE_MEMBERS).map((m) => fullName(m.user)).join(", ")}>
                +{hidden}
              </span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ProjectsPage() {
  const { data, loading, error } = useApi<{ projects: ApiProject[] }>("/api/projects");
  const projects = data?.projects ?? [];

  return (
    <main className="pj-page">
      <div className="pj-container">
        <header className="pj-header">
          <div>
            <h1 className="pj-title">Mes projets</h1>
            <p className="pj-subtitle">Gérez vos projets</p>
          </div>
          {/* TODO : brancher sur votre formulaire / modale de création */}
          <button type="button" className="pj-btn pj-btn-dark">
            + Créer un projet
          </button>
        </header>

        {loading ? (
          <p className="pj-state" role="status">Chargement des projets...</p>
        ) : error ? (
          <p className="pj-state pj-state-error" role="alert">{error}</p>
        ) : projects.length === 0 ? (
          <p className="pj-state">Vous n’avez pas encore de projet.</p>
        ) : (
          <div className="pj-grid">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
