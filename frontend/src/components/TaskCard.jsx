import React from "react";

export default function TaskCard({ task, onEdit, onDelete, onComplete }) {
  const PRIORITY_STYLES = {
    High: "bg-red-500/10 text-red-300 border-red-500/15",
    Medium: "bg-amber-500/10 text-amber-200 border-amber-500/15",
    Low: "bg-emerald-500/10 text-emerald-200 border-emerald-500/15",
  };

  const STATUS_STYLES = {
    Pending: "bg-slate-700/70 text-slate-200 border-slate-600/70",
    "In Progress": "bg-blue-500/10 text-blue-200 border-blue-500/20",
    Completed: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
  };

  const overdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "Completed";
  const cardStyle = task.status === "Completed"
    ? "border-emerald-500/20 bg-emerald-500/5 opacity-80"
    : overdue
      ? "border-red-500/20 bg-red-500/10"
      : "border-white/10 bg-slate-950/80";

  const progressWidth = Math.min(Math.max(task.progress_pct || 0, 0), 100);

  return (
    <div className={`rounded-[22px] border p-5 shadow-soft transition duration-300 hover:-translate-y-0.5 ${cardStyle}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full border px-3 py-1.5 ${PRIORITY_STYLES[task.priority || "Medium"]}`}>
              {task.priority || "Medium"}
            </span>
            <span className={`rounded-full border px-3 py-1.5 ${STATUS_STYLES[task.status || "Pending"]}`}>
              {task.status || "Pending"}
            </span>
            {task.recurrence && task.recurrence !== "None" && (
              <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-indigo-200">
                🔁 {task.recurrence}
              </span>
            )}
          </div>
          <h3 className={`text-xl font-semibold ${task.status === "Completed" ? "line-through text-slate-400" : "text-white"}`}>
            {task.title}
          </h3>
          {task.description && <p className="text-sm leading-6 text-slate-400">{task.description}</p>}
          <div className="flex flex-wrap gap-2 items-center text-xs text-slate-400">
            {task.subject && (
              <span className="rounded-2xl bg-slate-900/80 px-3 py-1.5 text-slate-200">
                {task.subject}
              </span>
            )}
            {task.due_date && (
              <span className="rounded-2xl bg-slate-900/80 px-3 py-1.5 text-slate-200">
                📅 {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="mt-4 overflow-hidden rounded-full bg-slate-900/80 h-2.5">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400" style={{ width: `${progressWidth}%` }} />
          </div>
          <div className="pt-1 text-right text-[11px] uppercase tracking-[0.24em] text-slate-500">
            {progressWidth}% complete
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <button
            type="button"
            onClick={() => onComplete(task)}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/15 transition"
          >
            ✅ Complete
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 transition"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300 hover:bg-red-500/20 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
