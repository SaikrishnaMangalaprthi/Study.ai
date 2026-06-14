import React, { useEffect, useState } from "react";
import api from "../utils/api";

const EMPTY_FORM = {
  title: "",
  description: "",
  target_percent: 0,
  deadline: "",
  status: "Active"
};

const STATUS_STYLES = {
  Active: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  Completed: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  Overdue: "bg-red-500/20 text-red-400 border border-red-500/30",
};

export default function GoalList() {
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Quick milestones
  const [newMilestoneText, setNewMilestoneText] = useState({});

  useEffect(() => { fetchGoals(); }, []);

  async function fetchGoals() {
    try {
      const { data } = await api.get("/goals/");
      setGoals(data);
    } catch {
      setError("Failed to load goals");
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const payload = {
      title: form.title,
      description: form.description || "",
      target_percent: Number(form.target_percent) || 0,
      deadline: form.deadline || null,
      status: form.status
    };
    try {
      if (editingId) {
        await api.put(`/goals/${editingId}`, payload);
        setEditingId(null);
        setSuccessMsg("Goal updated successfully!");
      } else {
        await api.post("/goals/", payload);
        setSuccessMsg("Goal created successfully!");
      }
      setForm(EMPTY_FORM);
      fetchGoals();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || "Save failed");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this goal? Milestones will also be deleted.")) return;
    try {
      await api.delete(`/goals/${id}`);
      fetchGoals();
    } catch {
      setError("Delete failed");
    }
  }

  function startEdit(g) {
    setEditingId(g.id);
    setForm({
      title: g.title,
      description: g.description || "",
      target_percent: g.target_percent || 0,
      deadline: g.deadline ? g.deadline.split("T")[0] : "",
      status: g.status || "Active"
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  // Milestones CRUD inline
  async function handleAddMilestone(goalId) {
    const text = newMilestoneText[goalId] || "";
    if (!text.trim()) return;
    try {
      await api.post(`/goals/${goalId}/milestones`, { title: text.trim() });
      setNewMilestoneText(prev => ({ ...prev, [goalId]: "" }));
      fetchGoals();
    } catch {
      setError("Failed to add milestone");
    }
  }

  async function handleToggleMilestone(mId, currentStatus) {
    try {
      await api.put(`/goals/milestones/${mId}`, { completed: !currentStatus });
      fetchGoals();
    } catch {
      setError("Failed to update milestone status");
    }
  }

  async function handleDeleteMilestone(mId) {
    try {
      await api.delete(`/goals/milestones/${mId}`);
      fetchGoals();
    } catch {
      setError("Failed to delete milestone");
    }
  }

  const isOverdueGoal = (g) => {
    if (g.status === "Completed" || !g.deadline) return false;
    const dead = new Date(g.deadline);
    dead.setHours(23, 59, 59, 999);
    return dead < new Date();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-100">Study Goals</h2>
        <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/20 font-bold">
          {goals.filter(g => g.status === "Active").length} Active Target Goals
        </span>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-center text-sm font-medium">
          {successMsg}
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Goal cards */}
      {goals.length === 0 && (
        <p className="text-gray-400 text-sm">No goals yet. Create one below!</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((g) => {
          const overdue = isOverdueGoal(g);
          const currentStatus = overdue ? "Overdue" : g.status;
          const pct = Math.min(100, Math.max(0, g.target_percent || 0));
          return (
            <div
              key={g.id}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg hover:border-white/20 transition-all duration-300 hover:scale-[1.01] flex flex-col space-y-4"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${STATUS_STYLES[currentStatus] || STATUS_STYLES.Active}`}>
                    {currentStatus}
                  </span>
                  {g.deadline && (
                    <span className="text-[10px] text-gray-500">
                      📅 {new Date(g.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-100 mt-2">{g.title}</h3>
                {g.description && (
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{g.description}</p>
                )}
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Target Progress</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Milestones inline Checklist */}
              <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2 flex-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Milestones</span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {g.milestones && g.milestones.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-xs">
                      <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                        <input
                          type="checkbox"
                          checked={m.completed}
                          onChange={() => handleToggleMilestone(m.id, m.completed)}
                          className="rounded bg-black/40 border-white/10 text-primary focus:ring-0"
                        />
                        <span className={m.completed ? "line-through text-gray-500" : ""}>{m.title}</span>
                      </label>
                      <button
                        onClick={() => handleDeleteMilestone(m.id)}
                        className="text-gray-500 hover:text-red-400 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {(!g.milestones || g.milestones.length === 0) && (
                    <p className="text-[10px] text-gray-600">No milestones set</p>
                  )}
                </div>

                {/* Quick Add Milestone */}
                <div className="flex gap-2 pt-2 border-t border-white/5 mt-2">
                  <input
                    type="text"
                    placeholder="New milestone..."
                    value={newMilestoneText[g.id] || ""}
                    onChange={(e) => setNewMilestoneText(prev => ({ ...prev, [g.id]: e.target.value }))}
                    className="flex-1 bg-black/40 text-[10px] border border-white/10 rounded-lg px-2 py-1 text-gray-200"
                  />
                  <button
                    onClick={() => handleAddMilestone(g.id)}
                    className="px-2 py-1 bg-white/10 text-[10px] font-bold rounded-lg text-gray-300 hover:bg-white/20 transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex space-x-2 pt-2 border-t border-white/5">
                <button
                  id={`edit-goal-${g.id}`}
                  onClick={() => startEdit(g)}
                  className="px-3 py-1.5 text-xs bg-primary/20 hover:bg-primary/40 border border-primary/30 rounded-lg transition text-primary"
                >
                  Edit
                </button>
                <button
                  id={`delete-goal-${g.id}`}
                  onClick={() => handleDelete(g.id)}
                  className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/30 border border-red-500/20 rounded-lg transition text-red-400"
                >
                  Delete
                </button>
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
          {editingId ? "Edit Goal" : "Add New Goal"}
        </h3>

        <div className="space-y-1">
          <label className="text-xs text-gray-400">Goal Title</label>
          <input
            id="goal-title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Master React Hooks"
            required
            className="w-full rounded-xl px-4 py-2 bg-black/40 border border-white/10 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-400">Description (Optional)</label>
          <textarea
            id="goal-description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Details of what this goal entails..."
            rows={2}
            className="w-full rounded-xl px-4 py-2 bg-black/40 border border-white/10 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary text-xs"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Target % (0–100)</label>
            <input
              id="goal-target"
              name="target_percent"
              type="number"
              min="0"
              max="100"
              value={form.target_percent}
              onChange={handleChange}
              className="w-full rounded-xl px-3 py-1.5 bg-black/40 border border-white/10 text-gray-200 focus:outline-none focus:border-primary text-xs"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-xl px-3 py-1.5 bg-black/40 border border-white/10 text-gray-200 focus:outline-none focus:border-primary text-xs"
            >
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Deadline</label>
            <input
              id="goal-deadline"
              name="deadline"
              type="date"
              value={form.deadline}
              onChange={handleChange}
              className="w-full rounded-xl px-3 py-1.5 bg-black/40 border border-white/10 text-gray-200 focus:outline-none focus:border-primary text-xs"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            id="goal-submit"
            type="submit"
            className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm transition"
          >
            {editingId ? "Update Goal" : "Create Goal"}
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
