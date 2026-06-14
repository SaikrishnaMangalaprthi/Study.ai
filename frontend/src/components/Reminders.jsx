import React, { useEffect, useState } from "react";
import api from "../utils/api";

const REPEAT_OPTIONS = ["None", "Daily", "Weekly", "Monthly", "Custom"];

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [title, setTitle] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [repeat, setRepeat] = useState("None");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadReminders();
  }, []);

  async function loadReminders() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/reminders/");
      setReminders(res.data);
    } catch (err) {
      setError("Unable to load reminders.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Enter a reminder title.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await api.post("/reminders/", {
        title: title.trim(),
        remind_at: remindAt || null,
        repeat: repeat || "None"
      });
      setTitle("");
      setRemindAt("");
      setRepeat("None");
      setSuccess("Reminder saved.");
      loadReminders();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to save reminder.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/reminders/${id}`);
      setReminders((prev) => prev.filter((item) => item.id !== id));
      setSuccess("Reminder deleted.");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Could not delete reminder.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Reminders</h1>
        <p className="text-gray-400 text-sm mt-1">Create and manage study reminders for deadlines, review sessions, and habit checks.</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-xl text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 p-4 rounded-xl text-sm">{success}</div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSave} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Add a reminder</h2>
            <p className="text-xs text-gray-400 mt-1">Schedule a quick task reminder or recurring study alert.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1 text-sm">
              <label className="block text-gray-300">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Review math notes"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1 text-sm">
              <label className="block text-gray-300">When</label>
              <input
                type="datetime-local"
                value={remindAt}
                onChange={(e) => setRemindAt(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1 text-sm">
              <label className="block text-gray-300">Repeat</label>
              <select
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100 focus:outline-none focus:border-primary"
              >
                {REPEAT_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/95 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save reminder"}
          </button>
        </form>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Upcoming reminders</h2>
              <p className="text-xs text-gray-400 mt-1">Keep your study plan on schedule with deadlines and review nudges.</p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gray-400">
              {reminders.length} items
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="h-20 rounded-3xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-4">🛎️</div>
              <p className="text-sm">No reminders yet. Add one to stay on top of your study plan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.map((item) => (
                <div key={item.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-100">{item.title}</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {item.remind_at ? new Date(item.remind_at).toLocaleString() : "No time set"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-full border border-white/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 transition"
                    >
                      Delete
                    </button>
                  </div>
                  {item.repeat && item.repeat !== "None" && (
                    <span className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-[10px] text-primary">
                      {item.repeat}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
