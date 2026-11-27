"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  Trash2,
} from "lucide-react";
import { useApi } from "../../../hooks/use-api";
import { useCurrentUser } from "../../CurrentUserProvider";
import { AiTaskModal } from "./AiTaskModal";
import { CreateTaskModal } from "./CreateTaskModal";
import { EditProjectModal } from "../EditProjectModal";
import { EditTaskModal } from "./EditTaskModal";
import { Avatar, StatusBadge, UserChip } from "../ui";
import {
  fullName,
  formatDate,
  buildTeam,
  getPermissions,
  getProjectRole,
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
  userRole?: string; // rôle de l'utilisateur connecté, si le back-end le renvoie
};

type View = "liste" | "calendrier";

function TaskMenu({
  taskTitle,
  onEdit,
  onDelete,
}: {
  taskTitle: string;
  onEdit?: () => void; // absent = pas le droit de modifier
  onDelete?: () => void; // absent = pas le droit de supprimer
}) {
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
          {onEdit && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              Modifier
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              role="menuitem"
              className="pj-menu-danger"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CommentForm({
  projectId,
  taskId,
  author,
  onAdded,
}: {
  projectId: string;
  taskId: string;
  author: ApiUser;
  onAdded: () => void;
}) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = content.trim();
    if (!text || sending) return;

    setError("");
    setSending(true);

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        }
      );

      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as { message?: string };
        setError(result.message ?? "Le commentaire n’a pas pu être ajouté. Veuillez réessayer.");
        return;
      }

      setContent("");
      onAdded();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="pj-comment-form" onSubmit={handleSubmit}>
      <Avatar user={author} />
      <input
        type="text"
        value={content}
        maxLength={1000}
        placeholder="Ajouter un commentaire..."
        aria-label="Ajouter un commentaire"
        disabled={sending}
        onChange={(e) => setContent(e.target.value)}
      />
      <button type="submit" className="pj-comment-send" disabled={sending || !content.trim()}>
        {sending ? "Envoi..." : "Envoyer"}
      </button>
      {error && (
        <p className="pj-comment-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

function TaskItem({
  task,
  projectId,
  currentUser,
  canComment,
  onEdit,
  onDelete,
  onCommentAdded,
}: {
  task: ApiTask;
  projectId: string;
  currentUser: ApiUser;
  canComment: boolean;
  onEdit?: () => void; // absent = pas le droit de modifier
  onDelete?: () => void; // absent = pas le droit de supprimer
  onCommentAdded: () => void;
}) {
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
        {(onEdit || onDelete) && (
          <TaskMenu taskTitle={task.title} onEdit={onEdit} onDelete={onDelete} />
        )}
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
        <div id={panelId} className="pj-comments-panel">
          <ul className="pj-comments">
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

          {canComment && (
            <CommentForm
              projectId={projectId}
              taskId={task.id}
              author={currentUser}
              onAdded={onCommentAdded}
            />
          )}
        </div>
      )}
    </article>
  );
}

function ProjectDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useApi<{ project: ApiProjectDetail }>(
    `/api/projects/${encodeURIComponent(id)}`
  );
  const project = data?.project;

  const [view, setView] = useState<View>("liste");
  const [status, setStatus] = useState("ALL");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ApiTask | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [confirmingProjectDelete, setConfirmingProjectDelete] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [projectError, setProjectError] = useState("");
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();

  const tasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (project?.tasks ?? []).filter((t) => {
      if (status !== "ALL" && t.status !== status) return false;
      if (!q) return true;
      return [t.title, t.description ?? ""].some((s) => s.toLowerCase().includes(q));
    });
  }, [project, status, query]);

  if (loading || userLoading) {
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

  if (!user) {
    return (
      <main className="pj-page">
        <div className="pj-container">
          <Link href="/project" className="pj-icon-button" aria-label="Retour aux projets">
            <ArrowLeft size={16} aria-hidden />
          </Link>
          <p className="pj-state pj-state-error" role="alert">
            Impossible de vérifier votre compte. Veuillez vous reconnecter.
          </p>
        </div>
      </main>
    );
  }

  // Rôle de l'utilisateur dans ce projet : ni admin ni contributeur = pas d'accès
  const role = getProjectRole(project, user.id);
  const can = getPermissions(role);

  if (!role) {
    return (
      <main className="pj-page">
        <div className="pj-container">
          <Link href="/project" className="pj-icon-button" aria-label="Retour aux projets">
            <ArrowLeft size={16} aria-hidden />
          </Link>
          <p className="pj-state pj-state-error" role="alert">
            Vous n’avez pas accès à ce projet. Seuls ses administrateurs et ses contributeurs
            peuvent le consulter.
          </p>
        </div>
      </main>
    );
  }

  const team = buildTeam(project.owner, project.members);

  const projectId = project.id;

  async function handleDeleteProject() {
    if (deletingProject) return;
    setProjectError("");
    setDeletingProject(true);

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as { message?: string };
        setProjectError(result.message ?? "La suppression du projet a échoué. Veuillez réessayer.");
        setConfirmingProjectDelete(false);
        return;
      }

      router.replace("/project");
      router.refresh();
    } catch {
      setProjectError("Impossible de contacter le serveur.");
      setConfirmingProjectDelete(false);
    } finally {
      setDeletingProject(false);
    }
  }

  async function handleDelete(task: ApiTask) {
    if (deletingId) return; // évite les doubles clics
    setActionError("");
    setDeletingId(task.id);

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(task.id)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as { message?: string };
        setActionError(result.message ?? "La suppression a échoué. Veuillez réessayer.");
        return;
      }
      reload();
    } catch {
      setActionError("Impossible de contacter le serveur.");
    } finally {
      setDeletingId(null);
    }
  }

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
              {can.editProject && (
                <button
                  type="button"
                  className="pj-link-button"
                  onClick={() => setEditProjectOpen(true)}
                >
                  Modifier
                </button>
              )}
            </h1>
            <p className="pj-subtitle">{project.description ?? "Aucune description"}</p>
          </div>

          {can.createTask && (
            <div className="pj-detail-actions">
              <button
                type="button"
                className="pj-btn pj-btn-dark"
                onClick={() => setCreateOpen(true)}
              >
                Créer une tâche
              </button>
              <button
                type="button"
                className="pj-btn pj-btn-accent"
                onClick={() => setAiOpen(true)}
              >
                <Sparkles size={14} aria-hidden />
                IA
              </button>
            </div>
          )}
        </header>

        {/* Contributeurs */}
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
        </section>

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
              {actionError && (
                <p className="pj-state pj-state-error" role="alert">
                  {actionError}
                </p>
              )}
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    projectId={project.id}
                    currentUser={user}
                    canComment={can.comment}
                    onEdit={can.editTask ? () => setEditingTask(task) : undefined}
                    onDelete={can.deleteTask ? () => handleDelete(task) : undefined}
                    onCommentAdded={reload}
                  />
                ))
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

        {/* Suppression du projet (administrateurs uniquement) */}
        {can.deleteProject && (
          <section className="pj-danger" aria-label="Suppression du projet">
            {confirmingProjectDelete ? (
              <div className="pj-danger-confirm" role="group" aria-label="Confirmer la suppression">
                <p className="pj-danger-text">
                  Supprimer « {project.name} » et toutes ses tâches ? Cette action est irréversible.
                </p>
                <div className="pj-danger-actions">
                  <button
                    type="button"
                    className="pj-danger-btn pj-danger-btn-solid"
                    onClick={handleDeleteProject}
                    disabled={deletingProject}
                  >
                    {deletingProject ? "Suppression..." : "Oui, supprimer le projet"}
                  </button>
                  <button
                    type="button"
                    className="pj-danger-btn pj-danger-btn-cancel"
                    onClick={() => setConfirmingProjectDelete(false)}
                    disabled={deletingProject}
                    autoFocus
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="pj-danger-btn"
                onClick={() => {
                  setProjectError("");
                  setConfirmingProjectDelete(true);
                }}
              >
                <Trash2 size={14} aria-hidden />
                Supprimer le projet
              </button>
            )}

            {projectError && (
              <p className="pj-danger-error" role="alert">
                {projectError}
              </p>
            )}
          </section>
        )}
      </div>

      {can.editProject && editProjectOpen && (
        <EditProjectModal
          project={project}
          onClose={() => setEditProjectOpen(false)}
          onSaved={reload}
        />
      )}

      {can.createTask && aiOpen && (
        <AiTaskModal
          projectId={project.id}
          onClose={() => setAiOpen(false)}
          onCreated={reload}
        />
      )}

      {can.createTask && createOpen && (
        <CreateTaskModal
          projectId={project.id}
          members={team}
          onClose={() => setCreateOpen(false)}
          onCreated={reload}
        />
      )}

      {can.editTask && editingTask && (
        <EditTaskModal
          key={editingTask.id}
          projectId={project.id}
          task={editingTask}
          members={team}
          onClose={() => setEditingTask(null)}
          onSaved={reload}
        />
      )}
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