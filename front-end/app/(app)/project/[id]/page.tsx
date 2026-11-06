"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Search,
  Sparkles,
} from "lucide-react";
import { useApi } from "../../../hooks/use-api";
import { Avatar, StatusBadge, UserChip } from "../ui";
import {
  fullName,
  formatDate,
  buildTeam,
  STATUS_LABELS,
  type ApiMember,
  type ApiUser,
} from "../utils";
import "../projects.css";

/* ---- Format attendu de GET /api/projects/:id → { data: { project: {...} } } ---- */
type ApiComment = { id: string; content: string; createdAt: string; author: ApiUser };
type ApiTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  assignees: ApiUser[];
  comments: ApiComment[];
};
type ApiProjectDetail = {
  id: string;
  name: string;
  description: string | null;
  owner: ApiUser;
  members: ApiMember[]; // hors propriétaire
  tasks: ApiTask[];
};

type View = "liste" | "calendrier";

function TaskMenu({ taskTitle }: { taskTitle: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="pj-menu" ref={ref}>
      <button
        type="button"
        className="pj-icon-button"
        aria-label={`Actions pour la tâche ${taskTitle}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <MoreHorizontal size={16} aria-hidden />
      </button>
      {open && (
        <div className="pj-menu-list" role="menu">
          {/* TODO : brancher sur vos routes de modification / suppression */}
          <button type="button" role="menuitem" onClick={() => setOpen(false)}>
            Modifier
          </button>
          <button
            type="button"
            role="menuitem"
            className="pj-menu-danger"
            onClick={() => setOpen(false)}
          >
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

function TaskItem({ task }: { task: ApiTask }) {
  const [open, setOpen] = useState(false);
  const panelId = `comments-${task.id}`;

  return (
    <article className="pj-task">
      <div className="pj-task-body">
        <div className="pj-task-main">
          <div className="pj-task-title-row">
            <h3 className="pj-task-title">{task.title}</h3>
            <StatusBadge status={task.status} />
          </div>
          <p className="pj-task-description">{task.description ?? "Aucune description"}</p>

          <p className="pj-task-meta">
            <span className="pj-task-meta-label">Échéance :</span>
            <CalendarDays size={14} aria-hidden />
            <span className="pj-task-meta-value">{formatDate(task.dueDate)}</span>
          </p>

          <div className="pj-task-meta">
            <span className="pj-task-meta-label">Assigné à :</span>
            {task.assignees.length > 0 ? (
              task.assignees.map((u) => <UserChip key={u.id} user={u} />)
            ) : (
              <span className="pj-task-meta-value">Personne</span>
            )}
          </div>
        </div>
        <TaskMenu taskTitle={task.title} />
      </div>

      <button
        type="button"
        className="pj-task-comments-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <span>Commentaires ({task.comments.length})</span>
        {open ? <ChevronDown size={16} aria-hidden /> : <ChevronUp size={16} aria-hidden />}
      </button>

      {open && (
        <ul id={panelId} className="pj-comments">
          {task.comments.length === 0 ? (
            <li className="pj-comments-empty">Aucun commentaire.</li>
          ) : (
            task.comments.map((c) => (
              <li key={c.id} className="pj-comment">
                <Avatar user={c.author} />
                <div>
                  <p className="pj-comment-head">
                    <strong>{fullName(c.author)}</strong>
                    <span>{formatDate(c.createdAt, "")}</span>
                  </p>
                  <p className="pj-comment-text">{c.content}</p>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </article>
  );
}

function ProjectDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useApi<{ project: ApiProjectDetail }>(
    `/api/projects/${encodeURIComponent(id)}`
  );
  const project = data?.project;

  const [view, setView] = useState<View>("liste");
  const [status, setStatus] = useState("ALL");
  const [query, setQuery] = useState("");

  const tasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (project?.tasks ?? []).filter((t) => {
      if (status !== "ALL" && t.status !== status) return false;
      if (!q) return true;
      return [t.title, t.description ?? ""].some((s) => s.toLowerCase().includes(q));
    });
  }, [project, status, query]);

  if (loading) {
    return (
      <main className="pj-page">
        <p className="pj-state" role="status">Chargement du projet...</p>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="pj-page">
        <div className="pj-container">
          <Link href="/project" className="pj-icon-button" aria-label="Retour aux projets">
            <ArrowLeft size={16} aria-hidden />
          </Link>
          <p className="pj-state pj-state-error" role="alert">
            {error || "Projet introuvable."}
          </p>
        </div>
      </main>
    );
  }

  const team = buildTeam(project.owner, project.members);

  return (
    <main className="pj-page">
      <div className="pj-container">
        {/* En-tête */}
        <header className="pj-detail-header">
          <Link href="/project" className="pj-icon-button pj-back" aria-label="Retour aux projets">
            <ArrowLeft size={16} aria-hidden />
          </Link>

          <div className="pj-detail-heading">
            <h1 className="pj-title">
              {project.name}
              {/* TODO : brancher sur votre formulaire de modification */}
              <button type="button" className="pj-link-button">Modifier</button>
            </h1>
            <p className="pj-subtitle">{project.description ?? "Aucune description"}</p>
          </div>

          <div className="pj-detail-actions">
            <button type="button" className="pj-btn pj-btn-dark">Créer une tâche</button>
            <button type="button" className="pj-btn pj-btn-accent">
              <Sparkles size={14} aria-hidden />
              IA
            </button>
          </div>
        </header>

        {/* Contributeurs
        <section className="pj-contributors" aria-label="Contributeurs">
          <p className="pj-contributors-title">
            <strong>Contributeurs</strong>
            <span>
              {team.length} personne{team.length > 1 ? "s" : ""}
            </span>
          </p>
          <div className="pj-contributors-list">
            {team.map((m) => (
              <UserChip key={m.user.id} user={m.user} owner={m.isOwner} />
            ))}
          </div>
        </section> */}

        {/* Tâches */}
        <section className="pj-panel">
          <div className="pj-panel-header">
            <div>
              <h2 className="pj-panel-title">Tâches</h2>
              <p className="pj-panel-subtitle">Par ordre de priorité</p>
            </div>

            <div className="pj-toolbar">
              <div className="pj-tabs" role="group" aria-label="Mode d’affichage">
                <button
                  type="button"
                  aria-pressed={view === "liste"}
                  className={`pj-tab ${view === "liste" ? "pj-tab-active" : ""}`}
                  onClick={() => setView("liste")}
                >
                  <CheckSquare size={14} aria-hidden /> Liste
                </button>
                <button
                  type="button"
                  aria-pressed={view === "calendrier"}
                  className={`pj-tab ${view === "calendrier" ? "pj-tab-active" : ""}`}
                  onClick={() => setView("calendrier")}
                >
                  <CalendarDays size={14} aria-hidden /> Calendrier
                </button>
              </div>

              <label className="pj-select">
                <span className="pj-sr-only">Filtrer par statut</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="ALL">Statut</option>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} aria-hidden />
              </label>

              <label className="pj-search">
                <span className="pj-sr-only">Rechercher une tâche</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher une tâche"
                />
                <Search size={14} aria-hidden />
              </label>
            </div>
          </div>

          {view === "liste" ? (
            <div className="pj-task-list">
              {tasks.length > 0 ? (
                tasks.map((task) => <TaskItem key={task.id} task={task} />)
              ) : (
                <p className="pj-state">
                  {project.tasks.length === 0
                    ? "Ce projet n’a pas encore de tâche."
                    : "Aucune tâche ne correspond à votre recherche."}
                </p>
              )}
            </div>
          ) : (
            <p className="pj-state">La vue Calendrier sera bientôt disponible.</p>
          )}
        </section>
      </div>
    </main>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="pj-page">
          <p className="pj-state" role="status">Chargement du projet...</p>
        </main>
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}