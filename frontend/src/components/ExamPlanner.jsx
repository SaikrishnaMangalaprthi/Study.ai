import React, { useState, useEffect } from "react";
import api from "../utils/api";

export default function ExamPlanner() {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [subjectId, setSubjectId] = useState("");
  const [syllabusProgress, setSyllabusProgress] = useState(0);

  // Editing state
  const [editingExamId, setEditingExamId] = useState(null);

  const [activeTab, setActiveTab] = useState("Upcoming"); // Upcoming, Completed
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    loadExams();
    loadSubjects();
  }, []);

  async function loadExams() {
    try {
      const res = await api.get("/exams/");
      setExams(res.data);
    } catch {
      setErrorMsg("Failed to load exams.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSubjects() {
    try {
      const res = await api.get("/subjects/");
      setSubjects(res.data);
    } catch {}
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Exam title is required.");
      return;
    }
    
    const payload = {
      name,
      exam_date: examDate || null,
      priority,
      subject_id: subjectId ? parseInt(subjectId) : null,
      subject: subjects.find(s => s.id === parseInt(subjectId))?.name || "",
      syllabus_progress: parseInt(syllabusProgress)
    };

    try {
      if (editingExamId) {
        await api.put(`/exams/${editingExamId}`, payload);
        setSuccessMsg("Exam plan updated successfully!");
        setEditingExamId(null);
      } else {
        await api.post("/exams/", payload);
        setSuccessMsg("Exam plan scheduled successfully!");
      }
      // Reset form
      setName("");
      setExamDate("");
      setPriority("Medium");
      setSubjectId("");
      setSyllabusProgress(0);
      loadExams();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setErrorMsg("Failed to save exam details.");
    }
  }

  async function handleToggleStatus(exam) {
    const nextStatus = exam.status === "Upcoming" ? "Completed" : "Upcoming";
    try {
      await api.put(`/exams/${exam.id}`, { status: nextStatus });
      setSuccessMsg(`Exam marked as ${nextStatus}!`);
      setTimeout(() => setSuccessMsg(""), 3000);
      loadExams();
    } catch {
      setErrorMsg("Error updating status.");
    }
  }

  async function handleUpdateSyllabus(exam, progress) {
    try {
      await api.put(`/exams/${exam.id}`, { syllabus_progress: parseInt(progress) });
      // Update local state quickly for visual feedback
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, syllabus_progress: parseInt(progress) } : e));
    } catch {
      setErrorMsg("Failed to update progress.");
    }
  }

  function handleStartEdit(exam) {
    setEditingExamId(exam.id);
    setName(exam.name || "");
    setExamDate(exam.exam_date || "");
    setPriority(exam.priority || "Medium");
    setSubjectId(exam.subject_id || "");
    setSyllabusProgress(exam.syllabus_progress || 0);
  }

  async function handleDelete(examId) {
    if (!window.confirm("Are you sure you want to delete this exam planner?")) return;
    try {
      await api.delete(`/exams/${examId}`);
      setSuccessMsg("Exam planner deleted.");
      setTimeout(() => setSuccessMsg(""), 3000);
      loadExams();
    } catch {
      setErrorMsg("Error deleting exam.");
    }
  }

  const filteredExams = exams.filter(e => e.status === activeTab);
  
  // Calculate basic stats
  const totalUpcoming = exams.filter(e => e.status === "Upcoming").length;
  const avgSyllabus = exams.length > 0 
    ? Math.round(exams.reduce((acc, e) => acc + (e.syllabus_progress || 0), 0) / exams.length)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT PANEL: FORM & STATS */}
      <div className="space-y-6">
        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-xl font-bold text-gray-100">
            {editingExamId ? "✏️ Edit Exam Plan" : "📅 Plan New Exam"}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Exam Title</label>
              <input
                type="text"
                placeholder="e.g. Advanced Calculus Finals"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 text-sm border border-white/10 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Exam Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-black/40 text-sm border border-white/10 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-black/40 text-sm border border-white/10 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-primary"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-black/40 text-xs border border-white/10 rounded-xl px-2 py-2 text-gray-200 focus:outline-none focus:border-primary"
                >
                  <option value="">Select subject...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Syllabus Prep ({syllabusProgress}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={syllabusProgress}
                  onChange={(e) => setSyllabusProgress(e.target.value)}
                  className="w-full accent-primary h-2 bg-black/40 rounded-lg cursor-pointer mt-3"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-sm transition"
              >
                {editingExamId ? "Update Plan" : "Schedule Exam"}
              </button>
              {editingExamId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingExamId(null);
                    setName("");
                    setExamDate("");
                    setPriority("Medium");
                    setSubjectId("");
                    setSyllabusProgress(0);
                  }}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Stats Card */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-gray-100">Analytics Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/30 p-4 rounded-xl text-center">
              <span className="text-2xl font-bold text-primary">{totalUpcoming}</span>
              <span className="text-[10px] text-gray-400 block mt-1 uppercase font-bold">Upcoming</span>
            </div>
            <div className="bg-black/30 p-4 rounded-xl text-center">
              <span className="text-2xl font-bold text-emerald-400">{avgSyllabus}%</span>
              <span className="text-[10px] text-gray-400 block mt-1 uppercase font-bold">Avg Prepared</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: EXAM LIST (Cols 2-3) */}
      <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col space-y-4">
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

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {["Upcoming", "Completed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 px-4 text-sm font-semibold border-b-2 transition ${
                activeTab === tab 
                  ? "border-primary text-primary" 
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab} ({exams.filter(e => e.status === tab).length})
            </button>
          ))}
        </div>

        {/* Exam items list */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading exams...</div>
        ) : (
          <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
            {filteredExams.map((exam) => {
              const priorityColor = 
                exam.priority === "High" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                exam.priority === "Medium" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                "bg-blue-500/20 text-blue-400 border border-blue-500/30";

              return (
                <div
                  key={exam.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${priorityColor}`}>
                        {exam.priority}
                      </span>
                      {exam.subject && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full text-white font-semibold"
                          style={{ backgroundColor: exam.subject_color || "#3b82f6" }}
                        >
                          {exam.subject}
                        </span>
                      )}
                      {exam.status === "Upcoming" && exam.countdown !== null && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-black/40 ${
                          exam.countdown <= 3 ? "text-red-400 animate-pulse" : "text-gray-300"
                        }`}>
                          {exam.countdown === 0 ? "Today!" : exam.countdown < 0 ? "Overdue" : `${exam.countdown} days left`}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-gray-100">{exam.name}</h3>

                    {exam.exam_date && (
                      <p className="text-xs text-gray-400">
                        📅 Exam Date: <span className="font-mono text-gray-300">{exam.exam_date}</span>
                      </p>
                    )}

                    {/* Syllabus progress bar and slider */}
                    <div className="space-y-1.5 max-w-sm">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Syllabus Prep</span>
                        <span>{exam.syllabus_progress}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                            style={{ width: `${exam.syllabus_progress}%` }}
                          />
                        </div>
                        {exam.status === "Upcoming" && (
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={exam.syllabus_progress}
                            onChange={(e) => handleUpdateSyllabus(exam, e.target.value)}
                            className="w-16 accent-primary h-1 bg-black/20 rounded cursor-pointer"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex sm:flex-col justify-end items-end gap-2">
                    <button
                      onClick={() => handleToggleStatus(exam)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                        exam.status === "Upcoming" 
                          ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {exam.status === "Upcoming" ? "Mark Complete" : "Reopen Plan"}
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartEdit(exam)}
                        className="px-2 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 rounded text-xs transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(exam.id)}
                        className="px-2 py-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded text-xs transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredExams.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <span className="text-3xl block mb-2">🎈</span>
                <p className="text-sm">No exams found in this category.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
