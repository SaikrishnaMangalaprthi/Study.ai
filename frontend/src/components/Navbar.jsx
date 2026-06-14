import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../utils/api";

const MAIN_LINKS = [
  { to: "/", label: "Dashboard", icon: "🏠" },
  { to: "/calendar", label: "Calendar", icon: "📅" },
  { to: "/tasks", label: "Tasks", icon: "✅" },
  { to: "/study", label: "Focus", icon: "⏱️" },
  { to: "/notes", label: "Notes", icon: "📓" },
];

const MORE_LINKS = [
  { to: "/goals", label: "Goals", icon: "🎯" },
  { to: "/habits", label: "Habits", icon: "🔥" },
  { to: "/exams", label: "Exams", icon: "📋" },
  { to: "/scores", label: "Scores", icon: "📊" },
  { to: "/health", label: "Health", icon: "🏃" },
  { to: "/reminders", label: "Reminders", icon: "⏰" },
  { to: "/analytics", label: "Analytics", icon: "📈" },
  { to: "/achievements", label: "Achievements", icon: "🏆" },
];

export default function Navbar({ userName, onLogout }) {
  const location = useLocation();
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Apply themes
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  // Fetch unread notifications
  useEffect(() => {
    async function checkNotifications() {
      try {
        const res = await api.get("/notifications/?limit=1");
        setUnreadCount(res.data.unread_count);
      } catch {}
    }
    checkNotifications();
    const interval = setInterval(checkNotifications, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="bg-white/5 backdrop-blur-md border-b border-white/10 px-4 py-3 relative z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-xl font-extrabold text-primary tracking-tight">
          study.ai
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center space-x-1">
          {MAIN_LINKS.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-primary text-white"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="mr-1">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}

          {/* More Tools Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setMoreDropdownOpen(!moreDropdownOpen);
                setProfileDropdownOpen(false);
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition flex items-center gap-1"
            >
              <span>⚙️ More</span>
              <span>▾</span>
            </button>

            {moreDropdownOpen && (
              <div className="absolute top-10 left-0 w-48 bg-darkBg border border-white/10 rounded-xl shadow-2xl p-1.5 space-y-0.5">
                {MORE_LINKS.map((link) => {
                  const active = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMoreDropdownOpen(false)}
                      className={`block px-3 py-2 rounded-lg text-xs font-semibold transition ${
                        active
                          ? "bg-primary text-white"
                          : "text-gray-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <span className="mr-2">{link.icon}</span>
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-3">
          {/* Notifications Icon with Badge */}
          <Link
            to="/notifications"
            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition relative"
            title="Notification Center"
          >
            <span>🔔</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
            title="Toggle Light/Dark Theme"
          >
            {dark ? "☀️" : "🌙"}
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setMoreDropdownOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium text-gray-200 transition"
            >
              <span>👤</span>
              <span className="hidden sm:block text-xs truncate max-w-[80px]">
                {userName || "Profile"}
              </span>
              <span>▾</span>
            </button>

            {profileDropdownOpen && (
              <div className="absolute top-10 right-0 w-40 bg-darkBg border border-white/10 rounded-xl shadow-2xl p-1.5 space-y-0.5">
                <Link
                  to="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="block px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition"
                >
                  👤 View Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="block px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition"
                >
                  ⚙️ Settings
                </Link>
                <div className="border-t border-white/5 my-1" />
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu hamburger toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-300 hover:bg-white/10 transition"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu panel */}
      {menuOpen && (
        <div className="md:hidden mt-3 pb-3 border-t border-white/10 pt-2 flex flex-col space-y-1 overflow-y-auto max-h-[350px]">
          <p className="text-[9px] uppercase font-bold text-gray-500 px-3 py-1 tracking-wider">Main</p>
          {MAIN_LINKS.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  active ? "bg-primary text-white" : "text-gray-300 hover:bg-white/10"
                }`}
              >
                {link.icon} {link.label}
              </Link>
            );
          })}

          <p className="text-[9px] uppercase font-bold text-gray-500 px-3 py-1 tracking-wider mt-2">More Tools</p>
          {MORE_LINKS.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  active ? "bg-primary text-white" : "text-gray-300 hover:bg-white/10"
                }`}
              >
                {link.icon} {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
