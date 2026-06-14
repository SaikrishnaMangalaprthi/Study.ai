import React, { useEffect, useState } from "react";
import api from "../utils/api";

const EMPTY_FORM = { name: "", target_percentage: 0 };

export default function HabitList() {
  const [habits, setHabits] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => { fetchHabits(); }, []);

  async function fetchHabits() {
    try {
      const { data } = await api.get("/habits/");
      setHabits(data);
    } catch {
      setError("Failed to load habits");
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    const payload = {
      name: form.name,
      target_percentage: Number(form.target_percentage) || 0,
    };
    try {
      if (editingId) {
        await api.put(`/habits/${editingId}`, payload);
        setEditingId(null);
        setSuccessMsg("Habit updated successfully!");
      } else {
        await api.post("/habits/", payload);
        setSuccessMsg("Habit created successfully!");
      }
      setForm(EMPTY_FORM);
      fetchHabits();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || "Save failed");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this habit? Check-in history will also be deleted.")) return;
    try {
      await api.delete(`/habits/${id}`);
      fetchHabits();
    } catch {
      setError("Delete failed");
    }
  }

  // Handle checking in for today
  async function handleCheckin(hId, checkedInAlready) {
    setError("");
    setSuccessMsg("");
    const todayStr = new Date().toISOString().split("T")[0];
    try {
      const res = await api.post(`/habits/${hId}/checkin`, {
        date: todayStr,
        completed: !checkedInAlready
      });
      fetchHabits();
      if (!checkedInAlready && res.data.xp > 0) {
        setSuccessMsg(`Checked in! Earned +10 XP! 🎉`);
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch {
      setError("Failed to record check-in.");
    }
  }

  function startEdit(h) {
    setEditingId(h.id);
    setForm({
      name: h.name,
      target_percentage: h.target_percentage || 0,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  const getWeeklyPercentage = (history) => {
    if (!history) return 0;
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    });
    const completed = last7Days.filter(date => history.includes(date)).length;
    return Math.round((completed / 7) * 100);
  };

  const getMonthlyPercentage = (history) => {
    if (!history) return 0;
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    });
    const completed = last30Days.filter(date => history.includes(date)).length;
    return Math.round((completed / 30) * 100);
  };

  const getMissedDays = (history) => {
    if (!history) return 0;
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    });
    const todayStr = new Date().toISOString().split("T")[0];
    const missed = last30Days.filter(date => date !== todayStr && !history.includes(date)).length;
    return missed;
  };

  const renderLast7Days = (history) => {
    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    return (
      <div className="flex gap-1 justify-between mt-1 p-2 bg-black/30 rounded-xl border border-white/5">
        {days.map((day, idx) => {
          const dateStr = day.toISOString().split("T")[0];
          const isCompleted = history && history.includes(dateStr);
          const isToday = dateStr === new Date().toISOString().split("T")[0];
          const label = day.toLocaleDateString("en-US", { weekday: "narrow" });
          
          return (
            <div key={idx} className="flex flex-col items-center flex-1 gap-1">
              <span className="text-[9px] text-gray-500 font-bold uppercase">{label}</span>
              <div
                className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                  isCompleted 
                    ? "bg-emerald-500/25 text-emerald-400 border border-emerald-500/35 shadow-sm" 
                    : isToday
                      ? "border border-dashed border-gray-400 text-gray-400"
                      : "bg-white/5 border border-white/5 text-gray-600"
                }`}
                title={dateStr}
              >
                {isCompleted ? "✓" : ""}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const streakIcon = (n) => {
    if (n >= 30) return "👑🔥🔥";
    if (n >= 7) return "🔥🔥";
    if (n >= 1) return "🔥";
    return "❄️";
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-100">Habit Tracking</h2>
        <span className="text-xs bg-secondary/20 text-secondary px-3 py-1 rounded-full border border-secondary/20 font-bold">
          Build consistency, earn XP badges
        </span>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-center text-sm font-medium">
          {successMsg}
        </div>
      )}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {habits.length === 0 && (
        <p className="text-gray-400 text-sm">No habits logged yet. Create one below!</p>
      )}

      {/* Habits Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {habits.map((h) => {
          const pct = Math.min(100, Math.max(0, h.target_percentage || 0));
          const checkedInToday = h.history && h.history.includes(todayStr);

          return (
            <div
              key={h.id}
              className={`bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between gap-4 ${
                checkedInToday ? "border-emerald-500/30 bg-emerald-500/5" : ""
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-100">{h.name}</h3>
                  <span className="text-2xl" title={`${h.streak} day streak`}>
                    {streakIcon(h.streak)}
                  </span>
                </div>
                
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>Current Streak: <strong className="text-orange-400">{h.streak}d</strong></span>
                  <span>Longest Streak: <strong className="text-yellow-400">{h.longest_streak || 0}d</strong></span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Target Consistency</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-secondary to-accent rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Consistency Stats & Missed Days */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-black/10 p-2 rounded-xl border border-white/5 text-gray-400">
                <div>
                  <span className="block font-semibold">Weekly</span>
                  <span className="text-gray-200 font-bold">{getWeeklyPercentage(h.history)}%</span>
                </div>
                <div>
                  <span className="block font-semibold">Monthly</span>
                  <span className="text-gray-200 font-bold">{getMonthlyPercentage(h.history)}%</span>
                </div>
                <div>
                  <span className="block font-semibold">Missed (30d)</span>
                  <span className="text-red-400 font-bold">{getMissedDays(h.history)}d</span>
                </div>
              </div>

              {/* 7-Day History Heatmap */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Check-in Tracker</span>
                {renderLast7Days(h.history)}
              </div>

              {/* Checkin button & details */}
              <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-3">
                <button
                  onClick={() => handleCheckin(h.id, checkedInToday)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    checkedInToday
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                      : "bg-secondary text-white hover:bg-secondary/95 shadow-md shadow-secondary/10"
                  }`}
                >
                  {checkedInToday ? "✓ Completed Today" : "Mark Complete Today"}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(h)}
                    className="px-2 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 rounded text-xs transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(h.id)}
                    className="px-2 py-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded text-xs transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="max-w-xl bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-gray-100">
          {editingId ? "✏️ Edit Habit Settings" : "🔥 Add New Habit"}
        </h3>

        <div className="space-y-1">
          <label className="text-xs text-gray-400">Habit Name</label>
          <input
            id="habit-name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Code 1 hour, Exercise, Review Vocabulary"
            required
            className="w-full rounded-xl px-4 py-2 bg-black/40 border border-white/10 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-400">Weekly Target Consistency % (0–100)</label>
          <input
            id="habit-target"
            name="target_percentage"
            type="number"
            min="0"
            max="100"
            value={form.target_percentage}
            onChange={handleChange}
            className="w-48 rounded-xl px-4 py-2 bg-black/40 border border-white/10 text-gray-200 focus:outline-none focus:border-primary text-xs"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            id="habit-submit"
            type="submit"
            className="flex-1 py-2 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-xl text-sm transition"
          >
            {editingId ? "Update Habit" : "Create Habit"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
