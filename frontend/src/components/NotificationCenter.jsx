import React, { useState, useEffect } from "react";
import api from "../utils/api";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState("All");

  const limit = 15;
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const categories = ["All", "Task", "Exam", "Achievement", "System"];

  useEffect(() => {
    loadNotifications(true);
  }, [categoryFilter]);

  async function loadNotifications(reset = false) {
    setLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      // FIX: pass category to backend so filtering works with pagination
      const categoryParam = categoryFilter !== "All" ? `&category=${categoryFilter}` : "";
      const res = await api.get(`/notifications/?limit=${limit}&offset=${currentOffset}${categoryParam}`);

      const newNotifs = res.data.notifications;
      setUnreadCount(res.data.unread_count);

      if (reset) {
        setNotifications(newNotifs);
        setOffset(newNotifs.length);
      } else {
        setNotifications(prev => [...prev, ...newNotifs]);
        setOffset(prev => prev + newNotifs.length);
      }
      setHasMore(newNotifs.length >= limit);
    } catch {
      setErrorMsg("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id) {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  }

  async function handleMarkAllRead() {
    try {
      await api.post("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      setSuccessMsg("All notifications marked as read!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setErrorMsg("Failed to mark notifications as read.");
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  }

  async function handleClearAll() {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    try {
      await api.delete("/notifications/");
      setNotifications([]);
      setUnreadCount(0);
      setSuccessMsg("Inbox cleared!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setErrorMsg("Failed to clear notifications.");
    }
  }

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case "Task": return "📝";
      case "Exam": return "🎓";
      case "Achievement": return "🏆";
      case "System": return "⚙️";
      default: return "🔔";
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-2">
            🔔 Notification Center
            {unreadCount > 0 && (
              <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-full font-bold">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-gray-400 text-sm mt-1">Inbox updates of streaks, milestones, tasks, and system events</p>
        </div>
        <div className="flex items-center gap-2 self-end">
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead}
              className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs font-bold rounded-lg transition">
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={handleClearAll}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/35 border border-red-500/30 text-red-400 text-xs font-bold rounded-lg transition">
              Clear inbox
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-center text-xs font-semibold">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-xl text-center text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 overflow-x-auto gap-1">
        {categories.map((c) => (
          <button key={c} onClick={() => setCategoryFilter(c)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
              categoryFilter === c ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-white"
            }`}>
            {c}
          </button>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        {loading && notifications.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-sm">Loading...</div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {notifications.map((n) => (
              <div key={n.id} onClick={() => !n.is_read && handleMarkRead(n.id)}
                className={`p-4 border rounded-xl flex items-start gap-4 transition relative ${
                  n.is_read
                    ? "bg-white/5 border-white/5 opacity-60"
                    : "bg-white/10 border-white/20 hover:bg-white/15 cursor-pointer shadow-md"
                }`}>
                {!n.is_read && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full animate-ping" />
                )}
                <span className="text-2xl bg-black/40 p-2.5 rounded-xl border border-white/5 flex items-center justify-center">
                  {getCategoryIcon(n.category)}
                </span>
                <div className="space-y-1 flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-200 text-sm">{n.title}</span>
                    <span className="text-[9px] bg-black/40 px-2 py-0.5 rounded text-gray-400">{n.category}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-gray-500 font-mono block mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                  className="text-gray-500 hover:text-red-400 text-xs transition" title="Delete">✕</button>
              </div>
            ))}

            {notifications.length === 0 && !loading && (
              <div className="text-center py-20 text-gray-500">
                <span className="text-3xl block mb-2">📬</span>
                <p className="text-sm">
                  {categoryFilter !== "All"
                    ? `No "${categoryFilter}" notifications found.`
                    : "Inbox is empty. Enjoy the peace and quiet!"}
                </p>
              </div>
            )}
          </div>
        )}

        {hasMore && !loading && notifications.length > 0 && (
          <button onClick={() => loadNotifications(false)}
            className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-300 font-bold transition">
            Load More
          </button>
        )}
        {loading && notifications.length > 0 && (
          <p className="text-center text-xs text-gray-400">Loading more...</p>
        )}
      </div>
    </div>
  );
}