import React from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_SECTIONS = [
  {
    title: "HOME",
    items: [
      { to: "/", label: "Dashboard", icon: "🏠" }
    ]
  },
  {
    title: "PRODUCTIVITY",
    items: [
      { to: "/tasks", label: "Tasks", icon: "✅" },
      { to: "/goals", label: "Goals", icon: "🎯" },
      { to: "/habits", label: "Habits", icon: "🔥" },
      { to: "/reminders", label: "Reminders", icon: "⏰" }
    ]
  },
  {
    title: "ACADEMICS",
    items: [
      { to: "/notes", label: "Notes", icon: "📚" },
      { to: "/exams", label: "Exams", icon: "📝" },
      { to: "/scores", label: "Performance", icon: "📊" }
    ]
  },
  {
    title: "FOCUS",
    items: [
      { to: "/study", label: "Focus Sessions", icon: "⏳" },
      { to: "/calendar", label: "Calendar", icon: "📅" }
    ]
  },
  {
    title: "INSIGHTS",
    items: [
      { to: "/analytics", label: "Analytics", icon: "📈" },
      { to: "/achievements", label: "Achievements", icon: "🏆" },
      { to: "/health", label: "Health", icon: "❤️" }
    ]
  }
];

const FOOTER_ITEMS = [
  { to: "/settings", label: "Settings", icon: "⚙" },
  { to: "/profile", label: "Profile", icon: "👤" }
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-slate-950 border-r border-white/10 shadow-xl transition-transform duration-300 md:fixed md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="flex h-full flex-col justify-between overflow-hidden bg-slate-950">
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">study.ai</p>
              <h1 className="mt-3 text-2xl font-semibold text-white">Study OS</h1>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-slate-300 hover:bg-white/10 md:hidden"
            >
              ✕
            </button>
          </div>

          <div className="space-y-5">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {section.title}
                </p>
                <div className="space-y-1 rounded-3xl bg-slate-900/60 p-2">
                  {section.items.map((item) => {
                    const active = location.pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                          active
                            ? "bg-slate-800 text-white shadow-soft"
                            : "text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span className="text-base">{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 p-6">
          <div className="space-y-3">
            {FOOTER_ITEMS.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
