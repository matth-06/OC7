"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckSquare,
  FolderOpen,
  KanbanSquare,
  MessageSquare,
  Search,
} from "lucide-react";
import "./dashboard.css";

type Task = {
  id: string;
  name: string;
  description: string;
  project: string;
  date: string;
  comments: number;
  status: string;
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminée",
  CANCELLED: "Annulée",
};

const STATUS_CLASSES: Record<string, string> = {
  TODO: "task-status-todo",
  IN_PROGRESS: "task-status-in-progress",
  DONE: "task-status-done",
  CANCELLED: "task-status-cancelled",
};

// Colonnes de la vue Kanban (les tâches annulées n'y sont pas affichées)
const KANBAN_COLUMNS: { status: string; title: string }[] = [
  { status: "TODO", title: "À faire" },
  { status: "IN_PROGRESS", title: "En cours" },
  { status: "DONE", title: "Terminées" },
];

type AssignedTaskResponse = {
  data?: {
    tasks?: {
      id: string;
      title: string;
      description: string | null;
      status: string;
      dueDate: string | null;
      project: { name: string };
      comments: unknown[];
    }[];
  };
  message?: string;
};

type View = "liste" | "kanban";

function formatDueDate(dueDate: string | null) {
  if (!dueDate) return "Sans échéance";

  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return "Date invalide";

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`dashboard-tab ${active ? "dashboard-tab-active" : ""}`}
    >
      {icon}
      {children}
    </button>
  );
}

function TaskStatus({ status }: { status: string }) {
  return (
    <span className={`task-status ${STATUS_CLASSES[status] ?? "task-status-unknown"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function TaskMeta({ task }: { task: Task }) {
  return (
    <ul className="task-card-meta">
      <li className="task-card-meta-item">
        <FolderOpen className="task-meta-icon" aria-hidden />
        {task.project}
      </li>
      <li aria-hidden className="task-card-meta-divider" />
      <li className="task-card-meta-item">
        <CalendarDays className="task-meta-icon" aria-hidden />
        {task.date}
      </li>
      <li aria-hidden className="task-card-meta-divider" />
      <li className="task-card-meta-item">
        <MessageSquare className="task-meta-icon task-meta-icon-comments" aria-hidden />
        <span className="dashboard-sr-only">Commentaires :</span>
        {task.comments}
      </li>
    </ul>
  );
}

/* Carte horizontale (vue Liste) */
function TaskCard({ task }: { task: Task }) {
  return (
    <article className="task-card">
      <div className="task-card-details">
        <div>
          <h3 className="task-card-title">{task.name}</h3>
          <p className="task-card-description">{task.description}</p>
        </div>
        <TaskMeta task={task} />
      </div>

      <div className="task-card-actions">
        <TaskStatus status={task.status} />
        <button type="button" className="task-view-button">
          Voir
        </button>
      </div>
    </article>
  );
}

/* Carte verticale (vue Kanban) */
function KanbanCard({ task }: { task: Task }) {
  return (
    <article className="kanban-card">
      <div className="kanban-card-top">
        <h3 className="kanban-card-title">{task.name}</h3>
        <TaskStatus status={task.status} />
      </div>
      <p className="kanban-card-description">{task.description}</p>
      <div className="kanban-card-meta">
        <TaskMeta task={task} />
      </div>
      <div className="kanban-card-footer">
        <button type="button" className="task-view-button">
          Voir
        </button>
      </div>
    </article>
  );
}

function KanbanColumn({ title, tasks }: { title: string; tasks: Task[] }) {
  return (
    <section className="kanban-column" aria-label={title}>
      <header className="kanban-column-header">
        <h2 className="kanban-column-title">{title}</h2>
        <span className="kanban-column-count">{tasks.length}</span>
      </header>
      <div className="kanban-column-list">
        {tasks.length > 0 ? (
          tasks.map((task) => <KanbanCard key={task.id} task={task} />)
        ) : (
          <p className="kanban-column-empty">Aucune tâche</p>
        )}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const [view, setView] = useState<View>("liste");
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadTasks() {
      try {
        const response = await fetch("/api/dashboard/assigned-tasks", {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = (await response.json()) as AssignedTaskResponse;

        if (!response.ok) {
          throw new Error(result.message ?? "Impossible de charger vos tâches.");
        }
        if (!Array.isArray(result.data?.tasks)) {
          throw new Error("La réponse du serveur ne contient pas de liste de tâches.");
        }

        setTasks(
          result.data.tasks.map((task) => ({
            id: task.id,
            name: task.title,
            description: task.description ?? "Aucune description",
            project: task.project.name,
            date: formatDueDate(task.dueDate),
            comments: task.comments.length,
            status: task.status,
          }))
        );
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Impossible de charger vos tâches."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadTasks();
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) =>
      [t.name, t.description, t.project].some((s) => s.toLowerCase().includes(q)),
    );
  }, [query, tasks]);

  const isKanban = view === "kanban";

  return (
    <main className="dashboard-page">
      <div
        className={`dashboard-container ${isKanban ? "dashboard-container-kanban" : ""}`}
      >
        {/* En-tête */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Tableau de bord</h1>
            <p className="dashboard-greeting">
              Bonjour Alice Dupont, voici un aperçu de vos projets et tâches
            </p>
          </div>
          <button type="button" className="dashboard-create-button">
            + Créer un projet
          </button>
        </header>

        {/* Onglets */}
        <div className="dashboard-tabs" role="group" aria-label="Mode d’affichage">
          <TabButton
            active={view === "liste"}
            onClick={() => setView("liste")}
            icon={<CheckSquare className="dashboard-tab-icon" aria-hidden />}
          >
            Liste
          </TabButton>
          <TabButton
            active={view === "kanban"}
            onClick={() => setView("kanban")}
            icon={<KanbanSquare className="dashboard-tab-icon" aria-hidden />}
          >
            Kanban
          </TabButton>
        </div>

        {isKanban ? (
          /* Vue Kanban */
          loading ? (
            <p className="dashboard-empty-state" role="status">
              Chargement des tâches...
            </p>
          ) : error ? (
            <p className="dashboard-error-state" role="alert">
              {error}
            </p>
          ) : (
            <div className="kanban-board">
              {KANBAN_COLUMNS.map(({ status, title }) => (
                <KanbanColumn
                  key={status}
                  title={title}
                  tasks={tasks.filter((t) => t.status === status)}
                />
              ))}
            </div>
          )
        ) : (
          /* Vue Liste */
          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <h2 className="dashboard-panel-title">Mes tâches assignées</h2>
                <p className="dashboard-panel-subtitle">Par ordre de priorité</p>
              </div>

              <label className="dashboard-search">
                <span className="dashboard-sr-only">Rechercher une tâche</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher une tâche"
                  className="dashboard-search-input"
                />
                <Search className="dashboard-search-icon" aria-hidden />
              </label>
            </div>

            <div className="dashboard-task-list">
              {loading ? (
                <p className="dashboard-empty-state" role="status">
                  Chargement des tâches...
                </p>
              ) : error ? (
                <p className="dashboard-error-state" role="alert">
                  {error}
                </p>
              ) : filtered.length > 0 ? (
                filtered.map((task) => <TaskCard key={task.id} task={task} />)
              ) : (
                <p className="dashboard-empty-state">
                  {tasks.length === 0
                    ? "Aucune tâche ne vous est assignée."
                    : "Aucune tâche ne correspond à votre recherche."}
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}