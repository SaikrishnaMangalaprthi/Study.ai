import React, { useEffect, useState } from "react";
import api from "../utils/api";
import Modal from "./Modal";
import TaskCard from "./TaskCard";
import EmptyState from "./EmptyState";

const EMPTY_FORM = {
  title: "",
  description: "",
  priority: "Medium",
  subject: "",
  due_date: "",
  status: "Pending",
  recurrence: "None",
  progress_pct: 0,
  subject_id: "",
  category_id: "",
  parent_id: ""
};

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Search, Filters & Sorting
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [sortBy, setSortBy] = useState("due_date");
  const [sortDir, setSortDir] = useState("asc");

  // Category and subject creation
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState("#3b82f6");

  // Form & edit state
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [presetTag, setPresetTag] = useState("");

  const formatDate = (date) => date.toISOString().split("T")[0];

const applyPreset = (presetType) => {
  const getOffsetDate = (daysOffset) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysOffset);
    return formatDate(targetDate);
  };

  const values = {
    focus: { due_date: getOffsetDate(1) },
    review: { due_date: getOffsetDate(7) },
    project: { due_date: getOffsetDate(30) }
  };

  const selectedValues = values[presetType];
  if (selectedValues) {
    setFormValues(prev => ({ ...prev, ...selectedValues }));
  }
};

  useEffect(() => {
    loadData();
  }, [search, filterPriority, filterStatus, filterSubjectId, filterCategoryId, sortBy, sortDir]);

  async function loadData() {
    try {
      let queryStr = `?search=${encodeURIComponent(search)}&sort_by=${sortBy}&sort_dir=${sortDir}&root_only=true`;
      if (filterPriority) queryStr += `&priority=${filterPriority}`;
      if (filterStatus) queryStr += `&status=${filterStatus}`;
      if (filterSubjectId) queryStr += `&subject_id=${filterSubjectId}`;
      if (filterCategoryId) queryStr += `&category_id=${filterCategoryId}`;

      const [tasksRes, subjectsRes, categoriesRes] = await Promise.all([
        api.get(`/tasks/${queryStr}`),
        api.get("/subjects/"),
        api.get("/categories/")
      ]);

      setTasks(tasksRes.data);
      setSubjects(subjectsRes.data);
      setCategories(categoriesRes.data);
    } catch {
      setError("Failed to load planner data.");
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (["priority", "status", "recurrence", "due_date"].includes(name)) {
      setPresetTag("");
    }
  };

  function openModal(task = null) {
    if (task) {
      startEdit(task);
    } else {
      setEditingId(null);
      setForm(EMPTY_FORM);
      setModalOpen(true);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setPresetTag("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    
    const payload = {
      title: form.title,
      description: form.description || "",
      priority: form.priority,
      subject: form.subject || "",
      due_date: form.due_date || null,
      status: form.status,
      recurrence: form.recurrence,
      progress_pct: parseInt(form.progress_pct),
      parent_id: form.parent_id ? parseInt(form.parent_id) : null,
      subject_id: form.subject_id ? parseInt(form.subject_id) : null,
      category_id: form.category_id ? parseInt(form.category_id) : null
    };

    try {
      if (editingId) {
        const res = await api.put(`/tasks/${editingId}`, payload);
        if (res.data.xp_earned > 0) {
          setSuccessMsg(`Task updated! Earned +${res.data.xp_earned} XP! 🎉`);
        } else {
          setSuccessMsg("Task updated successfully.");
        }
        setEditingId(null);
      } else {
        await api.post("/tasks/", payload);
        setSuccessMsg("Task created successfully!");
      }
      setForm(EMPTY_FORM);
      closeModal();
      loadData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.msg || "Save failed – check input parameters.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this task? Any subtasks will also be deleted.")) return;
    try {
      await api.delete(`/tasks/${id}`);
      loadData();
    } catch {
      setError("Delete failed.");
    }
  }

  async function handleQuickComplete(task) {
    try {
      const res = await api.put(`/tasks/${task.id}`, { status: "Completed", progress_pct: 100 });
      if (res.data.xp_earned > 0) {
        setSuccessMsg(`Task completed! Earned +${res.data.xp_earned} XP! 🎉`);
        setTimeout(() => setSuccessMsg(""), 4000);
      }
      loadData();
    } catch {
      setError("Failed to update status.");
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await api.post("/categories/", { name: newCategoryName });
      setNewCategoryName("");
      const res = await api.get("/categories/");
      setCategories(res.data);
    } catch {
      setError("Failed to create category");
    }
  }

  async function handleAddSubject(e) {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    try {
      await api.post("/subjects/", { name: newSubjectName, color: newSubjectColor });
      setNewSubjectName("");
      const res = await api.get("/subjects/");
      setSubjects(res.data);
    } catch {
      setError("Failed to create subject");
    }
  }

  function startEdit(task) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority || "Medium",
      subject: task.subject || "",
      due_date: task.due_date || "",
      status: task.status || "Pending",
      recurrence: task.recurrence || "None",
      progress_pct: task.progress_pct || 0,
      subject_id: task.subject_id || "",
      category_id: task.category_id || "",
      parent_id: task.parent_id || ""
    });
    setModalOpen(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    closeModal();
  }

  const isOverdue = (task) => {
    if (task.status === "Completed" || !task.due_date) return false;
    const due = new Date(task.due_date);
    due.setHours(23, 59, 59, 999);
    return due < new Date();
  };

  const today = new Date();
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  const dueTodayTasks = tasks.filter((task) => {
    if (!task.due_date || task.status === "Completed") return false;
    const dueDate = new Date(task.due_date);
    return dueDate >= startOfToday && dueDate <= endOfToday;
  });

  const upcomingTasks = tasks.filter((task) => {
    if (!task.due_date || task.status === "Completed") return false;
    const dueDate = new Date(task.due_date);
    return dueDate > endOfToday;
  });

  const backlogTasks = tasks.filter((task) => !task.due_date && task.status !== "Completed");
  const completedTasks = tasks.filter((task) => task.status === "Completed");

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Task Management</h1>
          <p className="text-gray-400 text-sm mt-1">Organize, schedule, and execute study tasks</p>
        </div>
        
        {/* Statistics count */}
        <div className="flex gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-gray-500/20 border border-white/5 text-gray-400">
            {tasks.filter(t => t.status === "Pending").length} Pending
          </span>
          <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/10 text-blue-300">
            {tasks.filter(t => t.status === "In Progress").length} Progressing
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-center text-sm font-medium">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-xl text-center text-sm font-medium">
          {error}
        </div>
      )}

      {/* FOCUS CONTROL STRIP */}
      <div className="bg-slate-950/75 border border-white/10 rounded-3xl p-4 shadow-inner">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3 min-w-0">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
              <input
                type="text"
                placeholder="Search tasks"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-2.5 pl-11 pr-3 text-sm text-gray-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-2xl bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="rounded-2xl bg-slate-900/80 border border-white/10 px-3 py-2 text-sm text-gray-200 focus:outline-none"
            >
              <option value="">Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-2xl bg-slate-900/80 border border-white/10 px-3 py-2 text-sm text-gray-200 focus:outline-none"
            >
              <option value="">Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="hidden xl:inline-flex rounded-2xl bg-slate-900/80 border border-white/10 px-3 py-2 text-sm text-gray-200 focus:outline-none"
            >
              <option value="">Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <select
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              className="hidden xl:inline-flex rounded-2xl bg-slate-900/80 border border-white/10 px-3 py-2 text-sm text-gray-200 focus:outline-none"
            >
              <option value="">Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <div className="flex items-center gap-2 rounded-2xl bg-slate-900/80 border border-white/10 px-2 py-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm text-gray-200 outline-none"
              >
                <option value="due_date">Due</option>
                <option value="priority">Priority</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDir(prev => prev === "asc" ? "desc" : "asc")}
                className="rounded-2xl bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
              >
                {sortDir === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TASK FEED */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="text-center py-20 text-gray-500">Retrieving task logs...</div>
          ) : tasks.length === 0 ? (
            <EmptyState
              icon="🗂️"
              title="No tasks in your workflow yet"
              description="Click 'New Task' to capture your next study priority and keep momentum in one place."
            />
          ) : (
            <div className="space-y-6 overflow-y-auto max-h-[680px] pr-1">
              <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Due Today</h2>
                    <p className="text-sm text-gray-400">Stay focused on what closes today.</p>
                  </div>
                  <span className="rounded-2xl bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200">{dueTodayTasks.length} tasks</span>
                </div>
                <div className="mt-4 space-y-4">
                  {dueTodayTasks.length ? (
                    dueTodayTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={openModal}
                        onDelete={handleDelete}
                        onComplete={handleQuickComplete}
                      />
                    ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/50 p-6 text-center text-sm text-gray-500">
                      No deadlines for today — use this moment to make progress on a backlog item.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Upcoming</h2>
                    <p className="text-sm text-gray-400">Prepare for the next set of milestones.</p>
                  </div>
                  <span className="rounded-2xl bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">{upcomingTasks.length} tasks</span>
                </div>
                <div className="mt-4 space-y-4">
                  {upcomingTasks.length ? (
                    upcomingTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={openModal}
                        onDelete={handleDelete}
                        onComplete={handleQuickComplete}
                      />
                    ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/50 p-6 text-center text-sm text-gray-500">
                      No upcoming deadlines yet — this is a great time to clear a backlog item.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Backlog</h2>
                    <p className="text-sm text-gray-400">Capture tasks that need a plan but no deadline yet.</p>
                  </div>
                  <span className="rounded-2xl bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-200">{backlogTasks.length} tasks</span>
                </div>
                <div className="mt-4 space-y-4">
                  {backlogTasks.length ? (
                    backlogTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={openModal}
                        onDelete={handleDelete}
                        onComplete={handleQuickComplete}
                      />
                    ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/50 p-6 text-center text-sm text-gray-500">
                      No backlog items. Add a task and assign a due date later when you're ready.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Completed</h2>
                    <p className="text-sm text-gray-400">Review finished tasks and keep the momentum going.</p>
                  </div>
                  <span className="rounded-2xl bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">{completedTasks.length} tasks</span>
                </div>
                <div className="mt-4 space-y-4">
                  {completedTasks.length ? (
                    completedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={openModal}
                        onDelete={handleDelete}
                        onComplete={handleQuickComplete}
                      />
                    ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/50 p-6 text-center text-sm text-gray-500">
                      No completed tasks yet. Mark a task complete to celebrate progress.
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* WORKFLOW ACTIONS */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-100">Task workflow hub</h3>
                <p className="text-sm text-gray-400 mt-1">Plan your next study burst, surface priorities, and build habits without leaving the page.</p>
              </div>

              <button
                type="button"
                onClick={() => openModal()}
                className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-primary/20 transition hover:bg-primary/90"
              >
                + New Task
              </button>

              <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                <div className="rounded-3xl bg-slate-950/50 p-4 border border-white/10">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Pending</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{tasks.filter((t) => t.status === "Pending").length}</p>
                </div>
                <div className="rounded-3xl bg-slate-950/50 p-4 border border-white/10">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">In progress</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{tasks.filter((t) => t.status === "In Progress").length}</p>
                </div>
                <div className="rounded-3xl bg-slate-950/50 p-4 border border-white/10 col-span-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Next due</p>
                  <p className="mt-2 text-sm text-gray-300">{tasks.filter((t) => t.due_date && t.status !== "Completed").length} active deadlines</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-gray-100">Quick category & subject setup</h4>
              <p className="text-xs text-gray-500 mt-2">Create the labels you need for each study stream.</p>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3">
              <label className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Create Category</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Assignment, Exam prep"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 rounded-2xl bg-slate-950/70 border border-white/10 px-3 py-2 text-sm text-gray-200 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-2xl bg-white/5 px-4 py-2 text-sm font-semibold text-gray-100 hover:bg-white/10 transition"
                >
                  Add
                </button>
              </div>
            </form>

            <form onSubmit={handleAddSubject} className="space-y-3">
              <label className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Create Subject</label>
              <div className="grid grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Physics, Biology"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="col-span-8 rounded-2xl bg-slate-950/70 border border-white/10 px-3 py-2 text-sm text-gray-200 focus:outline-none"
                />
                <input
                  type="color"
                  value={newSubjectColor}
                  onChange={(e) => setNewSubjectColor(e.target.value)}
                  className="col-span-2 h-12 w-full rounded-2xl border border-white/10 bg-white/10"
                />
                <button
                  type="submit"
                  className="col-span-2 rounded-2xl bg-white/5 px-4 py-2 text-sm font-semibold text-gray-100 hover:bg-white/10 transition"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} title={editingId ? "Edit Task" : "New Task"} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Task Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Review Chemistry notes"
              required
              className="w-full rounded-2xl bg-slate-950/80 border border-white/10 px-4 py-3 text-sm text-gray-200 focus:outline-none"
            />
          </div>

          <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-950/80 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Quick presets</p>
                <p className="text-sm text-slate-400">Choose a workflow starter to prefill priority, recurrence, and due date.</p>
              </div>
              {presetTag && (
                <div className="flex items-center gap-2">
                  <span className="rounded-2xl bg-slate-900/90 px-3 py-2 text-xs font-semibold text-slate-200 uppercase tracking-[0.2em]">
                    {presetTag === "focus" ? "Focus Sprint" : presetTag === "review" ? "Review Session" : "Backlog Capture"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPresetTag("")}
                    className="rounded-2xl bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset("focus")}
                className={`rounded-2xl px-3 py-2 text-sm font-semibold transition ${presetTag === "focus" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/20"}`}
              >
                Focus Sprint
              </button>
              <button
                type="button"
                onClick={() => applyPreset("review")}
                className={`rounded-2xl px-3 py-2 text-sm font-semibold transition ${presetTag === "review" ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" : "bg-sky-500/15 text-sky-200 hover:bg-sky-500/20"}`}
              >
                Review Session
              </button>
              <button
                type="button"
                onClick={() => applyPreset("backlog")}
                className={`rounded-2xl px-3 py-2 text-sm font-semibold transition ${presetTag === "backlog" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15"}`}
              >
                Backlog Capture
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Priority</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full rounded-2xl bg-slate-950/80 border border-white/10 px-3 py-2 text-sm text-gray-200 focus:outline-none"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-2xl bg-slate-950/80 border border-white/10 px-3 py-2 text-sm text-gray-200 focus:outline-none"
              >
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-2xl bg-slate-950/80 border border-white/10 px-4 py-3 text-sm text-gray-200 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Due Date</label>
              <input
                name="due_date"
                type="date"
                value={form.due_date}
                onChange={handleChange}
                className="w-full rounded-2xl bg-slate-950/80 border border-white/10 px-3 py-2 text-sm text-gray-200 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Recurrence</label>
              <select
                name="recurrence"
                value={form.recurrence}
                onChange={handleChange}
                className="w-full rounded-2xl bg-slate-950/80 border border-white/10 px-3 py-2 text-sm text-gray-200 focus:outline-none"
              >
                <option>None</option>
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Subject</label>
              <select
                name="subject_id"
                value={form.subject_id}
                onChange={(e) => {
                  const subId = e.target.value;
                  const subName = subjects.find((s) => s.id === parseInt(subId))?.name || "";
                  setForm((prev) => ({ ...prev, subject_id: subId, subject: subName }));
                }}
                className="w-full rounded-2xl bg-slate-950/80 border border-white/10 px-3 py-2 text-sm text-gray-200 focus:outline-none"
              >
                <option value="">None</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Category</label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className="w-full rounded-2xl bg-slate-950/80 border border-white/10 px-3 py-2 text-sm text-gray-200 focus:outline-none"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400">Progress: {form.progress_pct}%</label>
            <input
              type="range"
              name="progress_pct"
              min="0"
              max="100"
              value={form.progress_pct}
              onChange={handleChange}
              className="w-full accent-primary h-2 rounded-full bg-slate-950/80"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400">Parent Task</label>
            <select
              name="parent_id"
              value={form.parent_id}
              onChange={handleChange}
              className="w-full rounded-2xl bg-slate-950/80 border border-white/10 px-3 py-2 text-sm text-gray-200 focus:outline-none"
            >
              <option value="">None / Root</option>
              {tasks.filter((t) => t.id !== editingId && !t.parent_id).map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-primary/90"
            >
              {editingId ? "Save Changes" : "Create Task"}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-gray-200 hover:bg-white/10 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
