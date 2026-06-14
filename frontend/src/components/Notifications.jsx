import React, { useEffect, useState } from "react";
import api from "../utils/api";
import EmptyState from "./EmptyState";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { fetchNotifications(); }, []);

  async function fetchNotifications() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/notifications/");
      setNotifications(data.notifications);
    } catch (err) {
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id) {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch {
      setError("Could not mark notification read.");
    }
  }

  async function clearAll() {
    try {
      await api.delete("/notifications/");
      setNotifications([]);
    } catch {
      setError("Could not clear notifications.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Notifications</h1>
          <p className="text-gray-400">Keep track of unread reminders, achievements, and updates.</p>
        </div>
        <button
          onClick={clearAll}
          className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
        >
          Clear all
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="h-32 animate-pulse rounded-3xl bg-white/5" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No notifications yet"
          description="You’re all caught up. Check back later for reminders, achievements, and productivity alerts."
        />
      ) : (
        <div className="grid gap-4">
          {notifications.map((note) => (
            <div
              key={note.id}
              className={`rounded-3xl border px-5 py-4 transition ${note.is_read ? "border-white/10 bg-white/5" : "border-primary/30 bg-primary/10 shadow-md"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-400">{note.category}</p>
                  <h2 className="mt-2 text-lg font-semibold text-gray-100">{note.title}</h2>
                </div>
                <span className="text-xs text-gray-400">{new Date(note.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-300">{note.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {!note.is_read && (
                  <button
                    onClick={() => markRead(note.id)}
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-white transition hover:bg-white/15"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
