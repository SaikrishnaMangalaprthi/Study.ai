import React, { useEffect, useState } from "react";
import api from "../utils/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const EMPTY_FORM = {
  exam_name: "",
  subject: "",
  obtained: "",
  total: "",
  date: "",
  subject_id: "",
};

export default function ScoreList() {
  const [scores, setScores] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchScores();
    fetchSubjects();
  }, []);

  async function fetchScores() {
    try {
      const { data } = await api.get("/scores/");
      setScores(data);
    } catch {
      setError("Failed to load scores");
    }
  }

  async function fetchSubjects() {
    try {
      const { data } = await api.get("/subjects/");
      setSubjects(data || []);
    } catch {}
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const payload = {
      exam_name: form.exam_name,
      subject: form.subject || "",
      obtained: Number(form.obtained),
      total: Number(form.total),
      date: form.date || null,
      subject_id: form.subject_id ? parseInt(form.subject_id) : null,
    };
    try {
      if (editingId) {
        await api.put(`/scores/${editingId}`, payload);
        setEditingId(null);
      } else {
        await api.post("/scores/", payload);
      }
      setForm(EMPTY_FORM);
      fetchScores();
    } catch (err) {
      setError(err.response?.data?.msg || "Save failed");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this score?")) return;
    try {
      await api.delete(`/scores/${id}`);
      fetchScores();
    } catch {
      setError("Delete failed");
    }
  }

  function startEdit(s) {
    setEditingId(s.id);
    setForm({
      exam_name: s.exam_name || "",
      subject: s.subject || "",
      obtained: s.obtained ?? "",
      total: s.total ?? "",
      date: s.date ? s.date.split("T")[0] : "",
      subject_id: s.subject_id || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  const pctColor = (pct) => {
    if (pct >= 80) return "text-green-400";
    if (pct >= 60) return "text-accent";
    return "text-red-400";
  };

  // Chart data
  const chartData = {
    labels: scores.map((s) => s.exam_name || `#${s.id}`),
    datasets: [
      {
        label: "Score %",
        data: scores.map((s) =>
          s.total ? Math.round((s.obtained / s.total) * 100) : 0
        ),
        backgroundColor: scores.map((s) => {
          const pct = s.total ? (s.obtained / s.total) * 100 : 0;
          return pct >= 80 ? "hsl(142,76%,36%)" : pct >= 60 ? "hsl(45,85%,55%)" : "hsl(0,72%,51%)";
        }),
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}%` } },
    },
    scales: {
      y: {
        max: 100,
        ticks: { color: "#9ca3af", callback: (v) => `${v}%` },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
      x: {
        ticks: { color: "#9ca3af", maxRotation: 30 },
        grid: { display: false },
      },
    },
  };

  const pctValues = scores.map(s => s.total ? (s.obtained / s.total) * 100 : 0);
  const avgScore = pctValues.length > 0 ? Math.round(pctValues.reduce((a, b) => a + b, 0) / pctValues.length) : 0;
  const highestScore = pctValues.length > 0 ? Math.round(Math.max(...pctValues)) : 0;
  const lowestScore = pctValues.length > 0 ? Math.round(Math.min(...pctValues)) : 0;

  // Group scores by subject for weak subjects detection
  const subjectAverages = {};
  scores.forEach(s => {
    if (!s.subject) return;
    const subName = s.subject.trim();
    if (!subjectAverages[subName]) subjectAverages[subName] = [];
    subjectAverages[subName].push(s.total ? (s.obtained / s.total) * 100 : 0);
  });
  const weakSubjects = [];
  Object.keys(subjectAverages).forEach(sub => {
    const avg = subjectAverages[sub].reduce((a, b) => a + b, 0) / subjectAverages[sub].length;
    if (avg < 65) {
      weakSubjects.push({ subject: sub, avgScore: Math.round(avg) });
    }
  });

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-primary">Exam Scores</h2>

      {/* Stats Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-md flex flex-col justify-center text-center">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Average Score</span>
          <div className="text-3xl font-extrabold text-accent mt-2">{avgScore}%</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-md flex flex-col justify-center text-center">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Highest Score</span>
          <div className="text-3xl font-extrabold text-green-400 mt-2">{highestScore}%</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-md flex flex-col justify-center text-center">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Lowest Score</span>
          <div className="text-3xl font-extrabold text-red-400 mt-2">{lowestScore}%</div>
        </div>
      </div>

      {/* Weak subject warnings */}
      {weakSubjects.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs">
          <span className="font-bold text-red-400 block mb-2">⚠️ Weak Subjects Detected (Avg &lt; 65%):</span>
          <div className="flex flex-wrap gap-3">
            {weakSubjects.map((ws, i) => (
              <span key={i} className="bg-black/40 border border-red-500/20 px-3 py-1 rounded-full text-gray-200">
                {ws.subject} ({ws.avgScore}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      {scores.length > 0 && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm text-gray-400 mb-4 font-medium uppercase tracking-wider">Performance Overview</h3>
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}

      {scores.length === 0 && (
        <p className="text-gray-400 text-sm">No scores yet. Log one below!</p>
      )}

      {/* Score cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {scores.map((s) => {
          const pct = s.total ? Math.round((s.obtained / s.total) * 100) : 0;
          return (
            <div
              key={s.id}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg hover:border-accent/40 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100">{s.exam_name}</h3>
                  {s.subject && <p className="text-xs text-gray-400 mt-0.5">{s.subject}</p>}
                </div>
                <span className={`text-2xl font-bold ${pctColor(pct)}`}>{pct}%</span>
              </div>
              <p className="mt-2 text-sm text-gray-300">
                {s.obtained} / {s.total}
              </p>
              {s.date && (
                <p className="text-xs text-gray-500 mt-1">
                  📅 {new Date(s.date).toLocaleDateString()}
                </p>
              )}
              <div className="mt-4 flex space-x-2">
                <button
                  id={`edit-score-${s.id}`}
                  onClick={() => startEdit(s)}
                  className="px-3 py-1.5 text-xs bg-accent/20 hover:bg-accent/40 border border-accent/30 rounded-lg transition text-accent"
                >
                  Edit
                </button>
                <button
                  id={`delete-score-${s.id}`}
                  onClick={() => handleDelete(s.id)}
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
        className="max-w-xl bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4"
      >
        <h3 className="text-lg font-semibold text-gray-100">
          {editingId ? "Edit Score" : "Log New Score"}
        </h3>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="grid grid-cols-2 gap-4">
          <input
            id="score-exam-name"
            name="exam_name"
            value={form.exam_name}
            onChange={handleChange}
            placeholder="Exam name"
            required
            className="col-span-2 rounded-lg px-4 py-2.5 bg-white/10 border border-white/10 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <select
            id="score-subject-id"
            name="subject_id"
            value={form.subject_id}
            onChange={(e) => {
              const subId = e.target.value;
              const subName = subjects.find(s => s.id === parseInt(subId))?.name || "";
              setForm(prev => ({ ...prev, subject_id: subId, subject: subName }));
            }}
            className="rounded-lg px-4 py-2.5 bg-white/10 border border-white/10 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
          >
            <option value="">Link Subject...</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input
            id="score-date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className="rounded-lg px-4 py-2.5 bg-white/10 border border-white/10 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <input
            id="score-obtained"
            name="obtained"
            type="number"
            value={form.obtained}
            onChange={handleChange}
            placeholder="Obtained"
            required
            className="rounded-lg px-4 py-2.5 bg-white/10 border border-white/10 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <input
            id="score-total"
            name="total"
            type="number"
            value={form.total}
            onChange={handleChange}
            placeholder="Total"
            required
            className="rounded-lg px-4 py-2.5 bg-white/10 border border-white/10 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            id="score-submit"
            type="submit"
            className="flex-1 py-2.5 bg-accent hover:bg-accent/80 rounded-lg font-semibold text-gray-900 transition shadow-lg shadow-accent/20"
          >
            {editingId ? "Update Score" : "Log Score"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-gray-300 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
