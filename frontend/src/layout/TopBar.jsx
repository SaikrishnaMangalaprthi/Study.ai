import React from "react";
import { Link } from "react-router-dom";

export default function TopBar({ onMenuToggle, userName, onLogout }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950/80 px-6 py-4 shadow-sm backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-slate-300 hover:bg-white/10 md:hidden"
          aria-label="Open navigation"
        >
          ☰
        </button>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Good afternoon</p>
          <h2 className="text-2xl font-semibold text-white">Welcome back, {userName || "Learner"}</h2>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-between gap-3 sm:justify-end">
        <Link
          to="/tasks"
          className="hidden sm:inline-flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 hover:bg-white/10 transition"
        >
          + Quick Add
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/tasks" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-slate-300 hover:bg-white/10 transition" aria-label="Search">
            🔍
          </Link>
          <Link to="/notifications" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-slate-300 hover:bg-white/10 transition" aria-label="Notifications">
            🔔
          </Link>
          <Link to="/profile" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-slate-300 hover:bg-white/10 transition" aria-label="Profile">
            👤
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="hidden sm:inline-flex rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200 hover:bg-red-500/20 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
